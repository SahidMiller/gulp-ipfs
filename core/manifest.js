var path = require('path')
var Manifest = require('./utils/manifest')
var ipfsClient = require('ipfs-http-client')
var ipnsPublish = require('./ipns')
var { getPublishingKey, createKey, getKeyFromPem, getKeyFromLocalIpfs, exportKeyToLocalIpfs } = require('./keys')
var { structureAsDirectories } = require('./utils/paths')
var pSeries = require('p-each-series')
var micromatch = require('micromatch')
var createLibp2p = require('./libp2p')

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
  	const ipfs = ipfsClient(opts.remote_ipfs.api)

	let libp2p
	let privateKey
  	let shouldUploadIpns = false

  	try {

  		let publishingId = opts.publishing_key


		if (!opts.publishing_key) {
			throw "Invalid options. publishing_key property required"
		}

		if (opts.publishing_key.pem && opts.publishing_key.password) {
		
			privateKey = await getKeyFromPem(opts.publishing_key.pem, opts.publishing_key.password)
			publishingId = await getPublishingKey(privateKey)
		
		} else {
			const keys = await ipfs.key.list()

			if (keys.find(key => key.name === opts.publishing_key)) {
				privateKey = await getKeyFromLocalIpfs(ipfs, opts.publishing_key)
			} else {
				privateKey = await createKey()
			}

			publishingId = opts.publishing_key
		}

		//This should only run if passing our own pem/password for the first time or passing a key that doesn't exist in remote
		const keys = await ipfs.key.list()
		if (!keys.find(key => key.name === publishingId)) {
			await exportKeyToLocalIpfs(ipfs, publishingId, privateKey)
		}

		libp2p = await createLibp2p(opts)
		shouldUploadIpns = true 

	} catch (error) {
		shouldUploadIpns = false
		console.error(error)
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

				await ipnsPublish(ipfs, libp2p, { ...opts, seqNum: globalSeqNum }, privateKey, directoryManifest.hash)
				globalSeqNum++
			}

			updatedPaths = []

			return directoryManifest.hash
		}
	}
}