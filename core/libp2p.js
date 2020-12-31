var Libp2p = require('libp2p');
const TCP = require('libp2p-tcp')
const { NOISE } = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')
const GossipSub = require('libp2p-gossipsub')
const PeerId = require('peer-id')

module.exports = function startLibp2p(peerIdString, privateKey, endpoint) {
  return Libp2p.create({
    modules: {
      transport: [TCP],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX],
      pubsub: GossipSub
    },
    peerId: new PeerId(peerIdString, privateKey)
  }).then((libp2p) => {

    console.log("libp2p started");

    return libp2p.start().then(() => {
      return libp2p.dial(endpoint)
    }).then(() => {

      console.log("connected to peer")
      return libp2p
    })
  });
}