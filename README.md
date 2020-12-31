# gulp-ipfs
# usage
```
import cache from 'gulp-cache'
import gulpIpfs from 'gulp-ipfs'
import through from 'through2'

const processIpfs = gulpIpfs({
  //verbose: true, 
  name: "server",
  ipfs: 'http://localhost:5001',
  multiaddrs: "/ip4/10.0.0.19/tcp/4001/p2p/12D3KooW..."
})

//Point to output directory
gulp.src("/**/*")
  .pipe(cache(self.config.name))
  .pipe(processIpfs())
  .pipe(through.obj((publishedHash, enc, done) => {
    hash = publishedHash
    done()
  }))
```
