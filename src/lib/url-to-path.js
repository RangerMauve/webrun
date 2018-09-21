const IS_WINDOWS = /^win/.test(process.platform)

module.exports = function urlToPath (url) {
  let location = url.pathname
  if (IS_WINDOWS) location = location.slice(1)
  return location
}