var repl = require('repl')

var Webrun = require('../src')

const webrun = new Webrun({
  allowRequire: true
})

webrun.run().then(() => {
  var context = webrun.context

  var server = repl.start({
    useGlobal: false,
    useColors: true,
    ignoreUndefined: true,
    terminal: true,
    breakEvalOnSigint: true
  })

  var _eval = server.eval

  server.eval = evalCode

  server.context = context

  function evalCode (cmd, _context, filename, callback) {
    const processed = injectImport(cmd)

    return _eval.call(server, processed, _context, filename, callback)
  }
})

function injectImport (content) {
  return content.replace(/([ \t]+)import\(/g, ' _import(')
}
