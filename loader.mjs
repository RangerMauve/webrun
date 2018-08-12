import path from 'path';
import child_process from "child_process";
import fs from "fs";

/*
 PLEASE DON'T JUDGE ME FOR MY SHITTY CODE!
*/

import polyfills from "./polyfills.mjs";
import CONSTANTS from "./constants.mjs";

const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

const LOADERS = /^(dat|https)\:\/\//

// Set up the cache folder first
try {
	fs.mkdirSync(CONSTANTS.normalized(CONSTANTS.CACHE));
} catch(e) {}

// Load all the polyfills into global scope
polyfills();

export function resolve(specifier, parentModuleURL = baseURL, defaultResolve) {
	let resolvedSpecifier = specifier;
	// Make sure the parent is a URL object!
	let normalizedParent = new URL(parentModuleURL || "");

	const isRelativeWeb = 
		normalizedParent.pathname && 
		normalizedParent.pathname.startsWith(CONSTANTS.WEBCACHE.pathname);

	// If it's relative to a web import, but not an absolute URL
	if (isRelativeWeb && !LOADERS.test(specifier)) {
		// Get the original HTTPS url for the parent
		const website = "https://" + normalizedParent.pathname.slice(CONSTANTS.WEBCACHE.pathname.length)
		resolvedSpecifier = (new URL(specifier, website)).href;
	}

	const isRelativeDat = 
		normalizedParent.pathname &&
		normalizedParent.pathname.startsWith(CONSTANTS.DATCACHE.pathname);

	// If it's relative to a Dat import, but not an absolute URL
	if (isRelativeDat && !LOADERS.test(specifier)) {
		// Get the original HTTPS url for the parent
		const website = "dat://" + normalizedParent.pathname.slice(CONSTANTS.DATCACHE.pathname.length)
		resolvedSpecifier = (new URL(specifier, website)).href;
	}

	if(resolvedSpecifier.startsWith("https://")) {
		runLocal("httpload.mjs", resolvedSpecifier);

		const file = (new URL(resolvedSpecifier.slice(8), CONSTANTS.WEBCACHE));

		return {
			url: file.href,
			format: "esm"
		};
	} else if(resolvedSpecifier.startsWith("dat://")) {
		runLocal("datload.mjs", resolvedSpecifier);

		const file = (new URL(resolvedSpecifier.slice(6), CONSTANTS.DATCACHE));

		return {
			url: file.href,
			format: "esm"
		};
	} else {
		const resolved = new URL(specifier, parentModuleURL);
		const ext = path.extname(resolved.pathname);
		if (ext !== ".js") {
			throw new Error(
				`Cannot load file with non-JavaScript file extension ${ext}.`);
		}
		return {
			url: resolved.href,
			format: 'esm'
		};
	}
}

function runLocal(name, ...commands) {
	const scriptLocation = `${CONSTANTS.normalized(CONSTANTS.MODULEFOLDER)}/${name}`;
	const toRun = `node --experimental-modules ${scriptLocation} ${commands.join(" ")}`;

	return child_process.execSync(toRun);
}