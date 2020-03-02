const Webrun = require('./Webrun')

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

const CACHE = new URL('.webrun/', baseURL)
const LOCALSTORAGECACHE = new URL('localstorage/', CACHE)
const WEBCACHE = new URL('webcache/', CACHE)

const BrowserPlugin = require('./plugins/browser')
const NodePlugin = require('./plugins/node')
const FilePlugin = require('./plugins/file')
const HTTPSPlugin = require('./plugins/https')

try {
  var IPFSPlugin = require('webrun-plugin-ipfs')
} catch (e) {
  // Probably not installed
}

try {
  var DatPlugin = require('webrun-plugin-dat')
} catch (e) {
  // Probably not installed
}

const DEFAULT_OPTIONS = {
  baseURL,
  CACHE,
  LOCALSTORAGECACHE,
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

    if (IPFSPlugin) { this.addPlugin(IPFSPlugin) }

    if (DatPlugin) { this.addPlugin(DatPlugin) }
  }
}

module.exports = DefaultWebrun
