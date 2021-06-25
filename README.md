# Using Optimism with the Hardhat Development Environment

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial aims to help you get started with developing decentralized applications on [Optimism](https://optimism.io/). Applications running on
top of Optimism are about as secure as those running on the underlying Ethereum mainnet itself, but are
[significantly cheaper](https://optimism.io/gas-comparison).


## Building an Optimism Server

To test and debug on Optimism you need to have a running Optimism server, so the first step is to build one. The directions in this section are for a Debian 10
VM running on GCP with a 13 GB disk (the default, 10 GB, is not enough), but they should be similar for other Linux versions running on other platforms.

### Prerequisite Software

1. Install packages.
   ```sh
   sudo apt install -y wget git docker docker.io build-essential docker-compose
   ```

2. Install Node.js. The version in the Docker repository is out of date, so we'll use one from a different source.
   ```sh
   curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
   sudo bash nodesource_setup.sh
   sudo apt install -y nodejs
   ```

3. Install npm packages
   ```sh
   sudo npm install -g yarn
   sudo npm install -g hardhat
   ```

4. Add yourself to the docker group.
   ```sh
   sudo usermod -a -G docker `whoami`
   ```

5. Start a new terminal window.


### Start an Optimism Server (with Docker)

This process downloads, compiles, and builds an Optimism network. Note that it takes a long time.

```sh
git clone https://github.com/ethereum-optimism/optimism.git
cd optimism
yarn install
yarn build
cd ops
docker-compose build
```

When you get the **done** message from `docker-compose` you might need to stop it manually.

```sh
docker-compose up
```

When start seeing log entries scrolling on the console it means the system is now running. 


## Migrating a Dapp to Optimism

Now that we have Optimism running, it is time to run a distributed application (dapp) on it.

### Get a Sample Application

The easiest way is to start with a sample application. 

1. Open a second command line terminal
2. Run `hardhat`, the development environment we use in this tutorial
   ```sh
   mkdir dapp
   cd dapp
   npx hardhat
   ```
3 Select **Create a sample project** and accept all the defaults.
4 Verify the sample application.
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

### Migrating the Sample App to Optimism

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
       ...
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
   

   

## Conclusion

This tutorial has only touched the most basic points of Optimism development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/integration.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
