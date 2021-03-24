# Tutorial

Hello!
This tutorial is an introduction to the process of developing applications on Optimistic Ethereum.
Specifically, we'll take you through the process of building, testing, deploying, and interacting with a Solidity smart contract on top of the platform.

> NOTE: We're quickly working to update `@eth-optimism/plugins` to fix several issues to make the development and testing process is easier for everyone! This section will be updated within the next couple of days that will change some of the later steps below that rely on this package.

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

We'll be writing all of our smart contracts in Solidity and writing the rest of our code in TypeScript.

## The Task
We're going to be deploying an ERC20 contract (written in Solidity) to Optimistic Ethereum.
We've already gone ahead and written that contract for you, which you should be able to locate in [`optimism-tutorial/contracts/ERC20.sol`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/contracts/ERC20.sol).
This contract is just a relatively standard (though completely unsafe) ERC20 implementation.

(**Note**: Seriously! This implementation is unsafe! Don't use it in production!)

We'd recommend running the following command to compile this ERC20 contract.
This will also make sure that Hardhat is installed correctly:

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
Contracts deployed to Optimistic Ethereum are required to [replace certain EVM opcodes with custom behavior](https://community.optimism.io/docs/protocol/evm-comparison.html#missing-replaced-and-custom-opcodes).
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
Alongside the normal compiler output located at `artifacts/contracts/ERC20.sol/ERC20.json`, you should also see `artifacts/contracts/ERC20.sol/ERC20-ovm.json` (or `artifacts/contracts/ERC20.sol/ERC20.ovm.json` if you're using an older version of `@eth-optimism/plugins`).
Here, `-ovm.json` signifies that this file has been compiled for the OVM, the **O**ptimistic **V**irtual **M**achine, as opposed to the Ethereum Virtual Machine.

<!-- ### Running Optimistic Ethereum locally

_**COMING IN THE NEXT FEW DAYS!**_ -->