import path from 'path';
import process from 'process';
import Module from 'module';
import child_process from "child_process";
import url from "url";

/*
PLEASE DON'T JUDGE ME FOR MY SHITTY CODE!
*/

import fetch from "node-fetch";
import { URLSearchParams } from "url";
import FormData from "form-data";

import indexedDB from "fake-indexeddb";
import IDBKeyRange from "fake-indexeddb/lib/FDBKeyRange";

import Websocket from "ws";

import LocalStorage from "node-localstorage"

global.self = global;
global.fetch = fetch;
global.URLSearchParams = URLSearchParams;
global.FormData = FormData;
global.Url = url.Url;
global.Websocket = Websocket;
global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;
global.localStorage = new LocalStorage("./localstorage");

const CACHE_FOLDER = ".web-cache";
const SEPARATOR_REPLACER = "_FILE_SEPARATOR_HACK_";

const builtins = Module.builtinModules;
const JS_EXTENSIONS = new Set(['.js']);

const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

var isWin = /^win/.test(process.platform);

const moduleURL = import.meta.url;
const moduleFolder = isWin ? moduleURL.slice(8, -11) : moduleURL.slice(7, -11);
const cacheLocation = "file://" + path.join(moduleFolder, CACHE_FOLDER);

export function resolve(specifier, parentModuleURL = baseURL, defaultResolve) {
	let resolvedSpecifier = specifier;

	const cleanParent = parentModuleURL && parentModuleURL.toString().replace(/^file:[\/\\]+/, "");
	const cleanLocation = cacheLocation.replace(/^file:\/+/, "") + path.sep;

	const isCachedParent = cleanParent && cleanParent.startsWith(cleanLocation);

	if (isCachedParent) {
		const httpRoot = "https://" + cleanParent.replace(cleanLocation, "").replace(new RegExp(SEPARATOR_REPLACER, "g"), "/");
		resolvedSpecifier = url.resolve(httpRoot, specifier);
	}
	
	if(resolvedSpecifier.startsWith("https://")) {
		const toRun = `node --experimental-modules ${moduleFolder}/httpload.mjs ${resolvedSpecifier}`;
		
		child_process.execSync(toRun);

		var file = resolvedSpecifier.toString().replace(/^https:\/\//i, "").replace(/[\\\/]/, SEPARATOR_REPLACER);
		const finalLocation = path.join(cacheLocation, file);

		return {
			url: finalLocation,
			format: "esm"
		};
	} else {
		const resolved = new URL(specifier, parentModuleURL);
		const ext = path.extname(resolved.pathname);
		if (!JS_EXTENSIONS.has(ext)) {
			throw new Error(
				`Cannot load file with non-JavaScript file extension ${ext}.`);
		}
		return {
			url: resolved.href,
			format: 'esm'
		};
	}
}