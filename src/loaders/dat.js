module.exports = ({ dat }) => async function getDat (url) {
  const parentURL = `dat://${url.hostname}`
  const resovledURL = await dat.dns.resolve(parentURL)
  const archive = await dat.getArchive(resovledURL)

  return archive.readFile(url.pathname, 'utf8')
}
