#!/usr/bin/env node
require('../src/runner')(process.argv.slice(2))
  .then(result => process.exit(result.code), result => process.exit(result.code))
