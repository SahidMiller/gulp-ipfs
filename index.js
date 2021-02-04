const through = require('through2');
const createManifest = require('./core/manifest')

module.exports = function(opts) {
  //TODO God willing: option to save a manifest so don't repeat ourselves
  const getManifest = createManifest(opts)
  const name = opts.name || ""

  async function bufferContents(file, enc, cb) {
    // ignore empty files
    if (file.isNull()) {
      cb();
      return;
    }

    // we don't do streams (yet)
    if (file.isStream()) {
      this.emit('error', new Error('process-manifest: Streaming not supported'));
      cb();
      return;
    }

    //Queue file for build
    await (await getManifest).queue(file)
    cb()
  }

  async function endStream (cb)  {

    try {

      //Build
      const publishedHash = await (await getManifest).recalculate()
      
      console.log((opts.name ? 
        "Published " + opts.name + " hash: " : 
        "Published hash: ") + publishedHash)

      opts.verbose && console.log("----------------------")

      cb(null, publishedHash)

    } catch (error) {
      cb(error)
    }
  }

  return () => through.obj(bufferContents, endStream);
};