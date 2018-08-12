import https from "https";
import fs from "fs";

import mkdirp from "mkdirp";
import CONSTANTS from "./constants.mjs";

const url = process.argv[2];

const file = new URL("./" + url.slice(8), CONSTANTS.WEBCACHE);
const fileFolder = new URL('./', file);

const fileFolderLocation = CONSTANTS.normalized(fileFolder);
const finalLocation = CONSTANTS.normalized(file);

mkdirp(fileFolderLocation, (err) => {
	if(err) throw err;
	tryDownload();
});

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