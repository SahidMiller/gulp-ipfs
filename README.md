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
gulp-ipfs --config="/c/ipfs-config.json" --key="api" --path="/c/test/repo"
```

#### Command line options

The following command line options are available:

|Name|Required|Type|Default|Description|
|:--:|:-----:|:--:|:-----:|:----------|
|**`config`**|yes|`{string}`|`undefined`| Configuration file path |
|**`key`**|yes|`{string}`|`undefined`| Key name to import from go-ipfs api for publishing |
|**`path`**|no|`{string}`|`process.cwd()`| Path to watch. Defaults to current directory |
|**`ignore`**|no|`{string\|Array<string>}`|`[]`| File globs to ignore relative to path. ex. node_modules/** |
|**`seq-num`**|no|`{number}`|`0`| IPNS Record seqnum. Important that it's set higher than previous seqNum for quick updates. |
|**`verbose`**|no|`{boolean}`|`false`| Verbose logging for debugging purposes |

### Config file

Config file is a valid JSON file with the following properties:

|Name|Required|Type|Default|Description|
|:--:|:-----:|:--:|:-----:|:----------|
|**`remote_ipfs`**|yes|`Object { api:string, multiaddress:string }`|`undefined`| API and multiaddress for your local go-ipfs node. We use API to upload objects and multiaddress to publish IPNS updates |
|**`libp2p_key`**|no|`Object { pem:string, password:string }\|String`|`undefined`| Private key import for libp2p node identity. Passed to Libp2p.create options. Use this if you want a consistent libp2p peer-id. If string, will import from remote node |

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
  remote_ipfs: {
    api: 'http://localhost:5001',
    multiaddrs: "/ip4/10.0.0.19/tcp/4001/p2p/12D3KooW..."
  },
  publishing_key: "testproj-development-key",

  libp2p_key: {
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
|**`remote_ipfs`**|yes|`Object { api: string, multiaddress: string }`|`undefined`| API and multiaddress for your local go-ipfs node. We use API to upload objects and multiaddress to publish IPNS updates |
|**`publishing_key`**|yes|`{string}`|`undefined`| Key name to use for publishing. Gulp-ipfs will fetch this key from remote |
|**`libp2p_key`**|no|`Object{ pem:string, password:string }\|PrivateKey\|String`|`undefined`| Private key import for libp2p node identity. Passed to Libp2p.create options. Use this if you want a consistent libp2p peer-id. If string, will import from remote node |
|**`seqNum`**|no|`{number}`|`0`| IPNS Record seqnum. Important that it's set higher than previous seqNum for quick updates. |
|**`filter`**|no|`{Array<string>}`|`[]`| File globs to ignore relative to path. ex. node_modules/** |
|**`verbose`**|no|`{boolean}`|`false`| Verbose logging for debugging purposes |
