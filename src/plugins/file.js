
const fs = require('fs-extra')

const urlToPath = require('../lib/url-to-path')

function FilePlugin (webrun) {
  webrun.addProtocol('file:', async function getFile (url) {
    const location = urlToPath(url)
    return fs.readFile(location, 'utf8')
  })
}

module.exports = FilePlugin
