var ipns = require('ipns')
var last = require('it-last');
var pRetry = require('p-retry')
var multihashes = require('multihashes')
var uint8ArrayToString = require('uint8Arrays/to-string')
var uint8ArrayFromString = require('uint8Arrays/from-string')

var _startLibp2p = require('./libp2p')

let libp2p

async function startLibp2p(...args) {
  libp2p = await _startLibp2p(...args)
  return libp2p
}

function getSerializedRecordKey(id) {
	const mh = multihashes.fromB58String(id);
	const key = ipns.getIdKeys(mh).routingKey.uint8Array();
	const serialized = uint8ArrayToString(key, 'base64url');
	return "/record/" + serialized;
}

function waitForPeerToSubscribe(ipfs, topic, peerId) {
  return pRetry(() => {
    return ipfs.pubsub.peers(topic).then((peers) => {
      if (!peers.find(peer => peer === peerId)) {
        throw new Error("Not subscribed");
      }
    })
  })
}

function resolveIPNSKey(ipfs, key) {
  return last(ipfs.name.resolve(key, { stream: false, nocache: true }));
}

function publish(ipfs, opts, { publishingId, privateKey, peerId }, hash) {

  resolveIPNSKey(ipfs, peerId).then((existingRecord) => {
    console.log("existing record: " + existingRecord);
  });

  const recordKey = getSerializedRecordKey(peerId);
  const peerIdString = uint8ArrayFromString(peerId, 'base58btc');

  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  }).then(() => {
    return libp2p === null ? startLibp2p(peerIdString, privateKey, opts.multiaddrs) : Promise.resolve();
  }).then(() => {
    return libp2p.pubsub.subscribe(recordKey);
  }).then(() => {
    console.log("waiting for peer subscription to IPNS record")
    return waitForPeerToSubscribe(ipfs, recordKey, peerId);
  }).then(async () => {
    console.log("found peer subscribed to IPNS record");
    const hourMs = 60 * 60 * 1000
    const record = await ipns.create(privateKey, hash, opts.seqNum, hourMs);
    const recordData = ipns.marshal(record);
    return libp2p.pubsub.publish(recordKey, recordData);
  }).then((result) => {

    console.log("Base58BTC: " + peerId)
    console.log("Base64:" + publishingId)
    console.log("published: " + hash)

    return pRetry(() => {
      return resolveIPNSKey(ipfs, peerId).then((result) => {

        if (result !== "/ipfs/" + hash) {
          return Promise.reject(new Error("failed check"));
        } else {
          return Promise.resolve();
        }
      });
    }, { 
      retries: 5, 
      minTimeout: 1000 
    }).then(() => {
      console.log("Remote peer successfully resolved to latest hash.");
    }).catch(() => {
      console.error("Remote peer failed to resolve latest hash. Trying again");
      console.log("");
      return publish(ipfs, opts, { publishingId, privateKey, peerId });
    });
  });
}

module.exports = publish