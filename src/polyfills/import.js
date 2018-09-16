module.exports = function makeImport (loadModule) {
  return async function _import (path, baseURL) {
    const url = new URL(path, baseURL)
    const module = await loadModule(url)

    if (module.status !== 'instantiated') {
      module.instantiate()
    }
    if (module.status !== 'evaluated') {
      await module.evaluate()
    }

    return module.namespace
  }
}
