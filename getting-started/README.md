# Getting started developing for Optimism

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial teaches you the basics of Optimism development.
Optimism is [EVM equivalent](https://medium.com/ethereum-optimism/introducing-evm-equivalence-5c2021deb306), meaning we run a slightly modified version of the same `geth` you run on mainnet.
Therefore, we the differences between Optimism development and Ethereum development are minor.
But a few differences [do exist](https://community.optimism.io/docs/developers/build/differences/#).

## Optimism endpoint URL

To access any Ethereum type network you need an endpoint. There are several ways to get one:

1. [Run a local development node](https://community.optimism.io/docs/developers/build/dev-node/).

1. For production use there is [a number of service providers that provide Optimism endpoints](https://community.optimism.io/docs/useful-tools/providers/), usually with a free tier for low usage.

1. For *limited* development use, [Optimism-provided endpoints](https://community.optimism.io/docs/useful-tools/networks/). 
   Note that these endpoints are rate limited, so they are not for use in QA or production environments.





### Network choice

For development purposes we recommend you use either a local development node or [Optimism Goerli](https://blockscout.com/optimism/goerli).
That way you don't need to spend real money.
If you need Goerli ETH for testing purposes, [you can use this faucet](https://faucet.paradigm.xyz/).

The tests examples below all use Optimism Goerli.


## Interacting with Optimism contracts

We have [Hardhat's Greeter contract](https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol) on Optimism Goerli, at address [0x106941459A8768f5A92b770e280555FAF817576f](https://blockscout.com/optimism/goerli/address/0x106941459A8768f5A92b770e280555FAF817576f). 
You can verify your development stack configuration by interacting with it.


## Hardhat

### Connecting to Optimism

In [Hardhat](https://hardhat.org/) you edit the `hardhat.config.js` file:

1. Define your network configuration in `.env`:

   ```sh
   # Put the mnemonic for an account on Optimism here
   MNEMONIC="test test test test test test test test test test test junk"

   # URL to access Optimism Goerli
   OPTI_GOERLI_URL=https://goerli.optimism.io
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


   1. Add a network definition in `module.exports.networks`:

   ```js
       "optimism-goerli": {
          url: process.env.OPTI_GOERLI_URL,
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



## Dapp tools

### Connecting to Optimism

In [dapp tools](https://github.com/dapphub/dapptools) use this command:

- For a local development node:

  ```sh
  export ETH_RPC_URL=https://localhost:8545
  ```

- For the Optimism Goerli test network, and the Optimism production network, use either [a third party node](https://community.optimism.io/docs/useful-tools/providers/) or the [Optimism endpoint](https://community.optimism.io/docs/useful-tools/networks/).


### Greeter interaction

Dapptools does not give us a JavaScript console. 
To interact with the blockchain you use the command line.

1. Set the RPC URL and the contract address

   ```sh
   cd dapptools
   export ETH_RPC_URL=https://kovan.optimism.io
   export GREETER=0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c   
   ```

1. Call `greet()`. Notice that the response is provided in hex.

   ```sh
   seth call $GREETER "greet()"
   ```

1. Call `greet()` again, and this time translate to ASCII

   ```sh
   seth call $GREETER "greet()" | seth --to-ascii
   ```

1. Run this command to get our wallet's address.
   This is the same address we used earlier for Hardhat and Truffle.
   In that case, either edit the configuration file to use your own mnemonic or "feed it" using [Paradigm's faucet](https://faucet.paradigm.xyz/)

   ```sh
   export ETH_FROM=`seth --keystore=$PWD/keystore ls | awk '{print $1}'`
   ```


1. Send a transaction. 
   When asked for the pass phrase just click Enter.

   ```sh
   seth --keystore=$PWD/keystore send $GREETER "setGreeting(string)" '"hello"'
   ```

1. Test that the greeting has changed:

   ```sh
   seth call $GREETER "greet()" | seth --to-ascii
   ```

## Waffle

Starting from [Waffle](https://github.com/TrueFiEng/Waffle) v4.x.x you can use Waffle chai matchers to test your smart contracts directly on an Optimism node.

### Prerequisites

The tutorial makes these assumptions:

1. You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
1. You have `make` installed on your computer (you can verify this by running `which make` in the terminal).
1. You have a Kovan Optimism address with enough funds on it. You can use this [faucet](https://kovan.optifaucet.com/) to get some free funds.
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
