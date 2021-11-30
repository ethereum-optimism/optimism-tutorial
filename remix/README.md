# Using Optimistic Ethereum with the Remix Development Environment

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial aims to help you get started with developing decentralized applications on [Optimistic Ethereum](https://optimism.io/) using [Remix](https://remix.ethereum.org/#optimize=false&runs=200&evmVersion=null). Applications 
running on top of Optimistic Ethereum are about as secure as those running on the underlying Ethereum mainnet itself, but are
[significantly cheaper](https://archive.optimism.io/gas-comparison).

## Setup

In OVM 2.0, thanks to [EVM equivalence](https://medium.com/ethereum-optimism/introducing-evm-equivalence-5c2021deb306) there is no need for any custom Remix plugins. All you need to do is specify [the network information](https://community.optimism.io/docs/infra/networks.html#optimistic-kovan).

To use Remix:

1. Log on with your wallet to Optimistic Kovan (or, eventually,
   Optimistic Ethereum). You can do this using chainid.link:
   - [Optimistic Kovan](https://chainid.link?network=optimism-kovan)
   - [Optimistic Ethereum](https://chainid.link?network=optimism)

1. Browse to [Remix](https://remix.ethereum.org/).
1. Click the run icon (<img src="https://remix-ide.readthedocs.io/en/latest/_images/a-run-icon.png" height="24" valign="top" />).
1. Select the Environment **Injected Web3 Provider**.
1. Accept the connection in the wallet.

You are now ready to write decentralized applications that use Optimistic Ethereum to run faster at a lower cost with the same security guarantees as L1 Ethereum.

## Conclusion

This tutorial has only touched the most basic points of Optimistic Ethereum development. For more information, you can 
[check out the full integration guide](https://community.optimism.io/docs/developers/tutorials.html) on the Optimism community hub.
Go read it, and then write a dapp that will amaze us.
