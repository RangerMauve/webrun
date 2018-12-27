const urlToPath = require('../lib/url-to-path')
const ensureExists = require('../lib/prepare-dir')

const MutableWebTorrent = require('mutable-webtorrent')

function TorrentPlugin (webrun) {
  const { TORRENTCACHE } = webrun.options

  let client = null

  webrun.addProtocol('btih:', async (url) => {
    const magnet = `magnet:?xt=urn:btih:${url.hostname}`

    return getFile(magnet, url.hostname, url.pathname)
  })

  webrun.addProtocol('btpk:', async (url) => {
    const magnet = `magnet:?xs=urn:btpk:${url.hostname}`

    return getFile(magnet, url.hostname, url.pathname)
  })

  var LOADED_TORRENTS = {}

  function getFile (magnet, id, filepath) {
    if (filepath[0] === '/') {
      filepath = filepath.slice(1)
    }
    return new Promise((resolve, reject) => {
      getTorrent(magnet, id).then((torrent) => {
        const { files } = torrent

        const file = files.find((file) => {
          return file.path.replace(/\\/g, '/') === filepath
        })

        if (!file) return reject(new Error(`Couldn't find file ${filepath} in torrent ${magnet}`))

        file.getBuffer((err, buffer) => {
          if (err) return reject(err)
          resolve(buffer.toString('utf8'))
        })
      }).catch(reject)
    })
  }

  function getTorrent (magnet, id) {
    if (LOADED_TORRENTS[id]) {
      return Promise.resolve(LOADED_TORRENTS[id])
    }

    var promise = new Promise((resolve, reject) => {
      const client = getClient()

      const path = urlToPath(new URL(id, TORRENTCACHE))

      client.add(magnet, {
        path
      }, (torrent) => {
        LOADED_TORRENTS[id] = torrent

        resolve(torrent)
      })
    })

    LOADED_TORRENTS[id] = promise

    return promise
  }

  function getClient () {
    if (client) return client

    ensureExists(TORRENTCACHE)

    client = new MutableWebTorrent()

    return client
  }
}

module.exports = TorrentPlugin
