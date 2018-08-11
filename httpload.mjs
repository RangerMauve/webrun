import https from "https";
import fs from "fs";
import path from "path";
import os from "os";

const CACHE_FOLDER = ".nwl/web-cache";
const SEPARATOR_REPLACER = "_FILE_SEPARATOR_HACK_";

const url = process.argv[2];

var file = url.replace(/^https:\/\//i, "").replace(/[\\\/]/, SEPARATOR_REPLACER);

var isWin = /^win/.test(process.platform);

const moduleURL = import.meta.url;
const moduleFolder = isWin ? moduleURL.slice(8, -13) : moduleURL.slice(7, -13);
const cacheLocation = path.join(moduleFolder, CACHE_FOLDER);

const finalLocation = path.join(cacheLocation, file);

fs.stat(cacheLocation, function(err, stat) {
	if (!err) {
		// Folder already exists
		tryDownload();
	} else if (err.code === "ENOENT") {
		// Folder hasn't been made yet, create it
		fs.mkdir(cacheLocation, function(err) {
			if(err) throw err;
			tryDownload();
		})
	} else {
		throw err;
	}
})

function tryDownload(){
	fs.stat(finalLocation, function(err, stat) {
		if(!err) {
			// Already downloaded!
		} else if(err.code === "ENOENT") {
			// Not downloaded, download it!
			download();
		} else {
			throw err;
		}
	})
}

function download() {
	https.get(url, (res) => {
		const fileStream = fs.createWriteStream(finalLocation);
		res.pipe(fileStream);
	});
}