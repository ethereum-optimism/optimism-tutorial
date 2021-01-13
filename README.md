# Tutorial

Hello!
This tutorial is an introduction to the process of developing applications on Optimistic Ethereum.
Specifically, we'll take you through the process of building, testing, deploying, and interacting with a Solidity smart contract on top of the platform. 

Planned future iterations of this tutorial will include:
- Communicating between Optimistic Ethereum and Ethereum.
- Using more advanced Optimism tooling.

## Prerequisite Software
We make use of some external software throughout this tutorial.
Please make sure you've installed the following before continuing:

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js](https://nodejs.org/en/download/)

## Setting Up
We've structured this tutorial as a follow-along exercise where we'll be writing code in tandem.
Please clone and enter [this repository](https://github.com/ethereum-optimism/optimism-tutorial):

```sh
git clone https://github.com/ethereum-optimism/optimism-tutorial
cd optimism-tutorial
```

We're using an Ethereum development framework called [Hardhat](https://hardhat.org) to make our lives a lot easier.
If you haven't used Hardhat before, we hope you'll be pleasantly surprised!
Hardhat is well designed and full of useful features.
Go ahead and set up Hardhat by running:

```sh
yarn install
```

We'll writing all of our smart contracts in Solidity and writing the rest of our code in TypeScript.

## The Task
We're going to be deploying an ERC20 contract (written in Solidity) to Optimistic Ethereum.
We've already gone ahead and written that contract for you, which you should be able to locate in [`optimism-tutorial/contracts/ERC20.sol`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/contracts/ERC20.sol).
This contract is just a relatively standard (though completely unsafe) ERC20 implementation.

(**Note**: Seriously! This implementation is unsafe! Don't use it in production!)

We'd recommend running the following command to compile this ERC20 contract. This will also make sure that Hardhat is installed correctly:

```sh
yarn compile
```

## The Tests
We've also written some very basic tests for you, which you can locate in [`optimism-tutorial/test/erc20.spec.ts`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/test/erc20.spec.ts).
Though tests are pretty straight forward, we'd recommend taking a quick read through the test file.
We're using [Ethers](https://docs.ethers.io/v5/) for the majority of our testing and [Waffle](https://ethereum-waffle.readthedocs.io/en/latest/) for some of its utilities.
Hardhat provides convenient plugins for both; we've already added these plugins to [`optimism-tutorial/hardhat.config.ts`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/hardhat.config.ts).

Once you've taken a look at the tests, feel free to verify that everything is working correctly by running the following command:

```sh
yarn test
```

If everything is going as planned, you should see a bunch of green checkmarks.

## Making it Optimistic
Now that we've gotten that out of the way, it's time to get our ERC20 ready for Optimistic Ethereum.
Contracts deployed to Optimistic Ethereum are required to replace certain EVM opcodes with custom behavior.
Since the Solidity compiler doesn't handle this custom behavior, developers have to make sure to use the Optimism fork of the Solidity compiler instead.
We'll need to add a special plugin to hardhat that enables this custom Optimism Solidity compiler. 

First, add the Optimism plugins package to your project:

```sh
yarn add @eth-optimism/plugins
```

Next, add the following line to [`optimism-tutorial/hardhat.config.ts`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/hardhat.config.ts):

```ts
// hardhat.config.ts

import '@eth-optimism/plugins/hardhat/compiler'
```

Finally, compile it!

```sh
yarn compile
```

Congrats, you're ready to deploy an application to Optimistic Ethereum!
It really is that easy.

You can verify that everything went well by checking the `artifacts` folder that should be generated whenever you run `yarn compile`. 
Alongside the normal compiler output located at `artifacts/contracts/ERC20.sol/ERC20.json`, you should also see `artifacts/contracts/ERC20.sol/ERC20.ovm.json`.
Here, `.ovm.json` signifies that this file has been compiled for the OVM, the **O**ptimistic **V**irtual **M**achine, as opposed to the Ethereum Virtual Machine.

### Testing (Again)
We provided you with an ERC20 test file earlier in this tutorial.
Now it's time to test this ERC20 again.
This time, however, we'll be testing our new OVM-compatible smart contract on top of Optimistic Ethereum.
Luckily, this is almost as easy as compiling the contract!

First, make a copy of [`optimism-tutorial/test/erc20.spec.ts`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/test/erc20.spec.ts).
You can name the copy whatever you'd like, perhaps `optimistic-erc20.spec.ts`.
We'll modify this copy in just a minute.

Now we're going to add another Hardhat plugin to [`optimism-tutorial/hardhat.config.ts`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/hardhat.config.ts):

```ts
// hardhat.config.ts

import '@eth-optimism/plugins/hardhat/compiler' // You already had this one.
import '@eth-optimism/plugins/hardhat/ethers'   // Now just add this one!
```

This plugin adds a new modified version of `ethers` to Hardhat that makes it possible to test the Layer 2 version of your contracts.

Finally, we're going to modify `optimistic-erc20.spec.ts` (or whatever you named your copy of the original test file).
Don't worry though, we only have to change a single line of code to make everything work!
Find the line of code that looks like this:

```ts
// optimistic-erc20.spec.ts

import { ethers } from 'hardhat'
```

Now, replace that line of code with this:

```ts
// optimistic-erc20.spec.ts

import { l2ethers as ethers } from 'hardhat'
```

You might also want to change the test description so that you can tell the difference between the normal ERC20 and this new test file:

```ts
// optimistic-erc20.spec.ts

describe('Optimistic ERC20', () => {
    ...
```

You're all set!
Confirm that everything worked as expected by running:

```sh
yarn test
```

You should see even more green checkmarks this time around.
