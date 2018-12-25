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
    this._contextModifiers = []
    this._globals = {}
    this._globalCache = {}
    this._protocols = {}
    this.context = null

    this.linker = async (specifier, referencingModule) => {
      const url = new URL(specifier, referencingModule.url)
      return this.loadModule(url)
    }

    this.addGlobal('_import', () => this.import.bind(this))
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

    let contextVars = {}

    for (let modifier of this._contextModifiers) {
      contextVars = await modifier(contextVars, this)

      if (!contextVars) {
        throw new Error(`Handler didn't return new globals "${modifier}"`)
      }
    }

    // For each global, add a new getter, use memoization so the actual getter only needs to be invoked once it's needed
    const globalNames = Object.keys(this._globals)
    const globalCache = this._globalCache
    for (let globalName of globalNames) {
      const getter = this._globals[globalName]
      // Don't use arrow functions to preserve the `this` context
      const getMemoized = function () {
        if (!globalCache[globalName]) {
          globalCache[globalName] = getter.call(this)
        }
        return globalCache[globalName]
      }

      Object.defineProperty(contextVars, globalName, {
        get: getMemoized
      })
    }

    const context = vm.createContext(contextVars, {
      name: 'Webrun'
    })

    this.context = context

    this.vmOptions = {
      context: context,
      initializeImportMeta: (meta, module) => {
        meta.url = module.url.toString()
        meta._import = (path) => this.import(path, module.url)
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

  addContextModifier (handler) {
    this._contextModifiers.push(handler)

    return this
  }

  addGlobal (name, getter) {
    if (this._globals[name]) {
      throw new Error(`Global already registered: ${name}`)
    }

    this._globals[name] = getter

    return this
  }
}

module.exports = Webrun

function injectImport (content) {
  return content.replace(/([ \t]+)import\(/g, ' import.meta._import(')
}
