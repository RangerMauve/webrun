const urlToPath = require('../lib/url-to-path')
const ensureExists = require('../lib/prepare-dir')

const IPFS = require('ipfs')

function IPFSPlugin (webrun) {
  const { IPFSCACHE } = webrun.options

  let ipfs = null

  webrun.addProtocol('ipfs:', async function getIPFSFile (url) {
    const ipfs = getIPFS()

    const path = url.pathname

    const result = await ipfs.get(`/ipfs/${url.hostname}${path}`)

    const { content } = result[0]

    const moduleContent = content.toString('utf8')

    return moduleContent
  })

  webrun.addGlobal('ipfs', getIPFS)

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
