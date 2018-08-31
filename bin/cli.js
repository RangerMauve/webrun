#!/usr/bin/env node
const argv = require('yargs').argv

// The last argument is the URL
const url = argv._.slice(-1)[0];

var main = require("../");

main({
	url: url
});
