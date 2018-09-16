var crypto = require('crypto')

module.exports = function makeCrypto () {
  return {
    getRandomValues (buffer) {
      return crypto.randomFillSync(buffer)
    }
  }
}
