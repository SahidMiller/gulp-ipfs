var crypto = require('libp2p-crypto')
var CID = require('cids')

async function getRsaKeyInfo(rsaKey, password) {
	const privateKey = await crypto.keys.import(rsaKey, password)
	const publicKeyHash = await privateKey.public.hash()
	return { 
      	privateKey,
      	publishingId: new CID(1, 'libp2p-key', publicKeyHash, 'base36').toBaseEncodedString(),
      	peerId: new CID(publicKeyHash).toBaseEncodedString()
    }
}

module.exports = { getRsaKeyInfo }