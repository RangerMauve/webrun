const vm = require('vm')
const path = require('path')
const mkdirp = require('mkdirp').sync
const spawn = require('child-process-promise').spawn

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

const dat = createNode({ path: urlToPath(DATCACHE) })
const loadDat = require('./loaders/dat')({ dat })
const loadHttps = require('./loaders/https')({ cacheDir: WEBCACHE })
const loadFile = require('./loaders/file')()

const moduleCache = {}

const context = require('./polyfills')(dat, loadModule, urlToPath(LOCALSTORAGECACHE))

const vmOptions = {
  context: context,
  initializeImportMeta: initializeImportMeta
}

const _import = require('./polyfills/import')(loadModule)

module.exports = main
module.exports.context = context

module.exports.loadModule = loadModule
module.exports.loadContent = loadContent

if (require.main === module) {
  const argv = require('yargs').argv
  const url = argv._.slice(-1)[0]
  run(url)
}

// spawns a sub process to run the url in
async function main ({ url }) {
  const nodeLocation = process.argv0
  const loaderLocation = path.join(__dirname, 'index.js')

  const args = [
    '--experimental-repl-await',
    '--experimental-vm-modules',

    // Alternatively, the stderr/out can be filtered below to remove experimental warning
    '--no-warnings',
    loaderLocation,
    url
  ]
  const spawned = spawn(nodeLocation, args, {
    cwd: process.cwd(),
    stdio: ['inherit', 'pipe', 'pipe']
  })

  // Doing this allows us to capture the stderr and stdout for testing purposes
  const passStdout = data => process.stdout.write(data)
  const passStderr = data => process.stderr.write(data)
  spawned.childProcess.stdout.on('data', passStdout)
  spawned.childProcess.stderr.on('data', passStderr)

  spawned.then(() => {
    spawned.childProcess.stdout.removeListener('data', passStdout)
    spawned.childProcess.stderr.removeListener('data', passStderr)
  })

  return spawned
}

async function run (url) {
  const resolvedURL = new URL(url, baseURL)
  const module = await loadModule(resolvedURL)

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

  return loadContent(contents, url)
}

async function loadContent (contents, url) {
  const cleaned = injectImport(contents)

  const options = Object.assign({
    url: url.toString()
  }, vmOptions)

  const module = new vm.SourceTextModule(
    cleaned,
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
  meta._import = (path) => _import(path, module.url)
}

function injectImport (content) {
  return content.replace(/([ \t]+)import\(/g, ' import.meta._import(')
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
  const location = urlToPath(url)
  mkdirp(location)
}

function urlToPath (url) {
  let location = url.pathname
  if (IS_WINDOWS) location = location.slice(1)
  return location
}
