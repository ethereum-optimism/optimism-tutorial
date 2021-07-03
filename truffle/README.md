# Using Optimstic Ethereum with the Truffle Development Environment

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial aims to help you get started with developing decentralized applications on [Optimstic Ethereum](https://optimism.io/) using 
[Truffle](https://github.com/ethereum-optimism/optimism-tutorial.git). Applications 
running on top of Optimstic Ethereum are about as secure as those running on the underlying 
Ethereum mainnet itself, but are
[significantly cheaper](https://optimism.io/gas-comparison).


## Build an Optimstic Ethereum Server

To test and debug on Optimstic Ethereum you need to have a running Optimstic Ethereum server, so the first step is to build one. The directions 
in this section are 
for an Ubuntu 20.04 VM running on GCP with a 20 GB disk (the default, 10 GB, is not enough), but they should be 
similar for other Linux 
versions and other platforms

### Install Prerequisite Software

1. Install [Docker](https://www.docker.com/). If you prefer not to use the convenience script, 
   [there are other installation methods](https://docs.docker.com/engine/install/ubuntu).

   ```sh
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. Configure Docker settings:

   ```sh
   sudo usermod -a -G docker `whoami`
   sudo apt install -y docker-compose
    ```

3. Install [Node.js](https://nodejs.org/en/) and a number of npm packages. The version in the OS repository is 
  out of date, so we'll get the package from a different source.

   ```sh
   curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
   sudo bash nodesource_setup.sh
   sudo apt install -y nodejs
   ```
   
4. Install the Node.js packages we need.
   ```sh   
   sudo npm install -g yarn truffle ganache-cli
   ```
   
5. Log out and log back in to refresh the group information.


### Start an Optimstic Ethereum Server

This process downloads, compiles, and builds an Optimstic Ethereum network. Note that it takes a long time.

```sh
git clone https://github.com/ethereum-optimism/optimism.git
cd optimism
yarn install
yarn build
cd ops
export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1
docker-compose build # --parallel
```

Note that you will see a **Done** message at some point during the build process. Ignore it,
it means that a specific section is done, and even though you do not see progress at that 
moment the build is continuing.

This process is time consuming. You can continue the tutorial for now, I will note when you
need to stop and wait for it to finish.

```sh
docker-compose up
```

When start seeing log entries scrolling on the console it means the system is now running. 


## Migrate a Dapp to Optimstic Ethereum

Now that we have Optimstic Ethereum running, it is time to run a distributed application (dapp) on it.

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
   
   Note: If you get a `Db.connect` error it is because the Truffle database is not installed. The easiest way to remove this error is to
   edit `truffle-config.js` and specify that `module.exports.db` is not enabled:
   ```javascript
     db: {
        enabled: false
     }
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


### Migrate the Sample App to Optimstic Ethereum

Now that we have a running Optimstic Ethereum server, and an dapp to run on it, we can run a test on Optimistic Ethereum:

```sh
truffle test --config truffle-config.ovm.js --network optimistic_ethereum
```

The other commands are similar. For example, to compile and then run the console, use:

```sh
truffle compile --config truffle-config.ovm.js --network optimistic_ethereum
truffle console --config truffle-config.ovm.js --network optimistic_ethereum
```

Note: You might need to disable `module.exports.db` in `truffle-config.ovm.js` too. Also, you might this error:

```
Error: Could not create addresses from your mnemonic or private key(s). Please check that your inputs are correct.
```

If you do, edit `truffle-config.ovm.js` to specify the mnemonic for `optimistic_ethereum`: 

```javascript
const mnemonic = 'test test test test test test test test test test test junk' // process.env["MNEMONIC"];
```

## How to Run Tests

As you may have noticed, in this tutorial we ran all the tests first on the HardHat EVM and only then on Optimstic Ethereum. This is
important, because it lets you isolate contract problems from problems that are the result of using Optimstic Ethereum rather than 
vanilla Ethereum.


## Conclusion

This tutorial has only touched the most basic points of Optimstic Ethereum development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/integration.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
