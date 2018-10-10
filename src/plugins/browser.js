const vm = require('vm')
const crypto = require('crypto')
const { URLSearchParams } = require('url')
const os = require('os')
const sep = require('path').sep

const fetch = require('node-fetch')
const FormData = require('form-data')
const Websocket = require('ws')

const { bota, atob } = require('abab')
const { TextEncoder, TextDecoder } = require('text-encoder')

const { LocalStorage } = require('node-localstorage')

const EventTarget = require('event-target').default

const urlToPath = require('../lib/url-to-path')

const prepareDir = require('../lib/prepare-dir')

class Crypto {
  getRandomValues (buffer) {
    return crypto.randomFillSync(buffer)
  }
}

function BrowserPlugin (webrun) {
  const { LOCALSTORAGECACHE } = webrun.options

  webrun.addGlobals((defaultVars) => {
    const localStorage = new LocalStorage(urlToPath(LOCALSTORAGECACHE))

    const sessionId = process.ppid
    const SESSIONSTORAGEPATH = new URL(`file://${os.tmpdir()}${sep}.webrun${sep}/session-${sessionId}`)
    prepareDir(SESSIONSTORAGEPATH)
    const sessionStorage = new LocalStorage(urlToPath(SESSIONSTORAGEPATH))

    const crypto = new Crypto()

    const contextVars = new EventTarget()

    Object.assign(contextVars, defaultVars, {
      // Some expected builtins
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      EventTarget,
      URL,

      // Text manipluation
      bota,
      atob,
      TextEncoder,
      TextDecoder,

      // Encryption
      crypto,

      // Networking
      fetch,
      FormData,
      URLSearchParams,
      Websocket,

      // Storage / Caching
      localStorage,
      sessionStorage

    });

    ['window', 'global', 'self'].forEach((name) => {
      Object.defineProperty(contextVars, name, {
        get: function () {
          return this
        }
      })
    })

    const context = vm.createContext(contextVars, {
      name: 'WebRun'
    })

    return context
  })
}

module.exports = BrowserPlugin
