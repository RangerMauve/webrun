const vm = require('vm')
const mkdirp = require('mkdirp').sync

const { createNode } = require('@beaker/dat-node')

const IS_WINDOWS = /^win/.test(process.platform)

const baseURL = new URL('file://')
baseURL.pathname = `${process.cwd()}/`

const CACHE = new URL('.webrun/', baseURL)
const LOCALSTORAGECACHE = new URL('localstorage/', CACHE)
const WEBCACHE = new URL('webcache/', CACHE)
const DATCACHE = new URL('datcache/', CACHE)

ensureExists(LOCALSTORAGECACHE)
ensureExists(DATCACHE)
ensureExists(WEBCACHE)

const dat = createNode({ path: cleanURL(DATCACHE) })
const loadDat = require('./loaders/dat')({ dat })
const loadHttps = require('./loaders/https')({ cacheDir: WEBCACHE })
const loadFile = require('./loaders/file')()

const moduleCache = {}

const context = require('./polyfills')(dat, cleanURL(LOCALSTORAGECACHE))

const vmOptions = {
  context: context,
  initializeImportMeta: initializeImportMeta
}

module.exports = async function main (args) {
  const rawUrl = args.url
  const url = new URL(rawUrl, baseURL)
  const module = await loadModule(url)

  module.instantiate()
  await module.evaluate()
}

/**
 * Load a vm module in the VM
 * @param url Full URL object that's already been resolved
 */
async function loadModule (url) {
  if (moduleCache[url]) {
    return moduleCache[url]
  }

  const contents = await getModuleContents(url)

  const options = Object.assign({
    url: url.toString()
  }, vmOptions)

  const module = new vm.SourceTextModule(
    contents,
    options
  )

  moduleCache[url] = module

  await module.link(linker)

  return module
}

async function linker (specifier, referencingModule) {
  const url = new URL(specifier, referencingModule.url)
  return loadModule(url)
}

function initializeImportMeta (meta, module) {
  meta.url = module.url.toString()
}

async function getModuleContents (url) {
  if (url.protocol === 'file:') {
    return loadFile(url)
  } else if (url.protocol === 'https:') {
    return loadHttps(url)
  } else if (url.protocol === 'dat:') {
    return loadDat(url)
  } else {
    throw new Error(`Unable to load module. Unsupported protocol: ${url}`)
  }
}

function ensureExists (url) {
  const location = cleanURL(url)
  mkdirp(location)
}

function cleanURL (url) {
  let location = url.pathname
  if (IS_WINDOWS) location = location.slice(1)
  return location
}
