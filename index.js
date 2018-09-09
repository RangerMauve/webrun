const vm = require('vm');
const fs = require("fs-extra");
const mkdirp = require("mkdirp").sync;
const filenamifyUrl = require('filenamify-url');

const { createNode } = require('@beaker/dat-node')

const fetch = require("node-fetch");

const IS_WINDOWS = /^win/.test(process.platform);

const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

const CACHE = new URL('.webrun/', baseURL);
const LOCALSTORAGECACHE = new URL('localstorage/', CACHE);
const WEBCACHE = new URL('webcache/', CACHE);
const DATCACHE = new URL('datcache/', CACHE);

ensureExists(LOCALSTORAGECACHE);
ensureExists(DATCACHE);
ensureExists(WEBCACHE);

const dat = createNode({
	path: cleanURL(DATCACHE)
});

const moduleCache = {}

const context = require("./polyfills")(dat, cleanURL(LOCALSTORAGECACHE));

const vmOptions = {
	context: context,
	initalizeImportMeta: initalizeImportMeta
}

module.exports = async function main(args) {
	const rawUrl = args.url;
	const url = new URL(rawUrl, baseURL)
	const module = await loadModule(url);

	module.instantiate();
	await module.evaluate();
}

/**
 * Load a vm module in the VM
 * @param url Full URL object that's already been resolved
 */
async function loadModule(url) {
	if(moduleCache[url]) {
		return moduleCache[url]
	}

	const contents = await getModuleContents(url);

	const options = Object.assign({
		url: url.toString()
	}, vmOptions)

	const module = new vm.SourceTextModule(
		contents,
		options
	);

	moduleCache[url] = module;

	await module.link(linker);

	return module;
}

async function linker(specifier, referencingModule) {
	const url = new URL(specifier, referencingModule.url);
	return loadModule(url);
}

function initalizeImportMeta(meta, module) {
	meta.url = new URL(module.url);
	meta.require = require;
}

async function getModuleContents(url) {
	if(url.protocol === "file:") {
		return getFile(url);
	} else if(url.protocol === "https:") {
		return getHTTPS(url);
	} else if(url.protocol === "dat:") {
		return getDat(url);
	} else {
		throw new Error(`Unable to load module. Unsupported protocol: ${url}`)
	}
}

async function getFile(url) {
	const location = cleanURL(url);
	return fs.readFile(location, "utf8");
}

async function getHTTPS(url) {

	const cachedName = filenamifyUrl(url.href);
	const cachedLocation = cleanURL(new URL(cachedName, WEBCACHE));

	try {
		await fs.stat(cachedLocation);

		return fs.readFile(cachedLocation, "utf8");
	} catch (e) {
		const response = await fetch(url);

		const content = await response.text();

		await fs.writeFile(cachedLocation, content, "utf8");

		return content;
	}
}

async function getDat(url) {
	const archive = await DatArchive.load(`dat://${url.hostname}`);

	return await archive.readFile(url.pathname, 'utf8');
}

function ensureExists(url) {
	const location = cleanURL(url);
	mkdirp(location);
}

function cleanURL(url) {
	let location = url.pathname;
	if (IS_WINDOWS) location = location.slice(1);
	return location;
}