import fs from "fs";

import DatArchive from "node-dat-archive";

import CONSTANTS from "./constants.mjs";

const url = new URL(process.argv[2]);

const root = new URL("/", url);

const localPath = new URL(url.hostname + "/.dat", CONSTANTS.DATCACHE);

const fileLocation = new URL(url.hostname + url.pathname, CONSTANTS.DATCACHE);

const archive = new DatArchive(root.href, { localPath: CONSTANTS.normalized(localPath)})

archive.readFile(url.pathname).then((contents) => {
	fs.writeFile(fileLocation, contents, (err) => {
		if(err) throw err;
		archive._close();
	});
}).catch((err) => {
	setImmediate(() => {
		throw err;
	});
});

