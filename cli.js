#! /usr/bin/env node

const gulp = require('gulp')
const gulpIpfs = require('./index')
const cache = require('gulp-cached')

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')

const configFile = argv["config"]
const watchDir = path.resolve(argv["path"] || process.cwd()).replace(/\\/g, '/')

if (argv["help"]) {
	console.log(`gulp-ipfs:
--path      |  string |	Path to upload and watch for changes               | required: false
--ipfs-api  |  string |	URI to remote ipfs api                             | required: false
--config    |  string |	Path to configuration file                         | required: false
--no-ipns   | boolean | Don't update ipns                                  | required: false
--ipns-key  |  string |	Name of key to publish w/                          | required: if is-remote = false
--is-remote | boolean |	Do not attempt to pull or save keys from remote    | required: false
--verbose   | boolean |	Verbose debugging log                              | required: false
	`)

	return 0
}


let config = {}

if (configFile) {
	
	try {
		
		config = JSON.parse(fs.readFileSync(configFile))

	} catch (err) {
		console.log("Failed to parse config file at path: " + configFile)
		console.error(err)
		return 0
	}
}

config.noIpns = argv["no-ipns"]
config.ipfsApi = argv["ipfs-api"] || config.ipfsApi
config.isRemote = argv["is-remote"] || config.isRemote || false
config.publishingKey = !config.isRemote ? argv["ipns-key"] || config.publishingKey : config.publishingKey
config.verbose = argv["verbose"] || false
config.seqNum = argv["seq-num"] || config.seqNum || 0

if (!config.isRemote && !config.publishingKey) {
	console.log("Invalid options. --ipns-key option is required for local node")
	return 0
}

//TODO God willing: import from go-node, if not remote.
if (config.libp2pKey && (!config.libp2pKey.pem || !config.libp2pKey.password)) {
	console.log("CLI only supports password encrypted keys")
	delete config.libp2pKey
	return 0
}

const processIpfs = gulpIpfs(config)

let ignoreGlobs = []
let ignoreArgs = argv["ignore"]

if (ignoreArgs && (typeof ignoreArgs === "string" || ignoreArgs instanceof Array)) {
	ignoreGlobs = (typeof ignoreArgs === "string" ? [ignoreArgs] : ignoreArgs)
}

const watchGlob = "**"

gulp.task('ipfs', () => {
	return gulp.src(watchGlob, { cwd: watchDir, ignore: ignoreGlobs })
		.pipe(cache('ipfs'))
		.pipe(processIpfs())
})

gulp.watch(watchGlob, { cwd: watchDir, ignoreInitial: false, ignored: ignoreGlobs }, gulp.series(['ipfs']))