# node-web-loader
A custom module loader and global shim for Node to make it compatible with the browser.

The goal is to make code that works in browsers first, but can run in Node by using this loader.

As such, the modules won't have access to node builtins.

**Warning:** this is a huge hack and is probably very inefficient. Use at your own risk!

Bug reports welcome!

## Progress:

- [x] Able to load HTTPS URLs
- [x] Relative URLs loaded from HTTPS modules should work
- [ ] Add browser globals
	- [x] [fetch](https://www.npmjs.com/package/node-fetch)
	- [x] [websocket](https://www.npmjs.com/package/ws)
	- [x] [localStorage](https://www.npmjs.com/package/node-localstorage)
	- [x] [indexDB](https://www.npmjs.com/package/fake-indexeddb) (Doesn't persist)
- [ ] Dat protocol support
	- [ ] Load from Dat URLs
	- [ ] DatArchive globals (whatever other Beaker stuff)

## Usage:

```
npm install --save node-web-loader

node --experimental-modules --loader ./node_modules/node-web-loader/loader.mjs example.js
```

Then in your JS: 

```javascript
import example from "https://rangermauve.hashbase.io/esm.js";

example();
```

## How it works:

The new experimental-modules feature in Node.js is great, but it currently only works with `file:` URLs.

This is great, but it means that modules made for the web are totally incompatible with Node. This means there's now three environments to code against: The web with ESM, Legacy CommonJS modules, and ESM in Node.js.

Luckily, Node provides a way to specify custom "loaders". You can create a custom "resolve" functions that can dictate how `import` calls resolve to files for Node.

BUT this `resolve` function has the be synchronous. This means that you can't do async stuff like HTTP requests.

Luckily, Node added an API which lets you cheat.

`child_process.execSync` can let you run a Node program that does async things in a separate process, while the current process gets blocked!

That's exactly how this works. It intercepts calls to `https://` imports, downloads the content to the `node_modules/node-web-loader/.web-cache` folder, and tells Node to load the file as `esm`.
