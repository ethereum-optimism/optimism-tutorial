# The Unofficial™ Optimism Tutorial

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial aims to help you get started with developing decentralized applications on [Optimism](https://optimism.io/). Applications running on
top of Optimism are about as secure as those running on the underlying Ethereum mainnet itself, but are
[significantly cheaper](https://optimism.io/gas-comparison).


## Building an Optimism Server

To test and debug on Optimism you need to have a running Optimism server, so the first step is to build one. The directions in this section are for a Debian 10
VM running on GCP with a 50 GB disk (10 GB is not enough), but they should be similar for other Linux versions running on other platforms.

### Prerequisite Software

1. Install packages.
```
sudo apt install -y wget git docker docker.io build-essential docker-compose
```

2. Install Node.js. The version in the Docker repository is out of date, so we'll use one from a different source.
```
curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install -y nodejs
```

3. Install npm packages
```
sudo npm install -g yarn
sudo npm install -g hardhat
```

4. Add yourself to the docker group.
```
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

```
docker-compose up
```

When start seeing log entries scrolling on the console it means the system is now running. 


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

```sh
git clone git@github.com:ethereum-optimism/optimism.git
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
