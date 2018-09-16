var repl = require("repl");
var vm = require("vm");

var Webrun = require("../");

var context = Webrun.context;

var server = repl.start({});

var _eval = server.eval;

server.eval = evalCode;

server.context = context;

function evalCode(cmd, _context, filename, callback) {
	const processed = injectImport(cmd);

	_eval(processed, _context, filename, callback);
}

function injectImport(content) {
	return content.replace(/([ \t]+)import\(/g, " _import(");
}
