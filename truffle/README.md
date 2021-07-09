# Using Optimistic Ethereum with the Truffle Development Environment

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial aims to help you get started with developing decentralized applications on [Optimistic Ethereum](https://optimism.io/) using 
[Truffle](https://www.trufflesuite.com/). Applications 
running on top of Optimistic Ethereum are about as secure as those running on the underlying 
Ethereum mainnet itself, but are
[significantly cheaper](https://optimism.io/gas-comparison).


## Build an Optimistic Ethereum Server

To test and debug on Optimistic Ethereum you need to have a running Optimistic Ethereum server, so the first step is to build one. The directions 
in this section are 
for an Ubuntu 20.04 VM running on GCP with a 20 GB disk (the default, 10 GB, is not enough), but they should be 
similar for other Linux 
versions and other platforms

### Install Prerequisite Software
## Build an Optimistic Ethereum Node

The fastest way to test and debug apps on Optimistic Ethereum is to run a local Optimistic Ethereum node, so we'll build one.
The directions in this section are for an Ubuntu 20.04 VM running on GCP with a 20 GB disk (the default, 10 GB, is not enough), 
but they should be similar for other Linux versions and other platforms

### Install Prerequisite Software

1. Install [Docker](https://www.docker.com/). If you prefer not to use the convenience script shown below, 
   [there are other installation methods](https://docs.docker.com/engine/install/ubuntu).

   ```sh
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. Configure Docker settings.

   ```sh
   sudo usermod -a -G docker `whoami`
   ```
   
3. Install [Docker Compose](https://docs.docker.com/compose/install/).
  
   ```sh
   sudo apt install -y docker-compose
   ```

4. Install [Node.js](https://nodejs.org/en/). The version in the OS repository is 
  out of date, so we'll get the package from a different source. 
  
   ```sh
   curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
   sudo bash nodesource_setup.sh
   sudo apt install -y nodejs
   ```
   
5. Install the Node.js packages we need. [See here](https://github.com/sindresorhus/guides/blob/main/npm-global-without-sudo.md)
   if you'd rather install these packages without root permissions.
   ```sh   
   sudo npm install -g yarn truffle ganache-cli
   ```
   
6. Log out and log back in to complete the Docker installation (required).

### Start an Optimistic Ethereum Node

This process downloads, compiles, and builds an Optimistic Ethereum network. Note that it takes a long time.

1. Clone the [Optimism monorepo](https://github.com/ethereum-optimism/optimism).

   ```sh
   git clone https://github.com/ethereum-optimism/optimism.git
   cd optimism
   ```
   
2. Build the Optimistic Ethereum software.   
   
   ```sh
   yarn install
   yarn build
   ```
   
3. Build the Docker containers

   ```sh
   cd ops
   export COMPOSE_DOCKER_CLI_BUILD=1
   export DOCKER_BUILDKIT=1
   docker-compose build && echo Build complete
   ```

The build process is time consuming, and you do not need to wait for it to finish before you continue the tutorial.
I will note the point in the tutorial where you need to have a running Optimistic Ethereum Node. Hopefully it will
be finished by then (you will know when the build process is done because you'll see a **Build complete** message).
For now you can skip to the next section.

4. Once the build process is finally done, start the Optimistic Ethereum node:

   ```sh
   docker-compose up
   ```

5. To see when the Optimistic Ethereum node starts, you can start a separate command line window,
   change to `.../ops/scripts`, and run `./wait-for-sequencer.sh`.
   If you installed the Optimism software on your home directory, the commands are:
   
   ```sh
   cd ~/optimism/ops/scripts
   ./wait-for-sequencer.sh
   ```




## Migrate a Dapp to Optimistic Ethereum

Now that we have Optimistic Ethereum running, it is time to run a distributed application (dapp) on it.

**Note:** If you don't need the explanations and just want to see running code, 
[click here](https://github.com/ethereum-optimism/optimism-tutorial/). The 
`/truffle/dapp` directory
is just an `npm install` away from being a working example.

### Get a Sample Application

The easiest way is to start with a sample application. 

1. Open a second command line terminal
2. Run `truffle`, the development environment we use in this tutorial, to 
   [unbox an Optimistic Ethernet application](https://www.trufflesuite.com/boxes/optimism).
   ```sh
   mkdir dapp
   cd dapp
   truffle unbox optimism
   ```
3. In a separate command line window, run Ganache to have a normal Ethereum network to test against.
   ```sh
   ganache-cli -v -p 7545
   ```
4. Test the contract on normal Ethereum.
   ```sh
   truffle test
   ```

   
#### Interact with the Sample App Manually (optional)   
   
If you want to be more hands on, you can interact with the contract manually.

1. Compile the contract and then start the console
   ```sh
   truffle compile
   truffle console
   ```
2. Deploy the sample contract (`SimpleStorage`).
   ```javascript
   storage = await SimpleStorage.new()
   ```
3. Get the current value (which should be zero)
   ```javascript
   (await storage.get()).toString()
   ```
4. Modify the value
   ```javascript
   storage.set(31415)
   ```
5. Verify the value got modified.
   ```javascript
   (await storage.get()).toString()
   ```
6. Leave the console.
   ```javascript
   .exit
   ```


### Migrate the Sample App to Optimistic Ethereum

Now that we have a running Optimistic Ethereum node and a dapp to run on it, we can deploy to Optimistic Ethereum.

At this point you need to wait until the `docker-compose build` ends, if it hasn't yet, and then run
`cd ~/optimism/ops ; docker-compose up` (assuming you installed it in your home directory).
   
The command to run the contract tests on Optimistic Ethereum is:

```sh
truffle test --config truffle-config.ovm.js --network optimistic_ethereum
```

The other commands are similar. For example, to compile and then run the console, use:

```sh
truffle compile --config truffle-config.ovm.js --network optimistic_ethereum
truffle console --config truffle-config.ovm.js --network optimistic_ethereum
```

### Truffle Configuration

Most of the Optimistic Ethereum Truffle configuration is in the file `truffle-config.ovm.js`. Let's go over it,
with explanations for every part that isn't standard Truffle.

```javascript
// create a file at the root of your project and name it .env -- there you can set process variables
// like the mnemomic below. Note: .env is ignored by git in this project to keep your private information safe
require('dotenv').config();
```

If you have any private information, such an [mnemonics](https://wolovim.medium.com/ethereum-201-mnemonics-bb01a9108c38) 
for different networks or your [Infura](https://infura.io/) key, place it in a `.env` file and make sure that file is in
`.gitignore`. That way you won't share that information, but it will be available for you to develop.

```javascript
const ganacheMnemonic = process.env["GANACHE_MNEMONIC"];
const kovanMnemonic = process.env["KOVAN_MNEMONIC"];
const mnemonic = 'test test test test test test test test test test test junk' // process.env["MNEMONIC"];
```

This is the mnemonic for an account that was enough assets on both L1 and L2 of the test system you start with
`docker-compose up`. As this mnemonic is useful only for local testing, there is no reason to keep it a secret.

```javascript
const infuraKey = process.env["INFURA_KEY"];

//uncomment to use mainnetMnemonic, be sure to set it in the .env file
//const mainnetMnemonic = process.env["MAINNET_MNEMONIC"]

const { ganache } = require('@eth-optimism/plugins/ganache');
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {

  /**
  * contracts_build_directory tells Truffle where to store compiled contracts
  */
  contracts_build_directory: './build/optimism-contracts',
```

A separate directory so we won't clash if a contract with the same name exists in `build/ethereum-contracts`.

```javascript

  /**
  *  contracts_directory tells Truffle where to find your contracts
  */
  contracts_directory: './contracts/optimism',
```

Typically the contracts you deploy on Optimistic Ethereum are different from ones you deploy on regular Ethereum, so
they are placed in a separate directory. If you look in the default, `truffle-config.js`, you'll see that the L1 
contracts are in `contracts/ethereum` in this project.


```javascript
  networks: {
    development: {
      url: "http://127.0.0.1:7545",
      network_id: "*",
    },
    ganache: {
      network_id: 108,
      networkCheckTimeout: 100000,
      provider: function() {
        return ganache.provider({
          mnemonic: ganacheMnemonic,
          network_id: 108,
          default_balance_ether: 100,
        })
      }
    },
    //for use with local environment -- use `npm runLocalOptimism` to start
    optimistic_ethereum: {
      network_id: 420,
      gas:  15000000,
      provider: function() {
        return new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic
          },
          providerOrUrl: "http://127.0.0.1:8545/",
          addressIndex: 0,
          numberOfAddresses: 1,
          chainId: 420
        })
      }
    },
```

This is the local Optimistic Ethereum network.

```javascript
    optimistic_kovan: {
      network_id: 69,
      chain_id: 69,
      gas:  15000000,
      provider: function() {
        return new HDWalletProvider(kovanMnemonic, "https://optimism-kovan.infura.io/v3/"+ infuraKey, 0, 1);
      }
    },
```

You can also run tests on the Kovan test network. 

```javascript
    // requires a mainnet mnemonic; you can save this in .env or in whatever secure location
    // you wish to use
    optimistic_mainnet: {
      network_id: 10,
      chain_id: 10,
      provider: function() {
        return new HDWalletProvider(mainnetMnemonic, "https://optimism-mainnet.infura.io/v3/" + infuraKey, 0, 1);
      }
    }
```

And eventually you'll want to deploy on the main Optimistic Ethereum network.

```javascript
  },

  mocha: {
    timeout: 100000
  },
  compilers: {
    solc: {
      version: "node_modules/@eth-optimism/solc",
```

Because of the way Optimistic Ethereum works, with contract calls replacing certain opcodes to ensure it will be possible to
replicate the results on L1, it requires a different compiler for Solidity.

```javascript
      settings:  {
        optimizer: {
          enabled: true,
          runs: 800
        }
      }
    },
  },
  db: {
    enabled: false
  }
}

```

## Best Practices for Running Tests

As you may have noticed, in this tutorial we ran all the tests first on the Ganache EVM and only then on Optimistic Ethereum. This is
important, because it lets you isolate contract problems from problems that are the result of using Optimistic Ethereum rather than 
vanilla Ethereum.


## Conclusion

This tutorial has only touched the most basic points of Optimistic Ethereum development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/integration.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
