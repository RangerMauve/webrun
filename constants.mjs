const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

const CACHE = new URL('.nwl/', baseURL);
const LOCALSTORAGECACHE = new URL('localstorage/', CACHE);
const WEBCACHE = new URL('webcache/', CACHE);
const DATCACHE = new URL('datcache/', CACHE);
const MODULEFOLDER = new URL('./', import.meta.url);

var isWin = /^win/.test(process.platform);

function normalized(location) {
	return CONSTANTS.isWin ? (
		location.pathname.slice(1)
	) : (
		location.pathname
	);
}

const CONSTANTS = {
	CACHE,
	LOCALSTORAGECACHE,
	WEBCACHE,
	DATCACHE,
	MODULEFOLDER,
	isWin,
	normalized
};

export default CONSTANTS;