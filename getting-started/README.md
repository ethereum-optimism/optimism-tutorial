# Getting started developing for Optimism

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This tutorial teaches you the basics of Optimism development.
Optimism is [EVM equivalent](https://medium.com/ethereum-optimism/introducing-evm-equivalence-5c2021deb306), meaning we run a slightly modified version of the same `geth` you run on mainnet.
Therefore, we the differences between Optimism development and Ethereum development are minor.
But a few differences [do exist](https://community.optimism.io/docs/developers/build/differences/#).

## Optimism endpoint URL

To access any Ethereum type network you need an endpoint. There are several ways to get one:

1. [Run a local development node](https://community.optimism.io/docs/developers/build/dev-node/).

1. For *limited* development use, [Optimism-provided endpoints](https://community.optimism.io/docs/useful-tools/networks/). 
   Note that these endpoints are rate limited, so they are not for use in QA or production environments.

1. For production use there is a number of service providers that provide Optimism endpoints, usually with a free tier for low usage.

   * [Alchemy](https://www.alchemy.com/layer2/optimism)
   * [Infura](https://infura.io/docs/ethereum#section/Choose-a-Network)
   * [QuickNode](https://www.quicknode.com/chains/optimism)



### Network choice

For development purposes we recommend you use either a local development node or [Optimistic Kovan](https://kovan-optimistic.etherscan.io/).
That way you don't need to spend real money.
If you need Kovan ETH for testing purposes, [you can use this faucet](https://faucet.paradigm.xyz/).

The tests examples below all use Optimistic Kovan.


## Interacting with Optimism contracts

We have [Hardhat's Greeter contract](https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol) on Optimistic Kovan, at address [0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c](https://kovan-optimistic.etherscan.io/address/0xe0a5fe4fd70b6ea4217122e85d213d70766d6c2c). 
You can verify your development stack configuration by interacting with it.


## Hardhat

### Connecting to Optimism

In [Hardhat](https://hardhat.org/) you edit the `hardhat.config.js` file's `modules.export.networks` to add a definition similar to this one:

```js
    "optimistic-kovan": {
       url: '<Optimism URL>',
       accounts: { mnemonic: <your account mnemonic goes here> }

    }
```

### Greeter interaction

1. Run the console:
   ```sh
   cd hardhat
   yarn
   yarn hardhat console --network optimistic-kovan
   ```

1. Connect to the Greeter contract:   

   ```js
   Greeter = await ethers.getContractFactory("Greeter")
   greeter = await Greeter.attach("0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c")
   ```   

1. Read information from the contact:

   ```js
   await greeter.greet()
   ```

1. Submit a transaction, wait for it to be processed, and see that it affected the state.
   Note that the account used by default, [0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266](https://kovan-optimistic.etherscan.io/address/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266), may not have enough ETH. 
   In that case, either edit the configuration file to use your own mnemonic or "feed it" using [Paradigm's faucet](https://faucet.paradigm.xyz/)

   ```js
   tx = await greeter.setGreeting(`Hello ${new Date()}`)
   receipt = await tx.wait()   // Doesn't work in Truffle
   await greeter.greet()
   ```


## Truffle

### Connecting to Optimism


In [Truffle](https://trufflesuite.com/):

1. Add the `@truffle/hdwallet-provider` package:

   ```sh
   yarn add @truffle/hdwallet-provider
   ```

1. Edit the `truffle-config.js` file

   1. Uncomment this line:

      ```js
      const HDWalletProvider = require('@truffle/hdwallet-provider')
      ```

   1. Edit `modules.export.networks` to add a definition similar to this one:

      ```js 
      "optimistic-kovan": {
         provider: () => new HDWalletProvider(<your mnemonic>, <Optimism URL>)
      }
      ```


### Greeter interaction

1. Install the software, compile the contract, and run the console:

   ```sh
   cd truffle
   yarn
   truffle compile
   truffle console --network optimistic-kovan
   ```

1. Connect to the Greeter contact:

   ```js
   greeter = await Greeter.at("0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c")
   ```

1. Read information from the contact:

   ```js
   await greeter.greet()
   ```

1. Submit a transaction, wait for it to be processed, and see that it affected the state.
   Note that the account used by default, [0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266](https://kovan-optimistic.etherscan.io/address/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266), may not have enough ETH. 
   In that case, either edit the configuration file to use your own mnemonic or "feed it" using [Paradigm's faucet](https://faucet.paradigm.xyz/)

   ```js
   tx = await greeter.setGreeting(`Hello ${new Date()}`)
   await greeter.greet()
   ```



## Remix

### Connecting to Optimism

In [Remix](https://remix.ethereum.org) you access Optimism through your own wallet.

1. Log on with your wallet to Optimistic Kovan (or, eventually, Optimistic Ethereum). 
   If you use the Optimism endpoints, you can do this using [chainid.link](https://chainid.link):
   - [Optimistic Kovan](https://chainid.link?network=optimism-kovan)
   - [Optimistic Ethereum](https://chainid.link?network=optimism)

1. Browse to [Remix](https://remix.ethereum.org/).
1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).
1. Select the Environment **Injected Web3 Provider**.
1. Accept the connection in the wallet.

### Greeter interaction

1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).

1. Make sure your environment is **Injected Web3** and the network ID is **69**.

   <img src="assets/remix-env.png" width="300" />

1. Click the files icon (<img src="assets/remix-files-icon.png" height="24" valign="top" />).

1. Download [Greeter.sol](hardhat/contracts/Greeter.sol) and upload (<img src="assets/remix-upload-icon.png" height="24" valign="top" />) it to Remix under **contracts**.

1. Right-click **contracts > Greeter.sol** and select **Compile**.

1. Open **contracts > artifacts** and see that there's a `Greeter.json` file. This file is the compiled version, the API for the contract, etc.

1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).

   If you do not have Kovan ETH, get some using [Paradigm's faucet](https://faucet.paradigm.xyz/)

1. Scroll down. 
   In the At Address field, type the contract address (`0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c`).
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

- For the Optimistic Kovan test network:

  ```sh
  export ETH_RPC_URL=https://kovan.optimism.io:8545
  ```

- For the Optimism production network:

  ```sh
  export ETH_RPC_URL=https://mainnet.optimism.io:8545
  ```

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
