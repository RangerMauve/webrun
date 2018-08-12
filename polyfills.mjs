import CONSTANTS from "./constants.mjs";

import fetch from "node-fetch";
import { URLSearchParams } from "url";
import FormData from "form-data";
import indexedDB from "fake-indexeddb";
import IDBKeyRange from "fake-indexeddb/lib/FDBKeyRange";
import Websocket from "ws";
import LocalStorageModule from "node-localstorage";
const LocalStorage = LocalStorageModule.LocalStorage;
import DatArchive from "node-dat-archive";

export default function addPolyfills() {
	global.self = global;
	global.window = global;
	global.fetch = fetch;
	global.URLSearchParams = URLSearchParams;
	global.FormData = FormData;
	global.Websocket = Websocket;
	global.indexedDB = indexedDB;
	global.IDBKeyRange = IDBKeyRange;
	global.localStorage = new LocalStorage(
		CONSTANTS.normalized(CONSTANTS.LOCALSTORAGECACHE)
	);
	global.DatArchive = DatArchive;
}