const mkdirp = require('mkdirp').sync
const urlToPath = require('./url-to-path')

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

module.exports = function ensureExists (url) {
  const location = urlToPath(url)
  mkdirp(location)
}
