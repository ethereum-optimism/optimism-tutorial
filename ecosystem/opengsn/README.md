# Giving Your Users Free Transactions with Optimism and OpenGSN

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)


[Optimism transactions are cheap](https://public-grafana.optimism.io/d/9hkhMxn7z/public-dashboard?orgId=1&refresh=5m).
However, depending on your business model, your users may not have ETH to pay for them at all. 
In this tutorial you learn how to use [OpenGSN](https://opengsn.org/) to pay for your users' transactions.

In general, there are three steps involved:

1. Convert your contracts to be OpenGSN compatible
2. Create a paymaster contract
3. Configure a relay (optional)

[Click here for the OpenGSN documentation](https://docs.opengsn.org/).

## OpenGSN compatible contracts

There are several requirements for a contract to be compatible with OpenGSN:

-  Inherit from `BaseRelayRecipient`, available as part of the [`@opengsn/contracts`](https://www.npmjs.com/package/@opengsn/contracts) package.
- Instead of `msg.sender` use `_msgSender()`. 
  If the contact is called normally, `_msgSender()` is equal to `msg.sender`.
  If the contact is called directly by an OpenGSN transaction, `_msgSender()` is the original sender rather than the forwarder that forwarded the message.
  Note that if you inherit from [OpenZeppelin contracts](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts), they already use `_msgSender()` to be OpenGSN compatible.
- Create a `trustedForwarder` function that returns the address of the trusted forwarder on this network. 
  The purpose is to have a tiny (and therefore easily audited) contract that proxies the relayed messages so a security audit of the OpengSGN compatible contract doesn’t require a security audit of the full `RelayHub` contract. 
  [Look here to see the addresses to use](https://docs.opengsn.org/networks/addresses.html#optimism-network).
- Create a `versionRecipient()` function to return the current version of the contract.

[You can see a working version of an OpenGSN compatible contract here](contracts/Greeter.sol).
It is based on the [Hardhat](https://hardhat.org/) Greeter sample program, with a few small changes.



## Conclusion
