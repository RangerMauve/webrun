#!/usr/bin/env node
const Webrun = require('../src/')

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

const argv = require('yargs')
  .boolean('allow-require')
  .boolean('experimental-repl-await')
  .boolean('experimental-vm-modules')
  .argv

// The last argument is the URL
const hasURL = argv._.slice(-1)[0]

const allowRequire = !!argv.allowRequire

if (hasURL) {
  const url = new URL(hasURL, baseURL)

  Object.keys(argv).forEach((key) => {
    const value = argv[key]
    if (key !== '_' && key[0] !== '$') {
      url.searchParams.set(key, value)
    }
  })

  const webrun = new Webrun({
    allowRequire
  })

  webrun.run({ url })
} else {
  require('./repl.js')
}
