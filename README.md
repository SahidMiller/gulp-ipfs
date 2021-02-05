# gulp-ipfs

Command line utility and developer tool for publishing files to IPFS/IPNS and monitoring for changes. 

| :zap:        For IPNS: start go-ipfs with `--enable-pubsub-experiment --enable-namesys-pubsub` |
|------------------------------------------------------------------------------------------------|


## Usage

### As global cli

#### Install
```
npm install -g sahidmiller/gulp-ipfs
```

#### Example

```
cd ./my-ipfs-project
$ node cli.js --ipfs-api="http://localhost:5001" --path="/c/Kode/webpack-series/" --ipns-key="test-publishing-key"
```

#### Command line options

The following command line options are available:

|Name|Required|Type|Default|Description|
|:--:|:-----:|:--:|:-----:|:----------|
|**`path`**|no|`{string}`|`process.cwd()`| Path to watch. Defaults to current directory |
|**`ipfs-api`**|no|`{string}`|`http://localhost:5001`| API URL for go-ipfs node. Required if config isn't passed in. |
|**`is-remote`**|no|`{boolean}`|`false`| If IPFS API is on remote machine |
|**`config`**|no|`{string}`|`undefined`| Configuration file path. Required if ipfsApi isn't passed in. |
|**`ignore`**|no|`{string\|Array<string>}`|`[]`| File globs to ignore relative to path. ex. node_modules/** |
|**`ipns-key`**|yes|`{string}`|`undefined`| Key name to import from go-ipfs api for publishing. Ignored if is-remote. Pass in publishingKey via config file instead. |
|**`seq-num`**|no|`{number}`|`0`| IPNS Record seqnum. Important that it's set higher than previous seqNum for quick updates. |
|**`no-ipns`**|no|`{boolean}`|`false`| Turn off IPNS publishing |
|**`verbose`**|no|`{boolean}`|`false`| Verbose logging for debugging purposes |

### Config file

Config file is a valid JSON file with the following properties:

|Name|Required|Type|Default|Description|
|:--:|:-----:|:--:|:-----:|:----------|
|**`ipfsApi`**|no|`{string}`|`http://localhost:5001`| API URL for go-ipfs node. |
|**`isRemote`**|no|`{boolean}`|`false`| If IPFS API is on remote machine |
|**`publishingKey`**|no|`{Object{ pem:string, password:string }\|string}`|`undefined`| If string, then key name to use for publishing. pem/password is required if go-ipfs is remote. pem/password is imported to go-ipfs node if local. |
|**`libp2pKey`**|no|`Object{ pem:string, password:string }\|PrivateKey\`|`undefined`| Private key import for libp2p node identity. Passed to Libp2p.create options. Use this if you want a consistent libp2p peer-id. |
|**`seqNum`**|no|`{number}`|`0`| IPNS Record seqnum. Important that it's set higher than previous seqNum for quick updates. |

### As library

#### Install

```
npm install --save-dev sahidmiller/gulp-ipfs
```

#### Example

```
import cache from 'gulp-cache'
import gulpIpfs from 'gulp-ipfs'
import through from 'through2'

const processIpfs = gulpIpfs({
  name: "server-project",
  verbose: true, 
  ipfsApi: 'http://localhost:5001',
  publishingKey: "testproj-development-key",
  libp2pKey: {
    pem: "---RSA--- ---END RSA---"
    password: "testpassword"
  }
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

#### Configuration

|Name|Required|Type|Default|Description|
|:--:|:-----:|:--:|:-----:|:----------|
|**`name`**|no|`{string}`|`undefined`| Name for differentiating multiple instances |
|**`ipfsApi`**|no|`{string}`|`http://localhost:5001`| API URL for go-ipfs node. |
|**`isRemote`**|no|`{boolean}`|`false`| If IPFS API is on remote machine |
|**`noIpns`**|no|`{boolean}`|`false`| Turn off IPNS publishing |
|**`publishingKey`**|no|`{Object{ pem:string, password:string }\|string}`|`undefined`| If string, then key name to use for publishing. pem/password is required if go-ipfs is remote. pem/password is imported to go-ipfs node if local. |
|**`libp2pKey`**|no|`Object{ pem:string, password:string }\|PrivateKey\`|`undefined`| Private key import for libp2p node identity. Passed to Libp2p.create options. Use this if you want a consistent libp2p peer-id. |
|**`seqNum`**|no|`{number}`|`0`| IPNS Record seqnum. Important that it's set higher than previous seqNum for quick updates. |
|**`filter`**|no|`{Array<string>}`|`[]`| File globs to ignore relative to path. ex. node_modules/** |
|**`verbose`**|no|`{boolean}`|`false`| Verbose logging for debugging purposes |
