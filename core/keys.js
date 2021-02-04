var crypto = require('libp2p-crypto')
var CID = require('cids')
const multibase = require('multibase')
const fs = require('fs')
const path = require('path')
const PeerId = require('peer-id')
const ipns = require('ipns')
const uint8ArrayToString = require('uint8Arrays/to-string')

async function createKey() {
	const { privateKey } = await crypto.keys.generateKeyPair('rsa', 2048)
	return privateKey
}

async function getKeyFromPem(rsaKey, password) {
	return await crypto.keys.import(rsaKey, password)
}

async function getPublishingKey(privateKey) {
	const peerId = await PeerId.createFromPrivKey(privateKey.bytes)
	return new CID(1, 'libp2p-key', peerId.id, 'base32').toBaseEncodedString("base36")
}

async function getSerializedRecordKey(privateKey) {
	const peerId = await PeerId.createFromPrivKey(privateKey.bytes)
	const key = ipns.getIdKeys(peerId.toBytes()).routingKey.uint8Array();
	const serialized = uint8ArrayToString(key, 'base64url');
	return "/record/" + serialized;
}

async function getKeyFromLocalIpfs(ipfs, keyName) {
	const fileName = "key_" + multibase.names.base32.encode(new TextEncoder().encode(keyName))
    const { repoPath } = await ipfs.repo.stat()
    const keyPath = path.join(repoPath, "keystore", fileName)

    return await crypto.keys.unmarshalPrivateKey(fs.readFileSync(keyPath))
}

async function exportKeyToLocalIpfs(ipfs, keyName, privateKey) {
	const fileName = "key_" + multibase.names.base32.encode(new TextEncoder().encode(keyName))
    const { repoPath } = await ipfs.repo.stat()
    const keyPath = path.join(repoPath, "keystore", fileName)

    fs.writeFileSync(keyPath, privateKey.bytes)
}

module.exports = { 
	createKey,
	getKeyFromPem,
	getPublishingKey,
	getKeyFromLocalIpfs,
	exportKeyToLocalIpfs,
	getSerializedRecordKey
}