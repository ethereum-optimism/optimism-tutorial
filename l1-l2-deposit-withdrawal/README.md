# L1/L2 deposit withdrawal example

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial demonstrates how you can use existing Standard bridge infrastructure to deposit and withdraw ERC20 balance between the layers. For the purpose we are making use of the Standard Bridge architecture and creating a sample ERC20 on L1 and its respective representation using the standard token `L2StandardERC20` on L2.

## Setup

### Prerequisites

We assume you already have a Hardhat development environment, as explained in
[the tutorial](https://github.com/ethereum-optimism/optimism-tutorial/tree/main/hardhat). Most of
these directions should also work with Truffle if you prefer that development environment, but there
might be a few minor differences.

### The Configuration File

In this tutorial we need to access both Optimistic Ethereum and the underlying L1 Ethereum. These are already configured in the local hardhat config as `optimism` and `hardhat` networks respectively.

## Transfering Tokens from L1 to L2 and back

```sh
yarn run compile
```

You can run the script that demostracted that via

```sh
node scripts/example.js
```