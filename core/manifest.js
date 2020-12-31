var path = require('path')
var Manifest = require('./utils/manifest')
var ipfsClient = require('ipfs-http-client')
var ipnsPublish = require('./ipns')
var { getRsaKeyInfo } = require('./keys')
var { structureAsDirectories } = require('./utils/paths')
var pSeries = require('p-each-series')
var micromatch = require('micromatch')

function recalculateHashes(ipfs, manifest, updatedFilePaths) {
	const directoriesByLevel = structureAsDirectories(updatedFilePaths).reverse()
    return pSeries(directoriesByLevel, (itemsForLevel, levelNum) => {

		return Promise.all(Object.keys(itemsForLevel).map(async (parentPath) => {

			const isLastLevel = levelNum === directoriesByLevel.length - 1
			const parentManifest = !isLastLevel ? manifest.getFromPath(parentPath) : manifest		
			const directory = parentManifest.buildNode()

			return ipfs.dag.put(directory, { format: 'dag-pb', hashAlg: "sha2-256" }).then(cid => {

				parentManifest.hash = cid.toV0().toBaseEncodedString()
				parentManifest.size = directory.serialize().length
			})
		}))
    })
}

module.exports = async(opts) => {
  	const ipfs = ipfsClient(opts.ipfs)

  	let shouldUploadIpns = false
  	let keys = null
  	
  	try {
		keys = await getRsaKeyInfo(opts.rsaKey, opts.keyPassword)
		shouldUploadIpns = true 
	} catch (error) {
		shouldUploadIpns = false
	}

	const directoryManifest = new Manifest()
	let globalSeqNum = (opts.seqNum || 0) + 1
	let updatedPaths = []
	let allowFile = (name) => !!micromatch.not([name], opts.filter).length

	return {
		queue: async (file) => {
			const url = path.normalize(file.relative)
			
			if (allowFile(url)) {
			    const info = await ipfs.add(file.contents)
			    const revision = info.cid.toBaseEncodedString()

			    if (opts.verbose) {
			   		console.log("added " + revision + " " + url)
			    }

				directoryManifest.addFile(url, info.size, revision)
				updatedPaths.push(url)
			}
		},
		recalculate: async () => {
			await recalculateHashes(ipfs, directoryManifest, updatedPaths)

			if (shouldUploadIpns) {
				await ipnsPublish(ipfs, { ...opts, seqNum: globalSeqNum }, keys, publishedHash)
				globalSeqNum++
			}

			updatedPaths = []

			return directoryManifest.hash
		}
	}
}