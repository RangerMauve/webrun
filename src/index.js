
const Webrun = require('./Webrun')

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

const CACHE = new URL('.webrun/', baseURL)
const LOCALSTORAGECACHE = new URL('localstorage/', CACHE)
const WEBCACHE = new URL('webcache/', CACHE)
const DATCACHE = new URL('datcache/', CACHE)

const BrowserPlugin = require('./plugins/browser')
const NodePlugin = require('./plugins/node')
const FilePlugin = require('./plugins/file')
const HTTPSPlugin = require('./plugins/https')
const DatPlugin = require('./plugins/dat')

const DEFAULT_OPTIONS = {
  baseURL,
  LOCALSTORAGECACHE,
  DATCACHE,
  WEBCACHE,
  allowRequire: false
}

class DefaultWebrun extends Webrun {
  constructor (options) {
    super(Object.assign({}, DEFAULT_OPTIONS, options))

    this
      .addPlugin(BrowserPlugin)
      .addPlugin(NodePlugin)
      .addPlugin(FilePlugin)
      .addPlugin(HTTPSPlugin)
      .addPlugin(DatPlugin)
  }
}

module.exports = DefaultWebrun
