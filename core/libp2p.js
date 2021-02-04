var Libp2p = require('libp2p');
const TCP = require('libp2p-tcp')
const { NOISE } = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')
const GossipSub = require('libp2p-gossipsub')
const PeerId = require('peer-id')

module.exports = async function startLibp2p(opts) {

  let libp2pOptions = {
    modules: {
      transport: [TCP],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX],
      pubsub: GossipSub
    }
  }

  if (opts.libp2p_key) {
    
    let privateKey 

    if (opts.libp2p_key.pem && opts.libp2p_key.password) {
      privateKey = await getKeyFromPem(opts.libp2p_key.pem, opts.libp2p_key.password)
    }

    const libp2pKeyType = typeof opts.libp2p_key
    
    if (Object.values(crypto.supportedKeys).find(keyType => libp2pKeyType === keyType)) {
      privateKey = opts.libp2p_key
    } else {
      throw "Invalid libp2p_key option."
    }

    const peerIdString = uint8ArrayFromString(privateKey.id, 'base58btc')
    libp2pOptions.peerId = new PeerId(peerIdString, privateKey)
  }

  if (!opts.remote_ipfs || !opts.remote_ipfs.multiaddrs) {
    throw "Invalid options. 'remote_ipfs' property is required."
  }

  if (!opts.remote_ipfs || !opts.remote_ipfs.multiaddrs) {
    throw "Invalid remote_ipfs option. `multiaddrs` property is required."
  }

  const libp2p = await Libp2p.create(libp2pOptions)
  
  if (opts.verbose) {
    console.log("Libp2p started");
  }

  await libp2p.start()
  await libp2p.dial(opts.remote_ipfs.multiaddrs)
  
  if (opts.verbose) {
    console.log("connected to peer")
  }
  
  return libp2p
}