const path = require('path')

const test = require('tape')
const webrun = require('./index.js')
const collect = require('collect-console')

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

  const reset = collect.log()
  webrun({ url }).then(result => {
    t.deepEqual(reset(), ['running'])
    t.end()
  }, t.end)
})

test('webrun - supports sessionStorage', async t => {
  const url = new URL('file://' + path.resolve(__dirname, 'fixtures/sessionStorage.js'))
  const url2 = new URL('file://' + path.resolve(__dirname, 'fixtures/sessionStorage2.js'))

  const reset = collect.log()
  await webrun({ url })
  await webrun({ url: url2 })
  t.deepEqual(reset(), ['1', '2'])
  t.end()
})

test.onFinish(() => {
  process.exit(0)
})
