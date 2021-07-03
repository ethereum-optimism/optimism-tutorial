# Optimism Box

- [Requirements](#requirements)
- [Installation](#installation)
- [Setup](#setup)
  * [Using the .env File](#using-the-env-file)
  * [New Configuration File](#new-configuration-file)
  * [New Directory Structure for Artifacts](#new-directory-structure-for-artifacts)
- [Optimistic Ethereum](#optimistic-ethereum)
  * [Compiling](#compiling)
  * [Migrating](#migrating)
  * [Basic Commands](#basic-commands)
  * [Testing](#testing)
  * [Communication Between Ethereum and Optimism Chains](#communication-between-ethereum-and-optimism-chains)
- [Support](#support)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>


This Truffle Optimism Box provides you with the boilerplate structure necessary to start coding for Optimism's Ethereum Layer 2 solution. For detailed information on how Optimism works, please see the documentation [here](http://community.optimism.io/docs/developers/integration.html#).

As a starting point, this box contains only the SimpleStorage Solidity contract. Including minimal code was a conscious decision as this box is meant to provide the initial building blocks needed to get to work on Optimism without pushing developers to write any particular sort of application. With this box, you will be able to compile, migrate, and test Optimistic Solidity code against a variety of Optimism test networks.

Optimism's Layer 2 solution is almost fully compatible with the EVM, though it uses an "optimistic" EVM called the OVM. The main difference between the EVM and the OVM that developers will notice is that some opcodes are not available for contracts that are deployed to the OVM. You can see the complete list of differences between Optimism's fork of the `solc` compiler and the original [here](https://github.com/ethereum-optimism/solidity/compare/27d51765c0623c9f6aef7c00214e9fe705c331b1...develop-0.6).

## Requirements

The Optimism Box has the following requirements:

- [Node.js](https://nodejs.org/) 10.x or later
- [NPM](https://docs.npmjs.com/cli/) version 5.2 or later
- [docker](https://docs.docker.com/get-docker/), version 19.03.12 or later
- [docker-compose](https://docs.docker.com/compose/install/), version 1.27.3 or later
- Recommended Docker memory allocation of >=8 GB.
- Windows, Linux or MacOS


Helpful, but optional:
- An [Infura](https://infura.io/) account and Project ID
- A [MetaMask](https://metamask.io/) account


## Installation

> Note that this installation command will only work once the box is published (in the interim you can use `truffle unbox https://github.com/truffle-box/optimism-box`).

```bash
$ truffle unbox optimism
```

## Setup

### Using the env File

You will need at least one mnemonic to use with the network. The `.dotenv` npm package has been installed for you, and you will need to create a `.env` file for storing your mnemonic and any other needed private information.

The `.env` file is ignored by git in this project, to help protect your private data. In general, it is good security practice to avoid committing information about your private keys to github. The `truffle-config.ovm.js` file expects a `GANACHE_MNEMONIC` and a `KOVAN_MNEMONIC` value to exist in `.env` for running commands on each of these networks, as well as a default `MNEMONIC` for the optimistic network we will run locally.

If you are unfamiliar with using `.env` for managing your mnemonics and other keys, the basic steps for doing so are below:

1) Use `touch .env` in the command line to create a `.env` file at the root of your project.
2) Open the `.env` file in your preferred IDE
3) Add the following, filling in your own Infura project key and mnemonics:

```
MNEMONIC="candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
INFURA_PROJECT_ID="<Your Infura Project ID>"
GANACHE_MNEMONIC="<Your Ganache Mnemonic>"
KOVAN_MNEMONIC="<Your Kovan Mnemonic>"
```

_Note: the value for the `MNEMONIC` above is the one you should use, as it is expected within the local optimistic ethereum network we will run in this Truffle Box._

4) As you develop your project, you can put any other sensitive information in this file. You can access it from other files with `require('dotenv').config()` and refer to the variable you need with `process.env['<YOUR_VARIABLE>']`.

### New Configuration File

A new configuration file exists in this project: `truffle-config.ovm.js`. This file contains a reference to the new file location of the `contracts_build_directory` and `contracts_directory` for Optimism contracts and lists several networks for running the Optimism Layer 2 network instance (see [below](#migrating)).

Please note, the classic `truffle-config.js` configuration file is included here as well, because you will eventually want to deploy contracts to Ethereum as well. All normal truffle commands (`truffle compile`, `truffle migrate`, etc.) will use this config file and save built files to `build/ethereum-contracts`. You can save Solidity contracts that you wish to deploy to Ethereum in the `contracts/ethereum` folder.

### New Directory Structure for Artifacts

When you compile or migrate, the resulting `json` files will be at `build/optimism-contracts/`. This is to distinguish them from any Ethereum contracts you build, which will live in `build/ethereum-contracts`. As we have included the appropriate `contracts_build_directory` in each configuration file, Truffle will know which set of built files to reference!

## Optimistic Ethereum

### Compiling

To compile your project using the Optimistic `solc` compiler, run the following in your terminal:

```
npm run compile:ovm
```

This script lets Truffle know to use the `truffle-config.ovm.js` configuration file, which references the Optimistic `solc` compiler. When adding new contracts to compile, you may find some discrepancies and errors, so please remember to keep an eye on [differences between solc and optimistic solc](https://github.com/ethereum-optimism/solidity/compare/27d51765c0623c9f6aef7c00214e9fe705c331b1...develop-0.6)!

Please note: the optimistic `solc` compiler we have included relies on the latest version of the package, and currently uses *version 0.7.6*. If you would like to use a different version of `solc`, see the available optimistic versions [here](https://www.npmjs.com/package/@eth-optimism/solc), and run:

```
 npm install @eth-optimism/solc@<YourVersion>
 ```

You can double check that you have the version you want by looking at the `package.json` dependencies in this project.

If you would like to recompile previously compiled contracts, you can manually run this command with `truffle compile --config truffle-config.ovm.js` and add the `--all` flag.

### Migrating

To migrate on an Optimistic Layer 2, run:

```
npm run migrate:ovm --network=(ganache | optimistic_ethereum | optimistic_kovan)
```

(remember to choose a network from these options!).

You have several Optimistic Layer 2 networks to choose from, prepackaged in this box (note: Layer 1 networks associated with Optimism are included in the regular `truffle-config.js` file, to aid you with further development. But here we'll just go through the Layer 2 deployment options available):

- `optimistic_ethereum`: This network is the default Layer 1/Layer 2 integration provided by Optimism for testing your Optimistic Ethereum code. Documentation about this setup can be found [here](https://github.com/ethereum-optimism/optimism).
  * You will need to install the code for this network in this box in order to use the scripts associated with it. To install it, run `npm run installLocalOptimism`. You should only need to run this initiation command once. It will create an `optimism` directory in this project that will house the repository you need. If at any point you want to update to the latest optimism docker image, you can delete your `optimism` directory and run this command again.
  * If you wish to use this network, be sure to run `npm run startLocalOptimism` so that the optimism test ecosystem docker image can be served. For our purposes, you should be able to compile, migrate, and test against this network once the docker image is fully running. See [documentation and updates](https://github.com/ethereum-optimism/optimism/tree/develop/ops) about this docker container for additional information.
  * Please note, after running `npm run startLocalOptimism` it can take several minutes for the test ecosystem to be up and running on your local machine. The first time you run this command, it will take a bit longer for everything to be set up. Future runs will be quicker!
  * To stop the local docker container, use `npm run stopLocalOptimism` in a new terminal tab to ensure graceful shutdown.
- `ganache`: This network uses an optimistic ganache instance for migrations. The usage is essentially identical to use of regular ganache.
- `optimistic_kovan`: Optimism has deployed a testnet to the Kovan network. The RPC endpoint is https://optimism-kovan.infura.io/v3/. In order to access this node for testing, you will need to connect a wallet (we suggest [MetaMask](https://metamask.io/)). Save your seed phrase in a `.env` file as `KOVAN_MNEMONIC`. Using an `.env` file for the mnemonic is safer practice because it is listed in `.gitignore` and thus will not be committed.
  * Currently, we have the gasPrice for transactions on Optimistic Kovan set to zero. You should be able to use this network as configured at this time.
  * Eventually, you will need Kovan ETH in an Optimistic Kovan wallet to deploy contracts using this network. In order to deploy to Optimistic Kovan, you will need to acquire Optimistic Kovan ETH. As of this writing, there is not an Optimistic Kovan ETH faucet. In order to get Optimistic Kovan ETH, follow these steps:
    1) Acquire ETH for your Kovan wallet on MetaMask using a Kovan faucet.
    2) Add Optimistic Ethereum as a Custom RPC to your Metamask wallet, using the [steps here](https://community.optimism.io/docs/developers/metamask.html#connecting-manually), except set the RPC URL to `https://optimism-kovan.infura.io/v3/" + infuraKey`
    3) Visit [this website](https://gateway.optimism.io/) to bridge your Kovan ETH to Optimistic Kovan ETH
    4) Ensure that your `optimistic_kovan` network in `truffle-config.ovm.js` is connected to your Optimistic Kovan wallet.

Layer 1 networks are included in the `truffle-config.js` file, but it is not necessary to deploy your base contracts to Layer 1 right now. Eventually, you will likely have a Layer 2 contract that you want to connect with a Layer 1 contract (they do not have to be identical!). One example is an ERC20 contract that is deployed on an Optimistic Ethereum network. At some point the user will wish to withdraw their funds into Ethereum. There will need to be a contract deployed on Layer 1 that can receive the message from Layer 2 to mint the appropriate tokens on Layer 1 for the user. More information on this system can be found [here](http://community.optimism.io/docs/developers/integration.html#bridging-l1-and-l2).

If you would like to migrate previously migrated contracts on the same network, you can run `truffle migrate --config truffle-config.ovm.js --network=(ganache | optimistic_ethereum | optimistic_kovan)` and add the `--reset` flag.

## Basic Commands

The code here will allow you to compile, migrate, and test your code against an Optimistic Ethereum instance. The following commands can be run (more details on each can be found in the next section):

 To compile:
 ```
 npm run compile:ovm
 ```

 To migrate:
 ```
 npm run migrate:ovm --network=(ganache | optimistic_ethereum | optimistic_kovan)
 ```

 To test:
 ```
 npm run test:ovm --network=(ganache | optimistic_ethereum | optimistic_kovan)
 ```

### Testing

Currently, this box supports testing via Javascript/TypeScript tests. In order to run the test currently in the boilerplate, use the following command:

```
npm run test:ovm --network=(ganache | optimistic_ethereum | optimistic_kovan)
```
Remember that there are some differences between the EVM and the OVM, and refer to the Optimism documentation if you run into test failures.


### Communication Between Ethereum and Optimism Chains

The information above should allow you to deploy to the Optimism Layer 2 chain. This is only the first step! Once you are ready to deploy your own contracts to function on Layer 1 using Layer 2, you will need to be aware of the [ways in which Layer 1 and Layer 2 interact in the Optimism ecosystem](http://community.optimism.io/docs/developers/integration.html#bridging-l1-and-l2). Keep an eye out for additional Truffle tooling and examples that elucidate this second step to full optimism integration!

## Support

Support for this box is available via the Truffle community available [here](https://www.trufflesuite.com/community).
