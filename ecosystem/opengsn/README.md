# Giving Your Users Free Transactions with Optimism and OpenGSN

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)


[OP Mainnet transactions are cheap](https://optimism.io/gas-tracker).
However, depending on your business model, your users may not have ETH to pay for them at all. 
In this tutorial you learn how to use [OpenGSN](https://opengsn.org/) to pay for your users' transactions.

In general, doing this requires these tasks:

- Modify your dapp (contracts and UI) to be OpenGSN compatible
- Create and fund a paymaster contract
- Configure a relay (optional)

[Click here for the OpenGSN documentation](https://docs.opengsn.org/).



<!-- 
To see this system in action:

1. Download the repository if you haven't yet:

   ```bash
   git clone https://github.com/ethereum-optimism/optimism-tutorial.git
   cd optimism-tutorial/ecosystem/opengsn
   ```

1. Download the necessary packages:

   ```bash
   yarn
   ```

1. Open [the Greeter contract](https://kovan-optimistic.etherscan.io/address/0xd34335b1d818cee54e3323d3246bd31d94e6a78a#readContract) and see which account set the greeting last (**lastGreeterAddr**).

1. Run the script:

   ```bash
   scripts/use-gsn.js
   ```

   This script creates a random wallet (which of course doesn't have any ETH) and has that wallet send an OpenGSN transaction to change the greeting.

1. Reload the Etherscan page, open **lastGreeterAddr** again, and see that it is a different value.


## Integrating OpenGSN with your dapp

### OpenGSN compatible contracts

There are several requirements for a contract to be compatible with OpenGSN:

- Inherit from `BaseRelayRecipient`, available as part of the [`@opengsn/contracts`](https://www.npmjs.com/package/@opengsn/contracts) package.
- Instead of `msg.sender` use `_msgSender()`. 
  If the contact is called normally, `_msgSender()` is equal to `msg.sender`.
  If the contact is called directly by an OpenGSN transaction, `_msgSender()` is the original sender rather than the forwarder that forwarded the message.
  Note that if you inherit from [OpenZeppelin contracts](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts), they already use `_msgSender()` to be OpenGSN compatible.
- In the constructor call `_setTrustedForwarder` with the address of the trusted forwarder on your network.
  [You can get this address here](https://docs.opengsn.org/networks/optimism/optimism.html).
- Create a `versionRecipient()` function to return the current version of the contract.

[You can see a working version of an OpenGSN compatible contract here](contracts/Greeter.sol).
It is based on the [Hardhat](https://hardhat.org/) Greeter sample program.


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
  event LogEntry(address indexed _soliditySender, 
                 address _gsnSender,
                 address _trustedForwarder,
                 address _lastGreeter,
                 bytes _data);
```

The `LogEntry` event is emitted for debugging.
This may be wasteful in production, but this isn't production code.

```solidity
  constructor(string memory _greeting, address _trustedForwarderAddr) {
    greeting = _greeting;
    _setTrustedForwarder(_trustedForwarderAddr);
```

 The address of the [`Forwarder`](https://github.com/opengsn/gsn/blob/master/packages/contracts/src/forwarder/Forwarder.sol) from which we are willing accept to messages (including the claim they are from a different source).
 The purpose of that contract is to have a tiny (and therefore easily audited) contract that proxies the relayed messages so a security audit of the OpengSGN compatible contract doesn’t require a security audit of [the much more complicated `RelayHub` contract](https://github.com/opengsn/gsn/blob/master/packages/contracts/src/RelayHub.sol).

Note that there is no way to change the forwarder after construction in this contract.
If you need to do so (because the OpenGSN team upgraded their code), you need to either:

- Redeploy the contract

- Write a contract that inherits from [`Ownable`](https://docs.openzeppelin.com/contracts/2.x/access-control#ownership-and-ownable) and create an `onlyOwner` function that changes the forwarder.
I chose not to follow this route to keep the code simple to understand.

```solidity
    lastGreeter = _msgSender();
  }


  function versionRecipient() external virtual view override returns (string memory) {
    return "v. 1.0.0";
  }
```

The `versionRecipient()` function is required by OpenGSN, but the output does not really matter except for logging.


```solidity

  function greet() public view returns (string memory) {
    return greeting;
  }
```

Return the current greeting.

```solidity
  function lastGreeterAddr() public view returns (address) {
    return lastGreeter;
  }
```

Return the address that last modified the greeting.

```solidity
  function setGreeting(string memory _greeting) public {

    emit LogEntry(msg.sender, 
                 _msgSender(),
                 trustedForwarder(),
                 lastGreeter,
                msg.data );    
```

Emit a debugging log entry with all the pertinent information.

```solidity
    greeting = _greeting;
    lastGreeter = _msgSender();    
  }

}

```

Save both the new greeting, and the identity that called us.
Note the use of `_msgSender()` instead of `msg.sender`.

### Modify the client code

Client requests need to go through a [`RelayProvider`](https://github.com/opengsn/gsn/blob/master/packages/provider/src/RelayProvider.ts) to be redirected to a GSN relay.
You can see a working client [here](scripts/use-gsn.js).

#### Detailed explanation

```js
#! /usr/local/bin/node


const ethers = require("ethers")
const { RelayProvider } = require('@opengsn/provider')
const Web3HttpProvider = require( 'web3-providers-http')

const greeterAddr = "0xD34335b1d818ceE54e3323D3246bD31d94E6a78a"
```

The address of [the greeter contract](https://kovan-optimistic.etherscan.io/address/0xd34335b1d818cee54e3323d3246bd31d94e6a78a).
In production code this would probably be a configuration variable.

```js
const relayConfig = {
    paymasterAddress: "0xCc6dA63d001017AC34BFfd35cD24F795014f6a6c",
```

The [Paymaster](https://github.com/opengsn/gsn/tree/master/packages/paymasters) contract that will pay for the transaction, as explained later.
[Click here to interact with this contract](https://kovan-optimistic.etherscan.io/address/0xCc6dA63d001017AC34BFfd35cD24F795014f6a6c).

```js
    auditorsCount: 0,
```

Relays are supposed to check each other to make sure that they relay honestly, using a system similar to the one used by optimistic rollups.
This setting controls the number of relays we want to check the relay we are using.
At writing there is only one relay on Optimistic Kovan ([you can see the current number here](https://relays.opengsn.org/#optKovan)), so there is no other relay that can ceck on it.


```js
    relayLookupWindowBlocks: 5e9,
    relayRegistrationLookupBlocks: 5e9,
    pastEventsQueryMaxPageSize: 5e7
}     // relayConfig
```

This is [the recommended configuration when using Optimistic Kovan](https://docs.opengsn.org/networks/optimism/optimism-kovan.html#recommeneded-client-configuration).
Each supported network has its own recommendations based on performance, amount of traffic, etc. 


```js
const greeterArtifact = 
{
  .
  .
  .
}
```

The artifact from the `Greeter` contract, including the ABI. 
In production server code this information would be read from the `artifacts/contracts/Greeter.sol/Greeter.json`.


```js


const main = async () => {

  const wallet = (ethers.Wallet.createRandom())
```  

Create [a random wallet](https://docs.ethers.io/v5/api/signer/#Wallet-createRandom), one that in all likelihood doesn't have any ETH.
  
```js  
  const web3provider = new Web3HttpProvider('https://kovan.optimism.io')
```

[GSN providers](https://github.com/opengsn/gsn/blob/master/packages/provider/src/RelayProvider.ts) are created out of [Web3 providers](https://web3js.readthedocs.io/en/v1.2.11/web3.html#providers).

[You can use either the URL we provide (for non-production use), or a commercially available endpoint URL](https://community.optimism.io/docs/useful-tools/networks/).

```js
  const gsnProvider = RelayProvider.newProvider({ provider: web3provider, config: relayConfig })
  await gsnProvider.init()
  gsnProvider.addAccount(wallet.privateKey)
```

Create a new provider for GSN and initialize it.
Then add the randomly generated wallet so the provider can sign transactions (but not submit them, because it doesn't have any ETH to pay for gas).


```js
  const ethersProvider = new ethers.providers.Web3Provider(gsnProvider)
```

The GSN provider is itself a web3 provider, so to use Ethers we need to convert using [`Web3Provider`](https://docs.ethers.io/v5/api/providers/other/#Web3Provider).

```js
  const signer = ethersProvider.getSigner(wallet.address)
  const greeter = new ethers.Contract(greeterAddr, greeterArtifact.abi, signer)

  console.log(`New greeter: ${wallet.address}`)

  tx = await greeter.setGreeting(`Hello from ${wallet.address}`)
  rcpt = await tx.wait()
}   // main
```

This is standard [Ethers](https://docs.ethers.io/v5/) programming.

```js
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```


## Paying for transactions

It would be nice if OpenGSN offered actually free transactions, but that isn't doable.
Instead, OpenGSN shifts the cost from the transaction submitter to [a paymaster](https://docs.opengsn.org/contracts/#paying-for-your-user-s-meta-transaction) contract.
Paymaster contracts are deployed by entities who want to sponsor transactions, for example because the destination is their own application ([see the paymaster we use](https://kovan-optimistic.etherscan.io/address/0xcc6da63d001017ac34bffd35cd24f795014f6a6c)) or because [the transactions come from a user on a whitelist of prepaid users](https://github.com/opengsn/gsn/blob/master/packages/paymasters/contracts/WhitelistPaymaster.sol).

OpenGSN provides [multiple prebuilt pay masters](https://github.com/opengsn/gsn/tree/master/packages/paymasters).
If none of them fit your needs you can also write your own. 
After you deploy a paymaster just send it ETH, and it'll forward it to the relay hub.
[You can see an example in this transaction](https://kovan-optimistic.etherscan.io/tx/0xdea9ba02b386449af2a05eef42e5e02b421762d4750751c3744a6d34f39b062e). 

When you no longer need the pay master, you can withdraw any remaining ETH using [`withdrawRelayHubDepositTo`](https://github.com/opengsn/gsn/blob/master/packages/contracts/src/BasePaymaster.sol#L125-L132).


## Running your own relay

The OpenGSN design assumes that every application runs its own relay, which provides two services:

- Relay the messages of that application at cost (you can specify preferred relays in the GSN configuration)
- Relay the messages of other applications for a profit (exactly how much is determined by the relay administrator).
  On most networks OpenGSN runs a relay that charges a 70% premium.

This way relaying is usually cost free, and the more applications for OpenGSN the more robust the network becomes overall, and therefore the more robust the network access of each application.

[See here for directions to create a relayer here](https://docs.opengsn.org/relay-server/tutorial.html).


## Conclusion

You should now be able to use OpenGSN transactions to enable ETH-less transactions for your users, when your business plan is to monetize them by other means.

-->