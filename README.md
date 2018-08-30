# node-web-loader
A custom module loader and global shim for Node to make it compatible with the browser.

The goal is to make code that works in browsers first, but can run in Node by using this loader.

You can `import` builtin node modules, but modules installed through NPM are no longer supported because it would require the funky `mjs` stuff we have in node now.

**Warning:** this is a huge hack and is probably very inefficient. Use at your own risk!

Bug reports welcome!

## Usage:

```bash
npm install --save @rangermauve/web-loader

node --experimental-modules --loader ./node_modules/@rangermauve/web-loader/loader.mjs example.js
```

Then in your JS: 

```javascript
import example from "https://rangermauve.hashbase.io/esm.js";
import p2pexample from "dat://rangermauve.hashbase.io/esm.js";

example();
p2pexample();
```

## Progress:

- [x] Able to load HTTPS URLs
- [x] Relative URLs loaded from HTTPS modules should work
- [ ] Add browser globals
	- [x] [fetch](https://www.npmjs.com/package/node-fetch)
	- [x] [websocket](https://www.npmjs.com/package/ws)
	- [x] [localStorage](https://www.npmjs.com/package/node-localstorage) (Persists to `./.nwl/localstorage`)
	- [x] [indexDB](https://www.npmjs.com/package/fake-indexeddb) (Doesn't persist)
	- [ ] [SubtleCrypto](https://github.com/PeculiarVentures/node-webcrypto-ossl)
- [x] Dat protocol support
	- [x] Load from Dat URLs
	- [x] DatArchive global
	- [ ] Experimental Beaker APIs (does it make sense?)
		- [ ] DatPeers
		- [ ] Library

You can test it out by cloning and running one of the following:

```
npm run example

# or

npm run example-dat
```

## How it works:

The new experimental-modules feature in Node.js is great, but it currently only works with `file:` URLs.

This is great, but it means that modules made for the web are totally incompatible with Node. This means there's now three environments to code against: The web with ESM, Legacy CommonJS modules, and ESM in Node.js.

Luckily, Node provides a way to specify custom "loaders". You can create a custom "resolve" functions that can dictate how `import` calls resolve to files for Node.

BUT this `resolve` function has the be synchronous. This means that you can't do async stuff like HTTP requests.

Luckily, Node added an API which lets you cheat.

`child_process.execSync` can let you run a Node program that does async things in a separate process, while the current process gets blocked!

That's exactly how this works. It intercepts calls to `https://` imports, downloads the content to the `./.nwl/web-cache` folder, and tells Node to load the file as `esm`.

Some browser APIs have been added to the global scope so hopefully a lot of modules made for browsers should work here, too.

In addition to loading content from `https://` URLs, this loader also supports `dat://` URLs. This way you can download code right from the peer to peer web!

PRs for additional protocols are welcome! All you need to do is make a script that takes a URL as a parameter and add it to the list of protocols that are handled.
