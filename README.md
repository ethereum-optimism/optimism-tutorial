# The Official™ Optimistic Ethereum Tutorial

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

> **Disclaimer:** 
>
> For the most part, our development happens in our [`optimism`](https://github.com/ethereum-optimism/optimism) monorepo. Thus, while we periodically check and update this `optimism-tutorial` repository, we recommend to reference our code [`examples`](https://github.com/ethereum-optimism/optimism/tree/develop/examples) for up-to-date code examples on integrating with Optimistic Ethereum.

This tutorial is an introduction to the process of developing applications on [Optimistic Ethereum](community.optimism.io).
We'll take you through the process of compiling, testing, and deploying a smart contract.

This tutorial aims to highlight the similarities and differences between Ethereum and Optimistic Ethereum.
To that end, we've set the tutorial up so that you'll perform the same compile/test/deploy process on both systems at the same time.
This process is *not* necessary for you to build an application on Optimistic Ethereum -- it's purely to give a side-by-side comparison.

Lastly, this tutorial does not cover topics such as message passing between Ethereum (layer 1) and Optimistic Ethereum (layer 2).
So, if you'd like to see an implementation on message passing, check out our [`l1-l2-deposit-withdrawal`](https://github.com/ethereum-optimism/l1-l2-deposit-withdrawal) example repository.

With that said, let's dive in!

## Prerequisite Software

Please make sure you've installed the following before continuing:

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable)
- [Docker](https://docs.docker.com/engine/install/)
- [Docker-compose](https://docs.docker.com/compose/install/)

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
Go ahead and set up Hardhat by running (along with our other dependencies):

```sh
yarn install
```

## The Task

First, we're going to be deploying an ERC20 contract (written in Solidity) to Ethereum.
After deploying to Ethereum, we'll deploy the same contract to Optimistic Ethereum.
We've already gone ahead and written that contract for you, which you should be able to locate in [`optimism-tutorial/contracts/ERC20.sol`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/contracts/ERC20.sol).
This contract is just a relatively standard (though completely unsafe) ERC20 implementation.

(**Note**: Seriously! This implementation is unsafe! Don't use it in production!)

## Step 1: Compiling your contracts

### Compiling an Ethereum contract

Just like with any other project, we'll first need to compile our Solidity into EVM bytecode.
Let's compile our ERC20 contract by running the following command:

```sh
npx hardhat compile
```

You should now see a new folder, `artifacts`, which has some JSON files in it.
If you can see this folder you're ready to move onto the next section!

### Compiling an Optimistic Ethereum contract

Compiling a contract for Optimistic Ethereum is pretty easy!
First we'll need to install the `@eth-optimism/hardhat-ovm` package (`ovm` stands for the **O**ptimistic **V**irtual **M**achine, as opposed to the Ethereum Virtual Machine):

```sh
yarn add @eth-optimism/hardhat-ovm
```

Next we just need to add this line to `hardhat.config.js`:

```js
// hardhat.config.js

require('@eth-optimism/hardhat-ovm')

module.exports = {
  ...
```

We'll also have to add `optimism` to your list of networks within `hardhat.config.js`:

```js
// hardhat.config.js

require('@eth-optimism/hardhat-ovm')

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
  },

  ...
}
```

And we're ready to compile!
You'll just need to add the `--network optimism` option to `hardhat compile`:

```sh
npx hardhat --network optimism compile
```

Yep, it's that easy.
You can verify that everything went well by looking for the `artifacts-ovm` and `cache-ovm` directories.
Here, `artifacts-ovm` signifies that the contracts contained in this directory have been compiled for the OVM.
Now let's move on to testing!

## Step 2: Testing your contracts

### Testing an Ethereum contract

Alright, this step is pretty straightforward.
You'll probably want to test your contracts before you deploy them (lol).
Let's see how you'd do that with Hardhat for a standard Ethereum contract.

Testing with Hardhat is easy.
We've included a simple set of ERC20 tests inside [`optimism-tutorial/test/erc20.test.js`](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/test/erc20.test.js).
Let's run these tests with hardhat:

```sh
npx hardhat test
```

If everything is going as planned, you should see a bunch of green checkmarks.

### Testing an Optimistic Ethereum contract

Woot! It's finally time to test our contract on top of Optimistic Ethereum.
But first we'll need to get a local version of Optimistic Ethereum node running...

---

Fortunately, we have some handy dandy tools that make it easy to spin up a local Optimistic Ethereum node!

Since we're going to be using Docker, make sure that Docker is installed on your machine prior to moving on (info on how to do that [here](https://docs.docker.com/engine/install/)).
**We recommend opening up a second terminal for this part.**
This way you'll be able to keep the Optimistic Ethereum node running so you can execute some contract tests.

Now we just need to download, build, and install our Optimistic Ethereum node by running the following commands.
Please note that `docker-compose build` *will* take a while.
We're working on improving this (sorry)!

```sh
git clone https://github.com/ethereum-optimism/optimism.git
cd optimism
yarn install
yarn build
cd ops
docker-compose build
docker-compose up
```

You now have your very own locally deployed instance of Optimistic Ethereum! 🙌

---

With your local instance of Optimistic Ethereum up and running, let's go test your contracts!

```sh
npx hardhat --network optimism test
```

Again we're using the `--network optimism` option to let hardhat know that we want to use the Optimistic Ethereum solidity compiler.
This also ensures that transactions are sent to our L2 node (instead of hardhat's local L1 node).

Go ahead and run that command.
You should see another set of passing tests.
If so, congrats!
You're ready to deploy an application to Optimistic Ethereum.
It really is that easy.

## Step 3: Deploying your contracts

### Deploying an Ethereum contract

Going through this routine one more time.
Now we're going to deploy an Ethereum contract using hardhat.
We've installed and set up a tool called `hardhat-deploy` to manage this mini deployment.
You'll need to run:

```sh
npx hardhat deploy
```

This should do a deployment against a local (in-memory) Ethereum node.
Cool.

### Deploying an Optimistic Ethereum contract

Next we'll do the same thing on Optimistic Ethereum.
Let's go ahead and deploy this contract:

```sh
npx hardhat --network optimism deploy
```

And once again we're using the `--network optimism` option.
After a few seconds your contract should be deployed!

And uh... yeah.
That's pretty much it.
Contracts deployed!
Tutorial complete.
Hopefully now you know the basics of working with Optimistic Ethereum.

The primary goal of this tutorial was to try to highlight the similarities between the process of working with Ethereum and of working with Optimistic Ethereum.
Did we do a decent job?
Could this tutorial be improved?
Please let us know by creating an issue on GitHub or by leaving a message over on [discord](https://discord.com/invite/jrnFEvq).

Want to try deploying contracts to the Optimistic Ethereum testnet next?
[Check out the full integration guide](https://community.optimism.io/docs/developers/integration.html) on the Optimism community hub.


## Until next time...

![optimism-tutorial-completion](https://user-images.githubusercontent.com/37757724/113066106-96189680-917f-11eb-9580-69eb71c31b83.gif)
