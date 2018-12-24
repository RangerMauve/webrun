const urlToPath = require('../lib/url-to-path')
const ensureExists = require('../lib/prepare-dir')

const IPFS = require('ipfs')

function IPFSPlugin (webrun) {
  const { IPFSCACHE } = webrun.options

  let ipfs = null

  webrun.addProtocol('ipfs:', async function getIPFSFile (url) {
    const ipfs = getIPFS()

    const path = url.pathname

    const hash = url.hostname

    const finalURL = `/ipfs/${hash}${path}`

    const result = await ipfs.get(finalURL)

    const { content } = result[0]

    const moduleContent = content.toString('utf8')

    return moduleContent
  })

  webrun.addProtocol('ipns:', async function getIPNSFile (url) {
    const ipfs = getIPFS()

    const path = url.pathname

    const hostname = url.hostname

    const hash = await ipfs.name.resolve(`ipns/${hostname}`)

    const finalURL = `${hash}${path}`

    const result = await ipfs.get(finalURL)

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
