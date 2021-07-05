# Bridging ERC-20 Tokens Between L1 and Optimistic Ethereum

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

The most common L1-L2 communication requirement is to move assets, especially ERC-20 tokens, between the underlying L1 network and the L2
solution. Optimisitc Ethereum provides you with a simple mechanism to do that:

1. On Optimistic Ethereum create an ERC-20 contract that inherits from 
   [L2StandardERC20](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/optimistic-ethereum/libraries/standards/L2StandardERC20.sol).
2. Transfer from an address in L1 to the same address in L2:
   1. Do A
   2. Do b
3. Transfer from an address in L2 to the same address L1:
   1. Do A
   2. Do b

## Prerequisites

I am going to assume you already have a Hardhat development environment, as explained in 
[the tutorial](https://github.com/ethereum-optimism/optimism-tutorial/tree/main/hardhat).

## Conclusion

This tutorial has only touched the most basic points of Optimistic Ethereum development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/integration.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
