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

5. To see when the Optimistic Ethereum node starts, run (in a separate terminal) `.../ops/scripts/wait-for-sequencer.sh`. 
   For you installed the Optimism software on your home directory, the command is:
   
   ```sh
   ~/optimism/ops/scripts/wait-for-sequencer.sh
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

Note: You might this error:

```
Error: Could not create addresses from your mnemonic or private key(s). Please check that your inputs are correct.
```

If you do, edit `truffle-config.ovm.js` to specify the mnemonic for `optimistic_ethereum`: 

```javascript
const mnemonic = 'test test test test test test test test test test test junk' // process.env["MNEMONIC"];
```

## Best Practices for Running Tests

As you may have noticed, in this tutorial we ran all the tests first on the Ganache EVM and only then on Optimistic Ethereum. This is
important, because it lets you isolate contract problems from problems that are the result of using Optimistic Ethereum rather than 
vanilla Ethereum.


## Conclusion

This tutorial has only touched the most basic points of Optimistic Ethereum development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/integration.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
