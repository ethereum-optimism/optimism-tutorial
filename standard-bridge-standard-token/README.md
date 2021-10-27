# Bridging your Standard ERC20 token to Optimism using the Standard Bridge

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This is a practical guide to getting your ERC20 token deployed on Optimism and bridging it using the
[Standard Bridge implementation](https://community.optimism.io/docs/developers/bridge/standard-bridge.html).

For an L1/L2 token pair to work on the Standard Bridge the L2 token contract has to implement
[`IL2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/regenesis/0.5.0/packages/contracts/contracts/standards/IL2StandardERC20.sol). The standard implementation of that is available in
[`L2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/regenesis/0.5.0/packages/contracts/contracts/standards/L2StandardERC20.sol) contract as part of the `@eth-optimism/contracts` package.

## Deploying a Standard Token

Deployment script is made available under `scripts/deploy-standard-token.js` that you can 
use to instantiate `L2StandardERC20` on `optimistic-devnode` right now if you have 
a development node (as explained [in the basic tutorial](../hardhat/README.md)). Coming 
soon, directions for deploying on `optimistic-kovan` and `optimistic-mainnet`.

### Prerequisites

You should already have a Hardhat development environment, as explained in
[the tutorial](../hardhat/README.md).

### The .env File

To use a network (either Optimistic Kovan or Optimistic Ethereum), create an .env file in the root of `standard-bridge-standard-token` folder and add these keys to it:

- `PRIVATE_KEY` is the account is going to be used for the script, on both L1 and L2.
  Remember to fund it.
- `INFURA_ID` is your Infura ID for using `optimistic-kovan` and `optimistic-mainnet`.

### Running the deploy script

Run the following script

```sh
yarn
yarn hardhat run scripts/deploy-standard-token.js --network optimistic-devnode
```

The script performs the following steps:

1. Deploy an ERC-20 contract on L1. If you want to use an existing ERC-20 contract, modify
   the `makeL1Token` function.
1. Call `L2StandardTokenFactory.createStandardL2Token` to create a standard L2 ERC-20 
   token. The receipt of this transaction includes the address of the new contract.
1. Verify the new contract connects to the correct L1 address.
1. Deposit tokens from L1 to L2.
1. Display the token balances for the user on L1 and L2, and the bridge on L1, to see that
   the new contract works and approximately how long it takes to deposit the tokens.



# Deploying a Custom Token

When the `L2StandardERC20` implementation does not satisfy your requirements, we can consider allowing a custom implemetation. See this [tutorial on getting a custom token implemented and deployed](../standard-bridge-custom-token/README.md) to Optimistic Ethereum.