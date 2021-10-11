# Using Optimistic Ethereum with the Truffle Development Environment

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

his tutorial aims to help you get started with developing decentralized applications on [Optimistic Ethereum](https://optimism.io/) using 
[Truffle](https://www.trufflesuite.com/). Applications 
running on top of Optimistic Ethereum are about as secure as those running on the underlying Ethereum mainnet itself, but are
[significantly cheaper](https://optimism.io/gas-comparison).

> :warning: We are currently in the process of upgrading to OVM 2.0, but that
> is still work in progress (excepted to end 28 OCT 2021). This tutorial is
> already upgraded for OVM 2.0, but parts of it will change during the upgrade
> process.

   <!-- TEMO-OVM2.0 -->

## Build an Optimistic Ethereum Node

The fastest way to test and debug apps on Optimistic Ethereum is to run a 
local Optimistic Ethereum node, so we'll build one.
The directions in this section are for an Ubuntu 20.04 VM running on GCP with 
a 20 GB disk (the default, 10 GB, is not enough) and 16 GB RAM
but they should be similar for other Linux versions and other platforms.

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

This process downloads and starts an Optimistic Ethereum network of one node.

1. Clone the [Optimism monorepo](https://github.com/ethereum-optimism/optimism).
   Not that until we officially release OVM 2.0 you need to clone the `experimental`
   branch.

   ```sh
   git clone https://github.com/ethereum-optimism/optimism.git -b experimental
   ```
   <!-- TEMO-OVM2.0 -->

1. Start the Optimistic Ethereum node. This process downloads the images
   from [the Docker hub](https://hub.docker.com/u/ethereumoptimism), and 
   depending on the hardware it can take up to ten minutes.

   ```sh
   docker-compose -f docker-compose-nobuild.yml up -t 3600
   ``` 

   You might get a timeout at first. If that is the case, just run the 
   `docker-compose` command again.



## Migrate a Dapp to Optimistic Ethereum

Now that we have Optimistic Ethereum running, it is time to run a distributed application (dapp) on it.

**Note:** If you don't need the explanations and just want to see running code, 
[click here](https://github.com/ethereum-optimism/optimism-tutorial/). The 
`/truffle/dapp` directory
is just an `npm install` away from being a working example.

### Get a Sample Application

The easiest way is to start with a sample application. 

1. Open a second command line terminal
1. Run `truffle`, the development environment we use in this tutorial.
   The command `truffle unbox` gives us a default test application, MetaCoin.

   ```sh
   mkdir dapp
   cd dapp
   truffle unbox
   ```

1. In a separate command line window, run Ganache to test against. Port
   8545 is already used by Optimistic Ethereum, so we use port 7545.
   ```sh
   ganache-cli -v -p 7545
   ```
1. Edit `truffle-config.js` to specify that the `development` network is
   on port 7545:
   ```javascript
   module.exports = {
     networks: {
       development: {
         host: "localhost",
         port: 7545,
         network_id: "*", // Match any network id
         gas: 5000000
       }
     },
     .
     .
     .
   ```
1. Test the contract on Ganache.
   ```sh
   truffle test
   ```



### Migrate the Sample App to Optimistic Ethereum

Now that we have a running Optimistic Ethereum node and a dapp to run on it, we can deploy to Optimistic Ethereum.

1. Add the package to connect from Truffle to an external network:
   ```sh
   yarn add @truffle/hdwallet-provider
   ```

1. Edit `truffle-config.js` to specify the network configuration for accessing
   the development node
   on port 7545:
   ```javascript
   var Provider = require('@truffle/hdwallet-provider')
   var mnemonic = 'test test test test test test test test test test test junk'
   var localUrl = 'http://127.0.0.1:8545'

   .
   .
   .

   module.exports = {
     networks: {
       development: { ... },
       optimistic: {
         provider: () => new Provider(mnemonic, localUrl),
         network_id: "*"
       }
     },
   .
   .
   .
   ```

1. Test the application
   ```sh
   truffle test --network optimistic
   ```

## Best Practices for Running Tests

As you may have noticed, in this tutorial we ran all the tests first on the Ganache EVM and only then on Optimistic Ethereum. This is
important, because it lets you isolate contract problems from problems that are the result of using Optimistic Ethereum rather than 
vanilla Ethereum.


## Conclusion

This tutorial has only touched the most basic points of Optimistic Ethereum development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/l2/convert-2.0.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
