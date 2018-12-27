const fs = require('fs-extra')
const MutableWebTorrent = require('mutable-webtorrent')

const urlToPath = require('../lib/url-to-path')
const ensureExists = require('../lib/prepare-dir')

const BT_INFOHASH = 'btih:'
const BT_PUBLIC_KEY = 'btpk:'
const MAGNET_PROTOCOL = 'magnet:'

// 10 minutes
const REPUBLISH_DELAY = 10 * 60 * 1000

function TorrentPlugin (webrun) {
  const { TORRENTCACHE } = webrun.options

  let client = null
  const credentials = new CredentialManager(new URL('keys', TORRENTCACHE))

  webrun.addProtocol(BT_INFOHASH, async (url) => {
    const magnet = makeInfoHashMagnet(url.hostname)

    return getFile(magnet, url.hostname, url.pathname)
  })

  webrun.addProtocol(BT_PUBLIC_KEY, async (url) => {
    const magnet = makePublicKeyMagnet(url.hostname)

    return getFile(magnet, url.hostname, url.pathname)
  })

  webrun.addGlobal('torrent', () => TorrentAPI)

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

        torrent.deselect(0, torrent.pieces.length - 1, false)

        if (torrent.publicKey) {
          startRepublishing(id)
        }

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

  function makeInfoHashMagnet (id) {
    return `${MAGNET_PROTOCOL}?xt=urn:btih:${id}`
  }

  function makePublicKeyMagnet (id) {
    return `${MAGNET_PROTOCOL}?xs=urn:btpk:${id}`
  }

  class TorrentAPI {
    static async load (magnet) {
      const parsed = new URL(magnet)
      if (parsed.protocol === BT_INFOHASH) {
        magnet = new URL(makeInfoHashMagnet(parsed.hostname))
      } else if (parsed.protocol === BT_PUBLIC_KEY) {
        magnet = new URL(makePublicKeyMagnet(parsed.hostname))
      }
      const id = parsed.searchParams.get('xs') || parsed.searchParams.get('xt')

      const torrent = await getTorrent(magnet, id)

      return makeTorrent(torrent, id)
    }

    static async create (files, options) {
      if (!Array.isArray(files)) throw new TypeError('Must pass a list of files')

      const { name, comments, createdBy, createdDate } = options

      const client = getClient()

      const { publicKey, secretKey } = client.createKeypair()

      const finalOptions = { name, comments, createdBy, createdDate }

      const torrent = await createTorrent(files, finalOptions, publicKey, secretKey)

      await credentials.save(publicKey, secretKey)

      startRepublishing(publicKey)

      return makeTorrent(torrent, publicKey)
    }
  }

  const REPUBLISHMAP = {}

  function startRepublishing (id) {
    if (REPUBLISHMAP[id]) return
    REPUBLISHMAP[id] = setInterval(() => {
      const client = getClient()

      client.republish(id)
    }, REPUBLISH_DELAY)
  }

  function createTorrent (files, options, publicKey, secretKey) {
    const client = getClient()

    const path = urlToPath(new URL(publicKey, TORRENTCACHE))

    const processedFiles = files.map((file) => {
      const { name, path } = file

      if (!name) throw new TypeError(`All files must have a 'name' property`)
      if (!path) throw new TypeError(`All files must have a 'path' property`)

      const buffer = Buffer.from(file)

      Object.assign(buffer, {
        name, path
      })

      return buffer
    })

    return new Promise((resolve, reject) => {
      client.seed(processedFiles, { path, ...options }, (torrent) => {
        torrent.publicKey = publicKey

        const infoHash = torrent.infoHash.toString('hex')
        client.publish(publicKey, secretKey, infoHash, (err) => {
          if (err) reject(err)
          else resolve(torrent)
        })
      })
    })
  }

  function makeTorrent (torrent, id) {
    const files = torrent.files.map(makeFile)

    return {
      get files () {
        return files
      },
      get infoHash () {
        return torrent.infoHash.toString('hex')
      },
      get magnetURI () {
        let uri = torrent.magnetURI
        const publicKey = this.publicKey

        uri += `&` + makePublicKeyMagnet(publicKey).slice(MAGNET_PROTOCOL.length + 1)

        return uri
      },
      get url () {
        const publicKey = this.publicKey
        if (publicKey) {
          return makePublicKeyMagnet(publicKey)
        } else {
          return makeInfoHashMagnet(this.infoHash)
        }
      },
      get publicKey () {
        return torrent.publicKey.toString('hex')
      },
      get sequence () {
        return torrent.sequence
      },
      async update (files, options = {}) {
        if (!torrent.publicKey) throw new Error(`Cannot update torrent: No Public Key`)
        const hasKey = await credentials.has(id)
        if (!hasKey) throw new Error('Cannot update torrent: No Secret Key')
        const privateKey = await credentials.get(id)

        torrent.destroy()

        const finalOptions = { ...torrent.metadata }
        for (let key of ['name', 'comments', 'createdBy', 'createdDate']) {
          if (options[key]) {
            finalOptions[key] = options[key]
          }
        }

        torrent = await createTorrent(files, finalOptions, torrent.publicKey, privateKey)

        TORRENTCACHE[torrent.publicKey] = torrent

        return this
      }
    }
  }

  function makeFile (file) {
    return {
      get name () {
        return file.name
      },
      get path () {
        return file.path
      },
      get length () {
        return file.length
      },
      get progress () {
        return file.progress
      },
      getArrayBuffer () {
        return new Promise((resolve, reject) => {
          file.getBuffer((err, buffer) => {
            if (err) reject(err)
            else resolve(buffer.buffer)
          })
        })
      }
    }
  }
}

class CredentialManager {
  constructor (directory) {
    this.directory = directory
  }
  async has (publicKey) {
    const path = this.resolvePath(publicKey)
    try {
      const stats = await fs.stat(path)
      return stats.isFile()
    } catch (err) {
      return false
    }
  }

  async get (publicKey) {
    const path = this.resolvePath(publicKey)

    return fs.readFile(path, 'utf8')
  }

  async save (publicKey, secretKey) {
    const path = this.resolvePath(publicKey)

    return fs.writeFile(path, secretKey, 'utf8')
  }

  async list () {
    const path = this.resolvePath(this.directory)

    return fs.readdir(path)
  }

  resolvePath (publicKey) {
    return urlToPath(new URL(publicKey, this.directory))
  }
}

module.exports = TorrentPlugin
