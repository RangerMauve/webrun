const path = require('path')
const spawn = require('child-process-promise').spawn

module.exports = async function main (args) {
  const nodeLocation = process.argv0
  const loaderLocation = path.join(__dirname, '..', 'bin', 'cli.js')

  const finalArgs = [
    '--experimental-repl-await',
    '--experimental-vm-modules',

    // Alternatively, the stderr/out can be filtered below to remove experimental warning
    // '--no-warnings',
    loaderLocation,
    ...args
  ]

  const spawned = spawn(nodeLocation, finalArgs, {
    cwd: process.cwd(),
    stdio: ['inherit', 'inherit', 'inherit']
  })

  // Removing this because it breaks the REPL. The tests should do something else for spawning

  // // Doing this allows us to capture the stderr and stdout for testing purposes
  // const passStdout = data => process.stdout.write(data)
  // const passStderr = data => process.stderr.write(data)
  // spawned.childProcess.stdout.on('data', passStdout)
  // spawned.childProcess.stderr.on('data', passStderr)

  // spawned.then(() => {
  //   spawned.childProcess.stdout.removeListener('data', passStdout)
  //   spawned.childProcess.stderr.removeListener('data', passStderr)
  // })

  return spawned
}
