var ipns = require('ipns')
var last = require('it-last');
var pRetry = require('p-retry')
var multihashes = require('multihashes')
var { getPublishingKey, getSerializedRecordKey } = require('./keys')

function waitForPeerToSubscribe(ipfs, topic, peerId) {
  return pRetry(async () => {
    const peers = await ipfs.pubsub.peers(topic)

    if (!peers.find(peer => peer === peerId)) {
      throw new Error("Not subscribed");
    }

    return peers
  })
}

function resolveIPNSKey(ipfs, key) {
  return last(ipfs.name.resolve(key, { stream: false, nocache: true }));
}

async function publish(ipfs, libp2p, opts, privateKey, hash) {

  const localId = libp2p.peerId.toB58String()

  const publishingKey = await getPublishingKey(privateKey)
  const recordKey = await getSerializedRecordKey(privateKey);

  if (opts.verbose) {
    console.log("\nPeer Id: " + localId)
    console.log("Publishing key: " + publishingKey)
    console.log("Record key: " + recordKey)
  }

  resolveIPNSKey(ipfs, publishingKey).then((existingRecord) => {
    if (opts.verbose) {
      console.log("Existing record: " + existingRecord);
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 1000))
  

  await libp2p.pubsub.subscribe(recordKey);

  const peers = await waitForPeerToSubscribe(ipfs, recordKey, localId);
  
  if (opts.verbose) {
    console.log("Remote peers: " + peers.toString())
    console.log("Local peers: " + await libp2p.pubsub.getSubscribers(recordKey))
  }

  const hourMs = 60 * 60 * 1000
  const record = await ipns.create(privateKey, hash, opts.seqNum, hourMs);
  const recordData = ipns.marshal(record);
  const result = await libp2p.pubsub.publish(recordKey, recordData);

  return pRetry(() => {
    return resolveIPNSKey(ipfs, publishingKey).then((result) => {

      if (result !== "/ipfs/" + hash) {
        return Promise.reject(new Error("failed check"));
      } else {
        return Promise.resolve();
      }
    });
  }, { 
    retries: 5, 
    minTimeout: 1000 
  }).catch(() => {
    opts.verbose && console.error("Remote peer failed to resolve latest hash. Trying again");
    opts.seqNum += 100
    return publish(ipfs, libp2p, opts, privateKey, hash);
  })
}

module.exports = publish