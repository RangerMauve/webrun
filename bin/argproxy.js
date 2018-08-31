#!/usr/bin/env node
const sep = require("path").sep

const nodeLocation = process.argv0;
const otherArgs = process.argv.slice(2);
const loaderLocation = `${__dirname}${sep}cli.js`;

const args = ["--experimental-vm-modules", loaderLocation, ...otherArgs];

require("child_process").spawn(nodeLocation, args, {
	cwd: process.cwd(),
	stdio: "inherit"
});