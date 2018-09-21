function run () {
  let n = parseInt(sessionStorage.getItem('n') || '0', 10)
  n++
  sessionStorage.setItem('n', '' + n)
  console.log(n)
}
run()
