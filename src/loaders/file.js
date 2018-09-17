const fs = require('fs-extra')

const cleanURL = require('../lib/clean-url')

// factory for generating file loaders
module.exports = () => async function getFile (url) {
  const location = cleanURL(url)
  return fs.readFile(location, 'utf8')
}
