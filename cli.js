const gulp = require('gulp')
const gulpIpfs = require('./index')
const cache = require('gulp-cached')

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')

const configFile = argv["config"]
const keyName = argv["key"]
const watchDir = path.resolve(argv["path"] || process.cwd()).replace(/\\/g, '/')

if (argv["help"]) {
	console.log("gulp-ipfs --config=./config-file.json --key=self")
	return 0
}

if (!argv["config"]) {
	console.log("Invalid argument. --config argument required")
	return 0
}

if (!argv["key"]) {
	console.log("Invalid argument. --key argument required")
	return 0
}

let config

try {
	
	config = JSON.parse(fs.readFileSync(configFile))

} catch (err) {
	console.log("Failed to parse config file at path: " + configFile)
	console.error(err)
	return 0
}

//TODO God willing: more validation on multiaddrs and api params
if (!config.remote_ipfs || !config.remote_ipfs.api || !config.remote_ipfs.multiaddrs) {
	console.log("Invalid configuration file. 'remote_ipfs' property is required")
	return 0
}

if (config.libp2p_key && (!config.libp2p_key.pem || !config.libp2p_key.password)) {
	console.log("CLI only supports password encrypted keys")
	delete config.libp2p_key
	return 0
}

config.publishing_key = keyName
config.verbose = argv["verbose"] || false
config.seqNum = argv["seq-num"] || config.seqNum || 0

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