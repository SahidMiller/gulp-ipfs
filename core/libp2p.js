var Libp2p = require('libp2p');
const TCP = require('libp2p-tcp')
const { NOISE } = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')
const GossipSub = require('libp2p-gossipsub')
const PeerId = require('peer-id')
const retry = require('p-retry')

module.exports = async function startLibp2p(opts, multiaddresses) {

  let libp2pOptions = {
    modules: {
      transport: [TCP],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX],
      pubsub: GossipSub
    }
  }

  if (opts.libp2pKey) {
    
    const libp2pKey = opts.libp2pKey
    const libp2pKeyType = typeof libp2pKey
    const pem = libp2pKey && libp2pKey.pem
    const password = libp2pKey && libp2pKey.password

    let privateKey 

    if (pem && password) {
      privateKey = await getKeyFromPem(pem, password)
    } else if (Object.values(crypto.supportedKeys).find(keyType => libp2pKeyType === keyType)) {
      privateKey = libp2pKey
    } else {
      throw "Invalid libp2pKey option."
    }

    const peerIdString = uint8ArrayFromString(privateKey.id, 'base58btc')
    libp2pOptions.peerId = new PeerId(peerIdString, privateKey)
  }

  const libp2p = await Libp2p.create(libp2pOptions)
  
  if (opts.verbose) {
    console.log("Libp2p started");
  }

  await libp2p.start()
  await retry(async (attempt) => {
    const multiaddrs = multiaddresses[attempt - 1]

    if (opts.verbose) {
      console.log("Trying address: " + multiaddrs)
    }
    
    return await libp2p.dial(multiaddrs)

  }, { 
    retries: multiaddresses.length, 
    minTimeout: 2000 
  });
  
  if (opts.verbose) {
    console.log("connected to peer")
  }

  return libp2p
}