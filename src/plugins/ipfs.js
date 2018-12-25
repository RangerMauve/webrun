const urlToPath = require('../lib/url-to-path')
const ensureExists = require('../lib/prepare-dir')

const IPFS = require('ipfs')

function IPFSPlugin (webrun) {
  const { IPFSCACHE } = webrun.options

  let ipfs = null

  webrun.addProtocol('ipfs:', async function getIPFSFile (url) {
    const path = url.pathname

    const hash = url.hostname

    const finalURL = `/ipfs/${hash}${path}`

    return getContent(finalURL)
  })

  webrun.addProtocol('ipns:', async function getIPNSFile (url) {
    const ipfs = getIPFS()

    const path = url.pathname

    const hostname = url.hostname

    const hash = await ipfs.name.resolve(`ipns/${hostname}`)

    const finalURL = `${hash}${path}`

    return getContent(finalURL)
  })

  webrun.addGlobal('ipfs', getIPFS)

  async function getContent (url) {
    const ipfs = getIPFS()

    const result = await ipfs.get(url)

    const { content } = result[0]

    const textContent = content.toString('utf8')

    return textContent
  }

  function getIPFS () {
    if (ipfs) return ipfs

    ensureExists(IPFSCACHE)

    ipfs = new IPFS({
      repo: urlToPath(IPFSCACHE)
    })

    return ipfs
  }
}

module.exports = IPFSPlugin
