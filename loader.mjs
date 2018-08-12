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

	if (isRelativeWeb) {
		// Get the original HTTPS url for the parent
		const website = "https://" + normalizedParent.pathname.slice(CONSTANTS.WEBCACHE.pathname.length)
		resolvedSpecifier = (new URL(specifier, website)).toString();
	}

	if(resolvedSpecifier.startsWith("https://")) {
		const toRun = `node --experimental-modules ${CONSTANTS.normalized(CONSTANTS.MODULEFOLDER)}/httpload.mjs ${resolvedSpecifier}`;
		
		child_process.execSync(toRun);

		const file = (new URL(resolvedSpecifier.slice(8), CONSTANTS.WEBCACHE));

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