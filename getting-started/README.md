# Getting started developing for Optimism

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial teaches you the basics of Optimism development.
Optimism is [EVM equivalent](https://medium.com/ethereum-optimism/introducing-evm-equivalence-5c2021deb306), meaning we run a slightly modified version of the same `geth` you run on mainnet.
Therefore, we the differences between Optimism development and Ethereum development are minor.
But a few differences [do exist](https://community.optimism.io/docs/developers/build/differences/#).

## Optimism endpoint URL

To access any Ethereum type network you need an endpoint. 
We recommend you get one from [Alchemy, our preferred provider](https://www.alchemy.com/).

If you prefer, we have [other providers too](https://community.optimism.io/docs/useful-tools/providers/).




### Network choice

For development purposes we recommend you use either a local development node or [Optimism Goerli](https://blockscout.com/optimism/goerli).
That way you don't need to spend real money.
If you need ETH on Optimism Goerli for testing purposes, [you can use this faucet](https://optimismfaucet.xyz/).

The tests examples below all use Optimism Goerli.


## Interacting with Optimism contracts

We have [Hardhat's Greeter contract](https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol) on Optimism Goerli, at address [0x106941459A8768f5A92b770e280555FAF817576f](https://blockscout.com/optimism/goerli/address/0x106941459A8768f5A92b770e280555FAF817576f). 
You can verify your development stack configuration by interacting with it.

As you can see in the different development stacks below, the way you deploy contracts and interact with them on Optimism is almost identical to the way you do it with L1 Ethereum.


## Hardhat

### Connecting to Optimism

In [Hardhat](https://hardhat.org/) you use a configuration similar to [this one](https://github.com/ethereum-optimism/optimism-tutorial/tree/main/getting-started/hardhat).
Here are the steps to create it:

1. Define your network configuration in `.env`:

   ```sh
   # Put the mnemonic for an account on Optimism here
   MNEMONIC=test test test test test test test test test test test junk

   # API KEY for Alchemy
   ALCHEMY_API_KEY=

   # URL to access Optimism Goerli (if not using Alchemy)
   OPTIMISM_GOERLI_URL=
   ```

1. Add `dotenv` to your project:

   ```sh
   yarn add dotenv
   ```

1. Edit `hardhat.config.js`:

   1. Use `.env` for your blockchain configuration:

      ```js
      require('dotenv').config()
      ```

   1. Get the correct URL from the configuration:

      ```js
      const optimismGoerliUrl =
         process.env.ALCHEMY_API_KEY ?
            `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` :
            process.env.OPTIMISM_GOERLI_URL
      ```


   1. Add a network definition in `module.exports.networks`:

   ```js
   "optimism-goerli": {
      url: optimismGoerliUrl,
      accounts: { mnemonic: process.env.MNEMONIC }
   }   
   ```



### Greeter interaction

1. Run the console:
   ```sh
   cd hardhat
   yarn
   yarn hardhat console --network optimism-goerli
   ```

1. Connect to the Greeter contract:   

   ```js
   Greeter = await ethers.getContractFactory("Greeter")
   greeter = await Greeter.attach("0x106941459A8768f5A92b770e280555FAF817576f")
   ```   

1. Read information from the contract:

   ```js
   await greeter.greet()
   ```

1. Submit a transaction, wait for it to be processed, and see that it affected the state.

   ```js
   tx = await greeter.setGreeting(`Hello ${new Date()}`)
   rcpt = await tx.wait()  
   await greeter.greet()
   ```

### Deploying a contract

To deploy a contract from the Hardhat console:

```
Greeter = await ethers.getContractFactory("Greeter")
greeter = await Greeter.deploy("Greeter from hardhat")
console.log(`Contract address: ${greeter.address}`)
await greeter.greet()
```

## Truffle

### Connecting to Optimism

In [Truffle](https://trufflesuite.com/):

1. Define your network configuration in `.env`:

   ```sh
   # Put the mnemonic for an account on Optimism here
   MNEMONIC="test test test test test test test test test test test junk"

   # URL to access Optimism Goerli
   OPTI_GOERLI_URL=https://goerli.optimism.io
   ```

1. Add `dotenv` and `@truffle/hdwallet-provider` to your project:

   ```sh
   yarn add dotenv @truffle/hdwallet-provider
   ```


1. Edit `truffle-config.js`:

   1. Uncomment this line:

      ```js
      const HDWalletProvider = require('@truffle/hdwallet-provider')
      ```

   1. Use `.env` for your network configuration:

      ```js
      require('dotenv').config()
      ```

   1. Add a network definition in `module.exports.networks`:

      ```js
      "optimism-goerli": {
         provider: () => new HDWalletProvider(
            process.env.MNEMONIC,
            process.env.OPTI_GOERLI_URL)
      }
      ```



### Greeter interaction

1. Compile the contract and run the console:

   ```sh
   truffle compile
   truffle console --network optimism-goerli
   ```

1. Connect to the Greeter contact:

   ```js
   greeter = await Greeter.at("0x106941459A8768f5A92b770e280555FAF817576f")
   ```

1. Read information from the contact:

   ```js
   await greeter.greet()
   ```

1. Submit a transaction, wait for it to be processed, and see that it affected the state.

   ```js
   tx = await greeter.setGreeting(`Hello ${new Date()}`)
   await greeter.greet()
   ```


### Contract deployment

You deploy a new contract from the console:

```
greeter = await Greeter.new("Greeter from Truffle")
console.log(`Contract address: ${greeter.address}`)
await greeter.greet()
```


## Brownie

[Brownie](https://eth-brownie.readthedocs.io/en/stable/install.html) is an Ethereum development environment, similar to Hardhat and Truffle, but using Python rather than JavaScript.


### Connecting to Optimism

1. Add the Goerli test network:

   ```sh
   brownie networks add "Optimistic Ethereum" optimism-goerli \
      chainid=420 explorer=https://blockscout.com/optimism/goerli \
      host= << Optimism Goerli URL >>
   ```

1. Initialize the Brownie project:

   ```sh
   brownie init
   ```

1. Create a file, `brownie-config.yaml`, with this content:

   ```yml
   console:
      show_colors: false   
   ```

1.    

1. Define your network configuration in `.env`:

   ```sh
   # Put the private key for an Optiumism account here
   PRIVATE_KEY=dead60a7dead60a7dead60a7dead60a7dead60a7dead60a7dead60a7dead60a7

   # URL to access Optimism Goerli
   OPTI_GOERLI_URL=https://goerli.optimism.
   ```


1. Install the libraries:

   ```sh
   sudo pip3 install moodyeth python-dotenv
   ```


1. Run Python 3

   ```sh
   python3
   ```


1. Import the configuration

   ```python
   import os
   from dotenv import load_dotenv

   load_dotenv()   
   ```


1. Import the libraries:

   ```python
   import moody, moody.libeb
   ```


1. Obtain the Optimism configuration:

   ```python
   optConf = moody.conf.OptimisticEthereum()
   ```


1. Modify the configuration to access the test network:

   ```python
   optConf.chain_id = 420
   optConf.network_name = 'OptimismGoerli'
   optConf.rpc_url = os.getenv("OPTI_GOERLI_URL")
   ```


1. Create the connection object:

   ```python
   conn = moody.libeb.MiliDoS(optConf).Auth(os.getenv("PRIVATE_KEY"))
   ```

1. 


### Greeter interaction

1. Run the console:
   ```sh
   cd hardhat
   yarn
   yarn hardhat console --network optimism-goerli
   ```

1. Connect to the Greeter contract:   

   ```js
   Greeter = await ethers.getContractFactory("Greeter")
   greeter = await Greeter.attach("0x106941459A8768f5A92b770e280555FAF817576f")
   ```   

1. Read information from the contract:

   ```js
   await greeter.greet()
   ```

1. Submit a transaction, wait for it to be processed, and see that it affected the state.

   ```js
   tx = await greeter.setGreeting(`Hello ${new Date()}`)
   rcpt = await tx.wait()  
   await greeter.greet()
   ```

### Deploying a contract

To deploy a contract from the Hardhat console:

```
Greeter = await ethers.getContractFactory("Greeter")
greeter = await Greeter.deploy("Greeter from hardhat")
console.log(`Contract address: ${greeter.address}`)
await greeter.greet()
```




## Remix

### Connecting to Optimism

In [Remix](https://remix.ethereum.org) you access Optimism through your own wallet.

1. Add Optimism Goerli to your wallet. 
   If you use Metamask, [follow the directions here (starting at step 4)](https://help.optimism.io/hc/en-us/articles/6665988048795), with these parameters:

   | Parameter | Value |
   | --------- | ----- |
   | Network Name | Optimism Goerli |
   | New RPC URL  | Either a third party provider or https://goerli.optimism.io |
   | Chain ID     | 420 |
   | Currency Symbol | GOR |
   | Block Explorer URL | https://blockscout.com/optimism/goerli |

1. Log on with your wallet to Optimism Goerli.

1. Browse to [Remix](https://remix.ethereum.org/).
1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).
1. Select the Environment **Injected Web3 Provider**.
1. Accept the connection in the wallet.

### Greeter interaction

1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).

1. Make sure your environment is **Injected Web3** and the network ID is **420**.

   <img src="assets/remix-env.png" width="300" />

1. Click the files icon (<img src="assets/remix-files-icon.png" height="24" valign="top" />).

1. Download [Greeter.sol](hardhat/contracts/Greeter.sol) and upload (<img src="assets/remix-upload-icon.png" height="24" valign="top" />) it to Remix under **contracts**.

1. Right-click **contracts > Greeter.sol** and select **Compile**.

1. Open **contracts > artifacts** and see that there's a `Greeter.json` file. This file is the compiled version, the API for the contract, etc.

1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).

   If you do not have Goerli ETH, get some using [Paradigm's faucet](https://faucet.paradigm.xyz/) and transfer it to Optimism by sending it to address [0x636Af16bf2f682dD3109e60102b8E1A089FedAa8](https://goerli.etherscan.io/address/0x636Af16bf2f682dD3109e60102b8E1A089FedAa8).

1. Scroll down. 
   In the At Address field, type the contract address (`0x106941459A8768f5A92b770e280555FAF817576f`).
   Then, click **At Address**. 
   Expand the contract to see you can interact with it.

   <img src="assets/remix-connect.png" width="300" />

1. Click **greet** and expand the transaction result in the console (bottom right).

   ![](assets/remix-query.png)

1. Type a greeting and then click **setGreeting**. Approve the transaction in your wallet. 
   Note that if the greeting includes a comma you need to enclose it in quotes.

   <img src="assets/remix-tx.png" width="300" />

1. See the results on the console and then click **greet** again to see the greeting changed.   


### Contract deployment

You deploy a new contract:

1. Type a string for the greeter.

1. Click **Deploy**.

   <img src="assets/remix-deploy.png" width="300" />

1. Confirm the transaction in the wallet.



## Foundry

### Greeter interaction

Foundry does not give us a JavaScript console, everything can be done from the shell command line.

1. Set the RPC URL and the contract address.

   ```sh
   export ETH_RPC_URL= << Your Goerli URL goes here >>
   export GREETER=0x106941459A8768f5A92b770e280555FAF817576f   
   ```

1. Call `greet()`. Notice that the response is provided in hex.

   ```sh
   cast call $GREETER "greet()"
   ```

1. Call `greet()` again, and this time translate to ASCII

   ```sh
   cast call $GREETER "greet()" | cast --to-ascii
   ```

1. Put your mnemonic in a file `mnem.delme` and send a transaction. 

   ```sh
   cast send --mnemonic-path mnem.delme $GREETER "setGreeting(string)" '"hello"' --legacy
   ```

1. Test that the greeting has changed:

   ```sh
   cast call $GREETER "greet()" | cast --to-ascii
   ```

### Contract deployment

Use this command:

```sh
forge create --mnemonic-path ./mnem.delme Greeter \
   --constructor-args "Greeter from Foundry" --legacy
```


### Using the Optimism contract library

This library is provided as an [npm package](https://www.npmjs.com/package/@eth-optimism/contracts), which is different from what forge expects.
Here is how you can import it without importing the entire Optimism monorepo:

1. Install the JavaScript tools if you don't already have them: [Node.js](https://nodejs.org/en/download/) and [yarn](https://classic.yarnpkg.com/lang/en/).

1. Install the `@eth-optimism/contracts` library under `lib`.

   ```sh
   cd lib
   yarn add @eth-optimism/contracts
   ```

1. If you are using `git`, add `node_modules` to [`.gitignore`](https://git-scm.com/docs/gitignore).

1. The remapping that `forge` deduces is not the same as what you would have with hardhat.
   To ensure source code compatibility, create a file (in the application's root directory) called `remappings.txt` with this content:
 
   ```
   @eth-optimism/=lib/node_modules/@eth-optimism/
   ```

You can now run `forge build` with contracts that use the Optimism contract library.

To see this in action:

1. Install the JavaScript libraries

  ```sh
  cd foundry/lib
  yarn
  ```

1. Test the application

   ```sh
   cd ..
   forge test
   ```



## Waffle

Starting from [Waffle](https://github.com/TrueFiEng/Waffle) v4.x.x you can use Waffle chai matchers to test your smart contracts directly on an Optimism node.

### Prerequisites

The tutorial makes these assumptions:

1. You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
1. You have `make` installed on your computer (you can verify this by running `which make` in the terminal).
1. You have a Goerli Optimism address with enough funds on it. You can use [these faucets](https://community.optimism.io/docs/useful-tools/faucets/) to get some free test funds.
1. You have general understanding of smart contracts development.

### Instructions

1. Insert your mnemonic in the [line 15 of `...waffle/test/mock-contract.test.ts`](./waffle/test/mock-contract.test.ts#L15) to use your address in the test.

1. In the terminal, run the following commands:

   ```sh
   cd waffle
   yarn
   yarn build
   yarn test
   ```

   You should see 2 tests passing.

1. Play around with the code! Check out other available matchers in the [Waffle documentation](https://ethereum-waffle.readthedocs.io/en/latest/).



### Compatibility with other tools

Note that in the tutorial we've been compiling smart contracts using [Waffle](https://github.com/TrueFiEng/Waffle). If you prefer to compile your smart contracts using other tools (like [Hardhat](https://hardhat.org/)) you can install the appropriate packages and modify `build` script in the `package.json` file.

## Best practices

It is best to start development with the EVM provided by the development stack. 
Not only is it faster, but such EVMs often have extra features, such as the [ability to log messages from Solidity](https://hardhat.org/tutorial/debugging-with-hardhat-network.html) or a [graphical user interface](https://trufflesuite.com/ganache/).

After you are done with that development, debug your decentralized application using either a [development node](https://community.optimism.io/docs/developers/build/dev-node/) or the [Kovan test network](https://community.optimism.io/docs/useful-tools/networks/#rpc-endpoints). 
This lets you debug parts that that are Optimism specific such as calls to bridges to transfer assets between layers.

Only when you have a version that works well on a test network should you deploy to the production network, where every transaction has a cost.
