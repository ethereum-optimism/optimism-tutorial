# Giving Your Users Free Transactions with Optimism and OpenGSN

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)


[Optimism transactions are cheap](https://public-grafana.optimism.io/d/9hkhMxn7z/public-dashboard?orgId=1&refresh=5m).
However, depending on your business model, your users may not have ETH to pay for them at all. 
In this tutorial you learn how to use [OpenGSN](https://opengsn.org/) to pay for your users' transactions.

In general, there are four steps involved:

1. Modify your dapp (contracts and UI) to be OpenGSN compatible
1. Create a paymaster contract
1. Configure a relay (optional)

[Click here for the OpenGSN documentation](https://docs.opengsn.org/).


## Modify your dapp

### OpenGSN compatible contracts

There are several requirements for a contract to be compatible with OpenGSN:

- Inherit from `BaseRelayRecipient`, available as part of the [`@opengsn/contracts`](https://www.npmjs.com/package/@opengsn/contracts) package.
- Instead of `msg.sender` use `_msgSender()`. 
  If the contact is called normally, `_msgSender()` is equal to `msg.sender`.
  If the contact is called directly by an OpenGSN transaction, `_msgSender()` is the original sender rather than the forwarder that forwarded the message.
  Note that if you inherit from [OpenZeppelin contracts](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts), they already use `_msgSender()` to be OpenGSN compatible.
- Create a `trustedForwarder` function that returns the address of the trusted forwarder on this network. 
- Create a `versionRecipient()` function to return the current version of the contract.

[You can see a working version of an OpenGSN compatible contract here](contracts/Greeter.sol).
It is based on the [Hardhat](https://hardhat.org/) Greeter sample program, with a few small changes.


#### Detailed explanation

```solidity
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract Greeter is BaseRelayRecipient {
```

Inherit from `BaseRelayRecipient` to receive OpenGSN transactions.

```solidity
  string greeting;
  address lastGreeter;
```

Keep track of the last address to set the greeting. 

```solidity
  constructor(string memory _greeting) {
    greeting = _greeting;
    lastGreeter = _msgSender();
  }

  function versionRecipient() external virtual view override returns (string memory) {
    return "v. 1.0.0";
  }
```

The `versionRecipient()` function is required by OpenGSN, but the output does not really matter except for logging.


```solidity
  function trustedForwarder() public view override returns (address) {
```

Provide the address of the [`Forwarder`](https://github.com/opengsn/gsn/blob/master/packages/contracts/src/forwarder/Forwarder.sol) from which we are willing accept to messages (including the claim they are from a different source).
The purpose of this contract is to have a tiny (and therefore easily audited) contract that proxies the relayed messages so a security audit of the OpengSGN compatible contract doesn’t require a security audit of [the much more complicated `RelayHub` contract](https://github.com/opengsn/gsn/blob/master/packages/contracts/src/RelayHub.sol). 

```solidity
    if (block.chainid == 10) {    // Optimism
      return 0x67097a676FCb14dc0Ff337D0D1F564649aD94715;
    }
    if (block.chainid == 69) {   // Optimistic Kovan
      return  0x39A2431c3256028a07198D2D27FD120a1f81ecae;
    }

    revert("unknown chain");
  }
```  

[Look here to see the addresses to use](https://docs.opengsn.org/networks/addresses.html#optimism-network).

```solidity

  function greet() public view returns (string memory) {
    return greeting;
  }

  function lastGreeterAddr() public view returns (address) {
    return lastGreeter;
  }
```

Return the address that last modified the greeting.

```solidity
  function setGreeting(string memory _greeting) public {
    greeting = _greeting;
    lastGreeter = _msgSender();    
  }

}

```

Save both the new greeting, and the identity that called us.
Note the use of `_msgSender()` instead of `msg.sender`.

### Modify the client code

Client requests need to go through a [`RelayProvider`](https://github.com/opengsn/gsn/blob/master/packages/provider/src/RelayProvider.ts) to be redirected to a GSN relay.


#### Details explanation

```js
#! /usr/local/bin/node


const ethers = require("ethers")
const { RelayProvider } = require('@opengsn/provider')
const Web3HttpProvider = require( 'web3-providers-http')
// const Web3Contract = require( 'web3-eth-contract')

const greeterAddr = "0x4f8D981EA47c6712fD0016Ad79F8cd7A4E8DE79e"

const relayConfig = {
    paymasterAddress: "0x00B7B352C117Cd283Ce4A6Fc0Ba1F3D95Ea2036E",
    auditorsCount: 0
}     // relayConfig


const greeterArtifact = 
{
  "_format": "hh-sol-artifact-1",
  "contractName": "Greeter",
  "sourceName": "contracts/Greeter.sol",
  "abi": [
      .
      .
      .
  ],
  "bytecode": "0x6080.......", 
  "deployedBytecode":  "0x6080........", 
  "linkReferences": {},
  "deployedLinkReferences": {}
}



const main = async () => {

  let wallet = (ethers.Wallet.createRandom())
  
  const web3provider = new Web3HttpProvider('https://kovan.optimism.io')
  const gsnProvider = RelayProvider.newProvider({ provider: web3provider, config: relayConfig })
  await gsnProvider.init()
  gsnProvider.addAccount(wallet.privateKey)
  const ethersProvider = new ethers.providers.Web3Provider(gsnProvider)
  const signer = ethersProvider.getSigner(wallet.address)
  const greeter = new ethers.Contract(greeterAddr, greeterArtifact.abi, signer)

  console.log(`New greeter: ${wallet.address}`)

  tx = await greeter.setGreeting(`Hello from ${wallet.address}`)
  rcpt = await tx.wait()
}   // main


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });        
```



## Conclusion
