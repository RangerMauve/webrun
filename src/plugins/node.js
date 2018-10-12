const urlToPath = require('../lib/url-to-path')

const _require = require

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

function NodePlugin (webrun) {
  const { allowRequire } = webrun.options

  webrun.addGlobal('postMessage', () => postMessage)
  webrun.addGlobal('close', () => close)
  webrun.addGlobal('require', getRequire)

  webrun.addContextModifier((contextVars) => {
    let onmessage = null

    Object.defineProperty(contextVars, 'onmessage', {
      set: setOnmessage,
      get: () => onmessage
    })

    return contextVars

    function setOnmessage (listener) {
      if (!onmessage) {
        listenMessages()
      }

      onmessage = listener
    }

    function listenMessages () {
      process.stdin.on('data', (data) => {
        const event = {
          data,
          type: 'message'
        }
        contextVars.dispatchEvent(event)
        if (typeof contextVars.onmessage === 'function') {
          contextVars.onmessage(event)
        }
      })
    }
  })

  function postMessage (message) {
    let finalMessage = message
    if (typeof message !== 'string') {
      finalMessage = JSON.stringify(message)
    }
    process.stdout.write(finalMessage)
  }

  function close (statusCode) {
    process.exit(statusCode || 0)
  }

  function getRequire () {
    if (allowRequire) {
      return require
    } else {
      throw new Error('require() is disabled. Please add the --allow-require flag to enable it')
    }
  }

  function require (path) {
    if (/^[.\\/]/.test(path)) {
      const finalPath = urlToPath(new URL(path, baseURL))
      return _require(finalPath)
    } else {
      return _require(path)
    }
  }
}

module.exports = NodePlugin
