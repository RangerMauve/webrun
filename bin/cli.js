#!/usr/bin/env node
const argv = require('yargs').argv

// The last argument is the URL
const url = argv._.slice(-1)[0]

var webrun = require('../')

if (url) {
  webrun({
    url: url
  }).then(result => process.exit(result.code), result => process.exit(result.code))
} else {
  require('./repl.js')
}
