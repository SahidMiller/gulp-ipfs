var { DAGLink } = require('ipld-dag-pb')
var { DAGNode } = require('ipld-dag-pb')
var UnixFS = require('ipfs-unixfs')

class Manifest {

  constructor() {
    this.type = 'directory'
    this.hash = null
    this.children = {}
    this.size = 0
  }

  addFile(path, size, hash) {
    const restPath = path.split('\\')
    let currentDirectory = this

    for (let i = 0; i < restPath.length; i++) {
      const name = restPath[i]
      const isLastItem = i === restPath.length - 1

      if (isLastItem) {
        currentDirectory.children[name] = { hash, type: 'file', size }
      } else {
        currentDirectory.children[name] = currentDirectory.children[name] || new Manifest()
        currentDirectory = currentDirectory.children[name] 
      }
    }
  }

  getFromPath(path) {
    const restPath = path.split('\\')
    let currentDirectory = this

    for (let i = 0; i < restPath.length; i++) {
      const name = restPath[i]
      const isLastItem = i === restPath.length - 1

      if (isLastItem) {
        return currentDirectory.children[name]
      } else {
        currentDirectory = currentDirectory.children[name]
      }
    }
  }

  calculateSize() {
    return Object.keys(this.children).reduce((size, name) => {
      
      const child = this.children[name]

      if (child.type === 'file') {

        return size + child.size

      } else {

        //God willing, this is where a directories node would come in handy, God willing.
        //Assuming it already was built
        return size + child.calculateSize()
      }
    }, this.size)
  }

  buildNode() {
    const itemsAsLinks = Object.keys(this.children).map(itemName => {
      const itemManifest = this.children[itemName]

      if (itemManifest.type === 'file') {
        return new DAGLink(itemName, itemManifest.size, itemManifest.hash)

      } else {

        const size = itemManifest.calculateSize()
        return new DAGLink(itemName, size, itemManifest.hash)
      }
    });

    const dir = new UnixFS('directory').marshal();
    return new DAGNode(dir, itemsAsLinks)
  }
}

module.exports = Manifest