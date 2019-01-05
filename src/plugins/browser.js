const crypto = require('crypto')
const os = require('os')
const sep = require('path').sep

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

  function returnThis () {
    return this
  }

  // Globals
  webrun.addGlobal('global', returnThis)
  webrun.addGlobal('self', returnThis)
  webrun.addGlobal('window', returnThis)

  // Some expected builtins
  webrun.addGlobal('console', () => console)

  webrun.addGlobal('setTimeout', () => setTimeout)
  webrun.addGlobal('clearTimeout', () => clearTimeout)
  webrun.addGlobal('setInterval', () => setInterval)
  webrun.addGlobal('clearInterval', () => clearInterval)
  webrun.addGlobal('EventTarget', () => EventTarget)
  webrun.addGlobal('URL', () => URL)

  // Text manipluation
  webrun.addGlobal('bota', () => require('abab').btoa)
  webrun.addGlobal('atob', () => require('abab').atob)
  webrun.addGlobal('TextEncoder', () => require('text-encoder').TextEncoder)
  webrun.addGlobal('TextDecoder', () => require('text-encoder').TextDecoder)

  // Encryption
  webrun.addGlobal('crypto', () => new Crypto())

  // Networking
  webrun.addGlobal('fetch', () => require('node-fetch'))
  webrun.addGlobal('fetch', () => require('node-fetch'))
  webrun.addGlobal('Headers', () => require('node-fetch').Headers)
  webrun.addGlobal('Request', () => require('node-fetch').Request)
  webrun.addGlobal('Response', () => require('node-fetch').Response)
  webrun.addGlobal('FormData', () => require('form-data'))
  webrun.addGlobal('URLSearchParams', () => require('url').URLSearchParams)
  webrun.addGlobal('WebSocket', () => require('ws'))

  // Streams
  webrun.addGlobal('ReadableStream', () => require('@mattiasbuelens/web-streams-polyfill/ponyfill').ReadableStream)
  webrun.addGlobal('WritableStream', () => require('@mattiasbuelens/web-streams-polyfill/ponyfill').WritableStream)
  webrun.addGlobal('ByteLengthQueuingStrategy', () => require('@mattiasbuelens/web-streams-polyfill/ponyfill').ByteLengthQueuingStrategy)
  webrun.addGlobal('CountQueuingStrategy', () => require('@mattiasbuelens/web-streams-polyfill/ponyfill').CountQueuingStrategy)
  webrun.addGlobal('TransformStream', () => require('@mattiasbuelens/web-streams-polyfill/ponyfill').TransformStream)

  // Storage / Caching
  webrun.addGlobal('localStorage', () => {
    prepareDir(LOCALSTORAGECACHE)

    const { LocalStorage } = require('node-localstorage')

    const localStorage = new LocalStorage(urlToPath(LOCALSTORAGECACHE))

    return localStorage
  })

  webrun.addGlobal('sessionStorage', () => {
    const sessionId = process.ppid
    const SESSIONSTORAGEPATH = new URL(`file://${os.tmpdir()}${sep}.webrun${sep}/session-${sessionId}`)
    prepareDir(SESSIONSTORAGEPATH)

    const { LocalStorage } = require('node-localstorage')

    const sessionStorage = new LocalStorage(urlToPath(SESSIONSTORAGEPATH))

    return sessionStorage
  })

  webrun.addContextModifier((defaultVars) => {
    const contextVars = new EventTarget()

    Object.assign(contextVars, defaultVars)

    return contextVars
  })
}

module.exports = BrowserPlugin
