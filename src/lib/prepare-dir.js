const mkdirp = require('mkdirp').sync
const cleanURL = require('./clean-url')

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

module.exports = function ensureExists (url) {
  const location = cleanURL(url)
  mkdirp(location)
}
