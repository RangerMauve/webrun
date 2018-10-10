const urlToPath = require('../lib/url-to-path')

const _require = require

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

function NodePlugin (webrun) {
  const { allowRequire } = webrun.options

  webrun.addGlobals((contextVars) => {
    let onmessage = null

    Object.assign(contextVars, {
      // STDOUT / Process stuff
      postMesage,
      close
    })

    Object.defineProperty(contextVars, 'onmessage', {
      set: setOnmessage,
      get: () => onmessage
    })

    Object.defineProperty(contextVars, 'require', {
      get: getRequire
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

    function postMesage (message) {
      let finalMessage = message
      if (typeof message !== "string") {
        finalMessage = JSON.stringify(message)
      }
      process.stdout.write(message)
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
  })
}

module.exports = NodePlugin
