const urlToPath = require('../lib/url-to-path')
const ensureExists = require('../lib/prepare-dir')

const NOT_LOADED_ERROR = 'Please use DatArchive.load() to load archives. https://github.com/beakerbrowser/dat-node/issues/4'

function DatPlugin (webrun) {
  const { DATCACHE } = webrun.options

  let dat = null
  let DatArchive = null

  webrun.addProtocol('dat:', async function getDat (url) {
    const DatArchive = getDatArchive()
    const parentURL = `dat://${url.hostname}`

    const archive = await DatArchive.load(parentURL)

    return archive.readFile(url.pathname, 'utf8')
  })

  webrun.addGlobal('DatArchive', getDatArchive)

  function getDat () {
    if (!dat) {
      ensureExists(DATCACHE)

      const { createNode } = require('@beaker/dat-node')
      dat = createNode({ path: urlToPath(DATCACHE) })
    }

    return dat
  }

  function getDatArchive () {
    if (!DatArchive) {
      DatArchive = makeDatArchive(getDat())
    }

    return DatArchive
  }
}

function makeDatArchive (dat) {
  class DatArchive {
    constructor (url) {
      this.url = url

      this._archive = null
      this._loadPromise = DatArchive.load(url).then((archive) => {
        this._archive = archive
        this._loadPromise = null
      })
    }

    async getInfo (url, opts = {}) {
      await this._loadPromise
      return this._archive.getInfo(url, opts)
    }

    async configure (settings) {
      await this._loadPromise
      this._archive.configure(settings)
    }

    async diff () {
      await this._loadPromise
      return this._archive.diff()
    }

    async commit () {
      await this._loadPromise
      return this._archive.commit()
    }

    async revert () {
      await this._loadPromise
      return this._archive.revert()
    }

    async stat (filepath, opts = {}) {
      await this._loadPromise
      return this._archive.stat(filepath, opts)
    }

    async readFile (filepath, opts = {}) {
      await this._loadPromise
      return this._archive.readFile(filepath, opts)
    }

    async writeFile (filepath, data, opts = {}) {
      await this._loadPromise
      return this._archive.writeFile(filepath, data, opts)
    }

    async unlink (filepath) {
      await this._loadPromise
      return this._archive.unlink(filepath)
    }

    async download (filepath, opts = {}) {
      await this._loadPromise
      return this._archive.download(filepath, opts)
    }

    async readdir (filepath, opts = {}) {
      await this._loadPromise
      return this._archive.readdir(filepath, opts)
    }

    async mkdir (filepath) {
      await this._loadPromise
      return this._archive.mkdir(filepath)
    }

    async rmdir (filepath, opts = {}) {
      await this._loadPromise
      return this._archive.rmdir(filepath, opts)
    }

    async copy (path, dstPath, opts) {
      await this._loadPromise
      return this._archive.copt(path, dstPath, opts)
    }

    async rename (filepath, dstpath, opts) {
      await this._loadPromise
      return this._archive.rename(filepath, dstpath, opts)
    }

    history (opts) {
      if (this._loadPromise) throw new TypeError(NOT_LOADED_ERROR)
      return this._archive.history(opts)
    }

    checkout (opts) {
      if (this._loadPromise) throw new TypeError(NOT_LOADED_ERROR)
      return this._archive.checkout(opts)
    }

    watch (pattern, onInvalidated) {
      if (this._loadPromise) throw new TypeError(NOT_LOADED_ERROR)
      return this._archive.watch(pattern, onInvalidated)
    }

    static async load (url) {
      const resolved = await DatArchive.resolveName(url)

      return dat.getArchive(resolved)
    }

    static async create (options) {
      return dat.createArchive(options)
    }

    static async fork (url, opts) {
      const resolved = await DatArchive.resolveName(url)

      return dat.forkArchive(resolved, opts)
    }

    static async selectArchive (options) {
      console.warn('selectArchive is not supported in WebRun since there is no UI')

      return DatArchive.create(options)
    }

    static async resolveName (url) {
      return dat.dns.resolve(url)
    }

    static async unlink (url) {
      const resolved = await DatArchive.resolveName(url)

      return dat.storage.delete(resolved)
    }
  }

  return DatArchive
}

module.exports = DatPlugin
