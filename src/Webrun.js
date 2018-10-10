const vm = require('vm')

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

const DEFAULT_OPTIONS = {
  baseURL
}

class Webrun {
  constructor (options = DEFAULT_OPTIONS) {
    this.options = options
    this._modules = {}
    this._plugins = []
    this._globalHandlers = []
    this._protocols = {}
    this.context = null

    this.linker = async (specifier, referencingModule) => {
      const url = new URL(specifier, referencingModule.url)
      return this.loadModule(url)
    }
  }

  async import (path, base = baseURL) {
    const url = new URL(path, base)
    const module = await this.loadModule(url)

    if (module.status !== 'instantiated') {
      module.instantiate()
    }
    if (module.status !== 'evaluated') {
      await module.evaluate()
    }

    return module.namespace
  }

  async loadModule (url) {
    const content = await this.getContent(url)

    return this.loadFrom(content, url)
  }

  async loadFrom (content, url) {
    const cleaned = injectImport(content)

    const options = Object.assign({
      url: url.toString()
    }, this.vmOptions)

    const module = new vm.SourceTextModule(
      cleaned,
      options
    )

    this._modules[url] = module

    await module.link(this.linker)

    return module
  }

  async getContent (url) {
    const protocol = url.protocol

    const protocolHandler = this._protocols[protocol]

    if (!protocolHandler) throw new Error(`Protocol not supported "${protocol}" in "${url}"`)

    const content = await protocolHandler(url)

    return content
  }

  async run ({ url = null } = {}) {
    for (let plugin of this._plugins) {
      await plugin(this)
    }

    const _import = this.import.bind(this)

    let contextVars = {
      get _import () {
        return _import
      }
    }

    for (let addGlobals of this._globalHandlers) {
      contextVars = await addGlobals(contextVars, this)

      if (!contextVars) {
        throw new Error(`Handler didn't return new globals "${addGlobals}"`)
      }
    }

    const context = vm.createContext(contextVars, {
      name: 'Webrun'
    })

    this.context = context

    this.vmOptions = {
      context: context,
      initializeImportMeta: (meta, module) => {
        meta.url = module.url.toString()
        meta._import = (path) => this._import(path, module.url)
      }
    }

    if (url) {
      // Load the initial module
      await this.import(url)
    }
  }

  addPlugin (plugin) {
    this._plugins.push(plugin)

    return this
  }

  addProtocol (protocol, handler) {
    this._protocols[protocol] = handler

    return this
  }

  addGlobals (handler) {
    this._globalHandlers.push(handler)

    return this
  }
}

module.exports = Webrun

function injectImport (content) {
  return content.replace(/([ \t]+)import\(/g, ' import.meta._import(')
}
