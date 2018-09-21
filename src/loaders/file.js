const fs = require('fs-extra')

const urlToPath = require('../lib/url-to-path')

// factory for generating file loaders
module.exports = () => async function getFile (url) {
  const location = urlToPath(url)
  return fs.readFile(location, 'utf8')
}
