ipfs.on('ready', async () => {
  const Buffer = ipfs.types.Buffer

  const path = '/example.js'
  const content = Buffer.from(`
export default function example () {
  console.log('Hello World!')
}
`)

  const result = await ipfs.add({
    path, content
  })

	const { hash } = result[0]
	
	const url = `ipfs://${hash}`;

	console.log("Importing from", url)

  const { default: example } = await import(url)

  example()

  self.close()
})
