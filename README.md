# WebRun
A custom module loader and global shim for Node to make it compatible with the browser.

The goal is to make code that works in browsers first, but can also run anywhere that Node runs.

**Warning:** This is still in development. Use at your own risk!

Bug reports welcome!

## Usage:

```bash
# Install the CLI
npm install -g @rangermauve/webrun

# Run it without installing globally
npx @rangermauve/webrun "https://rangermauve.hashbase.io/example.js"

# Load a module from the web and log to the console
webrun "https://rangermauve.hashbase.io/example.js"

# Run a local file
webrun ./example.js
```

Then in your JS:

```javascript
// Load code from an HTTPS server
import example from "https://rangermauve.hashbase.io/esm.js";

// Load from the dat network
import datExample from "dat://rangermauve.hashbase.io/esm.js";

// Load from the IPFS network. Might not always be online.
import ipfsExample from "ipfs://QmTWdgJtp3fXaszsomragX8dPXsqWe5c8uQETy6NkFJ7xA";

example();
datExample();
ipfsExample();
```

You can start a REPL using:

```bash
webrun
```

Then you can load modules using the new [dynamic import](https://github.com/tc39/proposal-dynamic-import) syntax.

This will return a promise that contains all the exported properties.

If you want to load the default export you can use something like the following:

```javascript
let {default: example} = await import("https://rangermauve.hashbase.io/esm.js")

example()
```

You can enable the `require` global by adding the `--allow-require` flag. This is disabled by default to encourage use of `import` and to limit what scripts can do. This behaves differently from the usual require in that it's a global and always requires relative to the current working directory. Instead of adding allow-require, though, you should use [webrunify](https://github.com/brechtcs/webrunify) to build your CommonJS dependencies into a single ESM-compatible bundle.

## STDIO

You can opt-into input from STDIN and output to STDOUT using `self.onmessage` and `self.postMessage`.

These are the same APIs that exist for iframes and WebWorkers which means that your worker code can potentially run in webrun and vice-versa.

```javascript
// Get text from STDIN, uppercase it, send it to STDOUT
self.onmessage = (text) => self.postMessage((text+"").toUpperCase())
```

## CLI arguments

We want to be as close to the web as possible, so instead of adding a non-standard global for CLI arguments, we pass them in as query string params.

You can access the URL of the current module using the new [import.meta.url](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import.meta) syntax.

For example, given the file `example.js`:

```javascript
console.log(`My URL is: ${import.meta.url}`)
```

Running this:

```bash
webrun example.js --foo bar --fizz buzz
```

Will result in

```bash
My URL is file://whatever/the/path/us/example.js?foo=bar&fizz=buzz
```

You can access these arguemnts using the following

```javascript
const url = new URL(import.meta.url)

const foo = url.searchParams.get('foo')
const fizz = url.searchParams.get('fizz')
```

## Web API support

Here's a list of the APIs that are supported, or are going to be supported eventually. Feel free to open an issue if you have ideas about other APIs that can be added.

- [x] console.*
- [x] timers (setInterval, setTimeout, etc)
- [x] [atob and btoa](https://www.npmjs.com/package/abab)
- [x] [fetch](https://www.npmjs.com/package/node-fetch)
- [x] [websocket](https://www.npmjs.com/package/ws)
- [x] [localStorage](https://www.npmjs.com/package/node-localstorage) (Persists to `./.webrun/localstorage`)
- [x] sessionStorage (same as localStorage, clears itself after exiting the parent process)
- [x] crypto.randomBytes() using node's crypto module.
- [x] [TextEncoder / TextDecoder](https://github.com/modulesio/text-encoder)
- [x] [WindowEventHandlers](https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers)
- [x] [self.close()](https://developer.mozilla.org/en-US/docs/Web/API/Window/close)
- [x] self.postMessage / self.onmessage
- [x] [EventTarget](https://github.com/WebReflection/event-target)
	- [ ] [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event/Event)
	- [ ] [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
- [x] [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [x] [WHATWG Streams](https://github.com/MattiasBuelens/web-streams-polyfill)
- [ ] [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [ ] WebRTC
- [ ] [Keypress and Mousemove events](https://github.com/TooTallNate/keypress)
- [ ] [SubtleCrypto](https://github.com/PeculiarVentures/node-webcrypto-p11) (or with [this](https://github.com/PeculiarVentures/node-webcrypto-ossl))
- [ ] Cache Storage
- [ ] [self.navigator](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/navigator)
- [ ] [self.location](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/location)
- [ ] [indexDB](https://www.npmjs.com/package/fake-indexeddb) (Doesn't persist, removed)
- [ ] [libdweb APIs](https://github.com/mozilla/libdweb)
- [ ] [Web Bluetooth](https://github.com/thegecko/webbluetooth)
- [ ] [WebMIDI APi](https://github.com/jazz-soft/JZZ)

## API

## Plugins

## Help it's not working!

- Delete the `.webrun` folder in the current directory. This will clear the cache
- If that doesn't work, raise an issue.

## How it works:

The new experimental-modules feature in Node.js is great, but it currently only works with `file:` URLs.

This means that modules made for the web are totally incompatible with Node. As a result, there's now four environments to code against: The legacy web with script tags, the web with ESM, Legacy CommonJS modules, and ESM in Node.js.

Luckily, node's [vm](https://nodejs.org/api/vm.html#vm_module_link_linker) builtin module now has support for custom ESM loaders. This means that we can now create a context that's separated from Node's globals and use anything we want for loading the contents of modules.

That's exactly how this works. It intercepts calls to `https://` imports, downloads the content to the `./.webrun/web-cache` folder, and loads it with the VM module.

Some browser APIs have been added to the global scope so hopefully a lot of modules made for browsers should work here, too. Feel free to open an issue to add your favorite missing browser API.

In addition to loading content from `https://` URLs, this loader also supports `dat://` URLs. This way you can download code right from the peer to peer web!

You can still load Node modules by using `require`, but this should only be done for APIs that you absolutely can't get on the web because otherwise your code won't be portable to the web.

PRs for additional protocols are welcome! All you need is an async function that takes a URL, and returns the file content string.

## Roadmap:

- [x] Able to load from the filesystem
- [x] Able to load HTTPS URLs
- [x] Able to load Dat URLs
- [x] Able to load using `reqire` (behind a flag)
- [ ] [Browser APIs]()
- [x] Dat protocol support
	- [x] Load from Dat URLs
	- [x] DatArchive global
	- [ ] Experimental Beaker APIs (does it make sense?)
		- [ ] DatPeers [Issue](https://github.com/beakerbrowser/dat-node/issues/3)
		- [ ] Library
- [x] IPFS
	- [x] Load from IPFS URLs
	- [x] Load from IPNS URLs
	- [x] ipfs global
- [x] CLI arguments: Add them to searchParams for the URL being loaded
