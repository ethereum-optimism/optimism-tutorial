# Using Optimism with the Truffle Development Environment

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial aims to help you get started with developing decentralized applications on [Optimism](https://optimism.io/) using Truffle. Applications 
running on top of Optimism are about as secure as those running on the underlying Ethereum mainnet itself, but are
[significantly cheaper](https://optimism.io/gas-comparison).

You can use the [Optimism Truffle box](https://www.trufflesuite.com/boxes/optimism) which
handles most of these details for us. 

https://www.trufflesuite.com/boxes/optimism


## Build an Optimism Server

To test and debug on Optimism you need to have a running Optimism server, so the first step is to build one. The directions in this section are 
for an Ubuntu 20.04 VM running on GCP with a 20 GB disk (the default, 10 GB, is not enough), but they should be similar for other Linux 
versions and other platforms

### Install Prerequisite Software

1. Install [Docker](https://www.docker.com/). If you prefer not to use the convenience script, [read the documentation
   to learn other methods to install](https://docs.docker.com/engine/install/ubuntu).

   ```sh
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install -y docker-compose
   sudo usermod -a -G docker `whoami`
   ```
 

2. Install [Node.js](https://nodejs.org/en/) and a number of npm packages. The version in the OS repository is 
  out of date, so we'll get the package from a different source.

   ```sh
   curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
   sudo bash nodesource_setup.sh
   sudo apt install -y nodejs
   sudo npm install -g yarn truffle ganache-cli
   ```
   
3. Start a new terminal window to ensure the OS knows you are now a member of the `docker` 
   group and authorized to create and manage Docker images and containers.


### Start an Optimism Server

This process downloads, compiles, and builds an Optimism network. Note that it takes a long time.

```sh
git clone https://github.com/ethereum-optimism/optimism.git
cd optimism
yarn install
yarn build
cd ops
docker-compose build
```

Note that you will see a **Done** message at some point during the build process. Ignore it,
it means that a specific section is done, and even though you do not see progress at that 
moment the build is continuing.

```sh
docker-compose up
```

When start seeing log entries scrolling on the console it means the system is now running. 


## Migrate a Dapp to Optimism

Now that we have Optimism running, it is time to run a distributed application (dapp) on it.

**Note:** If you don't need the explanations and just want to see running code, 
[click here](https://github.com/ethereum-optimism/optimism-tutorial/). The 
`truffle/dapp` directory
is just an `npm install` away from being a working example.

### Get a Sample Application

The easiest way is to start with a sample application. 

1. Open a second command line terminal
2. Run `hardhat`, the development environment we use in this tutorial
   ```sh
   mkdir dapp
   cd dapp
   npx hardhat
   ```
3. Select **Create a sample project** and accept all the defaults.
4. Verify the sample application.
   ```sh
   npx hardhat test
   ```
   
#### Interact with the Sample App Manually (optional)   
   
If you want to be more hands on, you can interact with the contract manually.

1. Start the console
   ```sh
   npx hardhat console
   ```
2. Deploy the greeter contract.
   ```javascript
   const Greeter = await ethers.getContractFactory("Greeter")
   const greeter = await Greeter.deploy("Hello, world!")
   await greeter.deployed()
   ```
3. Get the current greeting.
   ```javascript
   await greeter.greet()
   ```
4. Modify the greeting.
   ```javascript
   const tx = await greeter.setGreeting("Hola, mundo")
   await tx.wait()
   ```
5. Verify the greeting got modified.
   ```javascript
   await greeter.greet()
   ```
   
6. Leave the console.
   ```javascript
   .exit
   ```

### Migrate the Sample App to Optimism

Now that we have a running Optimism server, and an a dapp to run on it, we can run on Optimism.

1. Install the Optimism package in the application.
   ```sh
   yarn add @eth-optimism/hardhat-ovm
   ```
2. Edit `hardhat.config.js` to use the Optimism package.
   ```js
   require("@nomiclabs/hardhat-waffle");
   require('@eth-optimism/hardhat-ovm')

   ...
   ```
3. In the same file, add `optimism` to the list of networks:
   ```js
   // hardhat.config.js

   ...
   
   module.exports = {
     networks: {
       // Add this network to your config!
       optimism: {
          url: 'http://127.0.0.1:8545',
          accounts: {
             mnemonic: 'test test test test test test test test test test test junk'
          },
          // This sets the gas price to 0 for all transactions on L2. We do this
          // because account balances are not automatically initiated with an ETH
          // balance (yet, sorry!).
          gasPrice: 0,
          ovm: true // This sets the network as using the ovm and ensure contract will be compiled against that.
       }
     }
   }
   ```

4. Test the contract on Optimism. Hardhat will recognize it has not been compiled and compile it for you.

   ```sh
   npx hardhat --network optimism test
   ```

5. If you want to interact with the app manually, use the console. You can use the same JavaScript commands
   to control it you used above.
   ```sh
   npx hardhat --network optimism console
   ```
   
   
#### Change the Solidity Version if Needed

To run on Optimism a contract needs to be compiled with a variant Solidity compiler. Sometimes
the latest version of Solidity supported by Optimism is not the same as the version used by the
sample app in HardHat. When that is the case, the `npx hardhat --network optimism test` command
fails with an error message similar to:

```
OVM Compiler Error (insert "// @unsupported: ovm" if you don't want this file to be compiled for the OVM):
 contracts/Greeter.sol:2:1: ParserError: Source file requires different compiler version (current compiler is 0.7.6) - note that nightly builds are considered to be strictly less than the released version
pragma solidity ^0.8.0;
^---------------------^

Error HH600: Compilation failed
```

To solve this problem:

1. Edit the `hardhat.config.js` file to change `module.exports.solidity` to the supported version.
2. Edit `contracts/Greeter.sol` to change the `pragma solidity` line to the supported version.
3. Check the application still works on normal Ethereum.
   ```sh
   npx hardhat console
   ```
4. Check the application works on Optimism.
   ```sh
   npx hardhat --network optimism console
   ```


## How to Run Tests

As you may have noticed, in this tutorial we ran all the tests first on the HardHat EVM and only then on Optimism. This is
important, because it lets you isolate contract problems from problems that are the result of using Optimism rather than 
vanilla Ethereum.


## Conclusion

This tutorial has only touched the most basic points of Optimism development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/integration.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
