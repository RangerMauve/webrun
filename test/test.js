const path = require('path')

const test = require('tape')
const webrun = require('./index.js')
const intercept = require('intercept-stdout')

test('webrun - exports function', t => {
  t.equal(typeof webrun, 'function', 'exports function')
  t.end()
})

test('webrun - exported funciton is async', t => {
  const result = webrun().catch(() => true)
  t.ok(result instanceof Promise, 'function is async')
  t.end()
})

test('webrun - supports running a file', t => {
  const url = new URL('file://' + path.resolve(__dirname, 'fixtures/simple.js'))

  let output = ''
  const reset = intercept(line => (output += line), () => null)
  webrun({ url }).then(result => {
    reset()
    t.deepEqual(output, 'running\n')
    t.end()
  }, t.end)
})

test('webrun - supports sessionStorage', async t => {
  const url = new URL('file://' + path.resolve(__dirname, 'fixtures/sessionStorage.js'))
  const url2 = new URL('file://' + path.resolve(__dirname, 'fixtures/sessionStorage.js?2'))

  let output = ''
  const reset = intercept(line => (output += line), () => null)
  await webrun({ url })
  await webrun({ url: url2 })
  reset()
  t.deepEqual(output.split(/\n/g), ['1', '2', ''])
  t.end()
})

test.onFinish(() => process.exit(0))
