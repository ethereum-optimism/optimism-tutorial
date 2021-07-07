# Using Optimistic Ethereum with the Hardhat Development Environment

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial aims to help you get started with developing decentralized applications on [Optimistic Ethereum](https://optimism.io/) using [Hardhat](https://hardhat.org/). Applications 
running on top of Optimistic Ethereum are about as secure as those running on the underlying Ethereum mainnet itself, but are
[significantly cheaper](https://optimism.io/gas-comparison).


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
   sudo npm install -g yarn hardhat
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

4. Once the build process is finally done, start the Optimistic Ethereum node:

   ```sh
   docker-compose up
   ```

5. To see when the Optimistic Ethereum node starts, run (in a separate terminal):
   
   ```sh
   ~/optimism/ops/scripts/wait-for-sequencer.sh
   ```

## Migrate a Dapp to Optimistic Ethereum

Now that we have Optimistic Ethereum running, it is time to run a distributed application (dapp) on it.

**Note:** If you don't need the explanations and just want to see running code, 
[click here](https://github.com/ethereum-optimism/optimism-tutorial/). The 
`hardhat/dapp` directory
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

### Migrate the Sample App to Optimistic Ethereum

Now that we have a running Optimistic Ethereum node and a dapp to run on it, we can deploy to Optimistic Ethereum.

1. Install the Optimistic Ethereum hardhat plugin.
   ```sh
   yarn add @eth-optimism/hardhat-ovm
   ```
2. Edit `hardhat.config.js` to use the Optimistic Ethereum package.
   ```js
   require("@nomiclabs/hardhat-waffle");
   require('@eth-optimism/hardhat-ovm')

   ...
   ```
3. In the same file, add `optimistic` to the list of networks:
   ```js
   // hardhat.config.js

   ...
   
   module.exports = {
     solidity: "0.8.4",   // or whatever you get from HardHat
     networks: {
       // Add this network to your config!
       optimistic: {
          url: 'http://127.0.0.1:8545',
          accounts: { mnemonic: 'test test test test test test test test test test test junk' },
          gasPrice: 15000000,          
          ovm: true // This sets the network as using the ovm and ensure contract will be compiled against that.
       }
     }
   }
   ```

4. At this point you need to wait until the `docker-compose build` ends, if it hasn't yet, and then run
   `cd ~/optimism/ops ; docker-compose up`.

5. Test the contract on Optimistic Ethereum. Hardhat will recognize it has not been compiled and compile it for you.

   ```sh
   npx hardhat --network optimistic test
   ```

6. If you want to interact with the app manually, use the console. You can use the same JavaScript commands
   to control it you used above.
   ```sh
   npx hardhat --network optimistic console
   ```
   
   
#### Change the Solidity Version if Needed

To run on Optimistic Ethereum a contract needs to be compiled with a variant Solidity compiler. Sometimes
the latest version of Solidity supported by Optimistic Ethereum is not the same as the version used by the
sample app in HardHat. When that is the case, the `npx hardhat --network optimistic test` command
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
   npx hardhat test
   ```
4. Check the application works on Optimistic Ethereum.
   ```sh
   npx hardhat --network optimistic test
   ```


## Best Practices for Running Tests

As you may have noticed, in this tutorial we ran all the tests first on the HardHat EVM and only then on Optimistic Ethereum. This is
important, because it lets you isolate contract problems from problems that are the result of using Optimistic Ethereum rather than 
vanilla Ethereum.


## Conclusion

This tutorial has only touched the most basic points of Optimistic Ethereum development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/integration.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
