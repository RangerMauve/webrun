const vm = require('vm');
const { URLSearchParams } = require("url");

const fetch = require("node-fetch");
const FormData = require("form-data");
const Websocket = require("ws");

const { bota, atob } = require("abab");
const { TextEncoder, TextDecoder } = require("text-encoder");

const { LocalStorage } = require("node-localstorage");

const EventTarget = require('event-target').default;

const makeDatArchive = require("./makeDatArchive");
const makeCrypto = require("./makeCrypto");

module.exports = function (dat, LOCALSTORAGECACHE) {
	const localStorage = new LocalStorage(LOCALSTORAGECACHE);
	const crypto = makeCrypto();
	const DatArchive = makeDatArchive(dat);

	const contextVars = new EventTarget();

	Object.assign(contextVars, {
		// Some expected builtins
		console,
		setTimeout,
		clearTimeout,
		setInterval,
		clearInterval,
		EventTarget,

		// Text manipluation
		bota,
		atob,
		TextEncoder,
		TextDecoder,

		// Encryption
		crypto,

		// Networking
		fetch,
		FormData,
		URLSearchParams,
		Websocket,

		// Storage / Caching
		localStorage,

		// STDOUT / Process stuff
		postMesage,
		close,
		argv: process.argv,

		// p2p
		DatArchive,
	});

	["window", "global", "self"].forEach((name) => {
		Object.defineProperty(contextVars, name, {
			get: function() {
				return this;
			},
		})
	});

	process.stdin.on("data", (data) => {
		const event = {
			data,
			type: "message"
		};
		contextVars.dispatchEvent(event);
		if (typeof contextVars.onmessage === "function") {
			contextVars.onmessage(event);
		}
	})

	function postMesage(message) {
		process.stdout.write(message);
	}

	function close(statusCode) {
		process.exit(statusCode || 0);
	}

	const context = vm.createContext(contextVars, {
		name: "WebRun"
	});

	return context;
}