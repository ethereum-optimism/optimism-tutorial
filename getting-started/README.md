# Getting started developing for Optimism

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial teaches you the basics of Optimism development.
Optimism is [EVM equivalent](https://medium.com/ethereum-optimism/introducing-evm-equivalence-5c2021deb306), meaning we run a slightly modified version of the same `geth` you run on mainnet.
Therefore, we the differences between Optimism development and Ethereum development are minor.
But a few differences [do exist](https://community.optimism.io/docs/developers/build/differences/#).

#### See video

If you prefer watching tutorials rather than reading them, we have this great video covering the getting started content:

[![getting started video](https://img.youtube.com/vi/_Y6CwsYgqwI/default.jpg)](https://youtu.be/_Y6CwsYgqwI)

## Optimism endpoint URL

To access any Ethereum type network you need an endpoint. 
We recommend you get one from [Alchemy, our preferred provider](https://www.alchemy.com/).
[See here](../ecosystem/alchemy/) for step by step directions on using Alchemy.

Alternatively, we have [other great providers](https://community.optimism.io/docs/useful-tools/providers/) that support our networks.



### Network choice

For development purposes we recommend you use either a local development node or [Optimism Goerli](https://blockscout.com/optimism/goerli).
That way you don't need to spend real money.
If you need ETH on Optimism Goerli for testing purposes, [you can use this faucet](https://optimismfaucet.xyz/).

The tests examples below all use either Optimism Goerli or the Optimism Bedrock beta testnet.


## Interacting with Optimism contracts

We have [Hardhat's Greeter contract](https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol) on Optimism Goerli, at address [0x106941459A8768f5A92b770e280555FAF817576f](https://blockscout.com/optimism/goerli/address/0x106941459A8768f5A92b770e280555FAF817576f). 
You can verify your development stack configuration by interacting with it. 

As you can see in the different development stacks below, the way you deploy contracts and interact with them on Optimism is almost identical to the way you do it with L1 Ethereum.
The most visible difference is that you have to specify a different endpoint (of course). 
The list of other differences is [here](https://community.optimism.io/docs/developers/build/differences/).

**Bedrock:** Our next release, [Optimism Bedrock](https://community.optimism.io/docs/developers/bedrock/), is in beta. 
As it is a different testnet for now, that testnet has Greeter at address .

To get ETH on an address in the Bedrock beta network:

1. [Look at the Bedrock beta contract addresses](https://oplabs.notion.site/Contract-Addresses-8669ef7d6f124accb0220a5e0f24be0d).

1. Find the `OptimismPortalProxy` address.
   Currently that is [`0xf91795564662dcc9a17de67463ec5ba9c6dc207b`](https://goerli.etherscan.io/address/0xf91795564662dcc9a17de67463ec5ba9c6dc207b), but as we're still in development it might change.

1. Send that address ETH on Goerli and in a few minutes' time you'll get that ETH on the Optimism Bedrock beta network.

1. We don't have an explorer for the bedrock beta network yet, but you can [add it to a wallet](https://oplabs.notion.site/Usage-Guide-3667cfd2b180475894201f4a69089419) and see your balance that way.
   Alternatively, you can use your preferred development framework to check the balance (see below).


## Hardhat

In [Hardhat](https://hardhat.org/) you use a configuration similar to [this one](https://github.com/ethereum-optimism/optimism-tutorial/tree/main/getting-started/hardhat).

### Connecting to Optimism

Follow these steps to add Optimism Goerli support to an existing Hardhat project. 


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

   **Bedrock:** To use the Bedrock alpha network, add this network definition in `module.exports.networks`: 

   ```js
      "optimism-bedrock": {
         url: 'https://bedrock-beta-1-replica-0.optimism.io/',
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

   **Bedrock:**

   Replace the final command with

   ```sh
   yarn hardhat console --network optimism-bedrock
   ```

1. Connect to the Greeter contract:   

   ```js
   Greeter = await ethers.getContractFactory("Greeter")
   greeter = await Greeter.attach("0x106941459A8768f5A92b770e280555FAF817576f")
   ```   

   **Bedrock:** If using Bedrock, remember to use the correct address:

   ```js
   Greeter = await ethers.getContractFactory("Greeter")
   greeter = await Greeter.attach("0xC0836cCc8FBa87637e782Dde6e6572aD624fb984")   
   ```

1. Read information from the contract:

   ```js
   await greeter.greet()
   ```

1. Submit a transaction, wait for it to be processed, and see that it affected the state.

   ```js
   tx = await greeter.setGreeting(`Hardhat: Hello ${new Date()}`)
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

In [Truffle](https://trufflesuite.com/) you use a configuration similar to [this one](https://github.com/ethereum-optimism/optimism-tutorial/tree/main/getting-started/truffle).

### Connecting to Optimism

Follow these steps to add Optimism Goerli support to an existing Truffle project. 


1. Define your network configuration in `.env`:

   ```sh
   # Put the mnemonic for an account on Optimism here
   MNEMONIC=test test test test test test test test test test test junk

   # API KEY for Alchemy
   ALCHEMY_API_KEY=

   # URL to access Optimism Goerli (if not using Alchemy)
   OPTIMISM_GOERLI_URL=
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

   1. Get the correct URL:

      ```js
      const optimismGoerliUrl =
         process.env.ALCHEMY_API_KEY ?
            `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` :
            process.env.OPTIMISM_GOERLI_URL
      ```

   1. Add a network definition in `module.exports.networks`:

      ```js
      "optimism-goerli": {
         provider: () => new HDWalletProvider(
            process.env.MNEMONIC,
            optimismGoerliUrl),
         network_id: 420
      }
      ```

      **Bedrock:** Also add this network definition:

      ```js
         "optimism-bedrock": {
            provider: () => new HDWalletProvider(
               process.env.MNEMONIC,
               'https://bedrock-beta-1-replica-0.optimism.io/'),
            network_id: 902,
            gas: 2000000           
         },
      ```

      The `gas` setting is the block gas limit.
      We need this because by default Truffle sends transactions with a huge gas limit, which exceeds the amount a bedrock block can accept.


### Greeter interaction

1. Compile the contract and run the console:

   ```sh
   truffle compile
   truffle console --network optimism-goerli
   ```

   **Bedrock:** Replace the last command with:

   ```sh
   truffle console --network optimism-bedrock
   ```

1. Connect to the Greeter contact:

   ```js
   greeter = await Greeter.at("0x106941459A8768f5A92b770e280555FAF817576f")
   ```

   **Bedrock:** Use this command:

   ```js
   greeter = await Greeter.at("0xC0836cCc8FBa87637e782Dde6e6572aD624fb984")
   ```

1. Read information from the contact:

   ```js
   await greeter.greet()
   ```

1. Submit a transaction, wait for it to be processed, and see that it affected the state.

   ```js
   tx = await greeter.setGreeting(`Truffle: Hello ${new Date()}`)
   await greeter.greet()
   ```




### Contract deployment

You deploy a new contract from the console:

``` 
greeter = await Greeter.new("Greeter from Truffle")
console.log(`Contract address: ${greeter.address}`)
await greeter.greet()
```





## Remix

### Connecting to Optimism

In [Remix](https://remix.ethereum.org) you access Optimism through your own wallet.

1. Add Optimism Goerli to your wallet. 
   The easiest way to do this is to use [chainid.link](https://chainid.link/?network=optimism-goerli).

   **Bedrock:**
   If you use Metamask, [follow the directions here (starting at step 4)](https://help.optimism.io/hc/en-us/articles/6665988048795), with these parameters:

   | Parameter | Value |
   | --------- | ----- |
   | Network Name | Optimism Goerli |
   | New RPC URL  | https://bedrock-beta-1-replica-0.optimism.io/ |
   | Chain ID     | 902 |
   | Currency Symbol | ETH |
   | Block Explorer URL | https://blockscout.com/optimism/bedrock-alpha |


1. Log on with your wallet to Optimism Goerli.

1. Browse to [Remix](https://remix.ethereum.org/).
1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).
1. Select the Environment **Injected Web3 Provider**.
1. Accept the connection in the wallet.

### Greeter interaction

1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).

1. Make sure your environment is **Injected Web3** and the network ID is **420**.

   <img src="assets/remix-env.png" width="300" />

   **Bedrock:** If using bedrock, the network ID is **902**.

1. Click the files icon (<img src="assets/remix-files-icon.png" height="24" valign="top" />).

1. Download [Greeter.sol](hardhat/contracts/Greeter.sol) and upload (<img src="assets/remix-upload-icon.png" height="24" valign="top" />) it to Remix under **contracts**.

1. Right-click **contracts > Greeter.sol** and select **Compile**.

1. Open **contracts > artifacts** and see that there's a `Greeter.json` file. This file is the compiled version, the API for the contract, etc.

1. Click the run icon (<img src="assets/remix-run-icon.png" height="24" valign="top" />).

1. Scroll down. 
   In the At Address field, type the contract address `0x106941459A8768f5A92b770e280555FAF817576f`.
   Then, click **At Address**. 
   Expand the contract to see you can interact with it.

   <img src="assets/remix-connect.png" width="300" />

   **Bedrock:** Use the address `0xC0836cCc8FBa87637e782Dde6e6572aD624fb984`.

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

   **Bedrock:**

   ```sh
   export ETH_RPC_URL=https://bedrock-beta-1-replica-0.optimism.io/
   export GREETER=0xC0836cCc8FBa87637e782Dde6e6572aD624fb984
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

<!--
   **Bedrock:**
   No need for `--legacy`:

   ```sh
   cast send --mnemonic-path mnem.delme $GREETER "setGreeting(string)" '"hello"'   
   ```
-->

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

After you are done with that development, debug your decentralized application using either a [development node](https://community.optimism.io/docs/developers/build/dev-node/) or the [Goerli test network](https://community.optimism.io/docs/useful-tools/networks/). 
This lets you debug parts that that are Optimism specific such as calls to bridges to transfer assets between layers.

Only when you have a version that works well on a test network should you deploy to the production network, where every transaction has a cost.

### Contract source verification

You don't have to upload your source code to [block explorers](https://community.optimism.io/docs/useful-tools/explorers/), but it is a good idea. 
On the test network it lets you issue queries and transactions from the explorer's user interface.
On the production network it lets users know exactly what your contract does, which is conducive to trust.

Just remember, if you use [the Etherscan API](https://optimistic.etherscan.io/apis), you need one API key for Optimism and a separate one for Optimism Goerli.