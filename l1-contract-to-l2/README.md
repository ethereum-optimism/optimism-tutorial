# How can an L1 contract communicate with one on Optimism?

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial teaches you how to write a contract that runs on L1 which calls a contract on Optimism.
This allows, for example, an L1 DAO to control what is happening on L2.

[You can read more details about this process here](https://community.optimism.io/docs/developers/bridge/messaging/).

## Seeing it in action

We installed on our test network, Optimistic Kovan, a copy of [Hardhat's Greeter contract](https://github.com/NomicFoundation/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol) at address `0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c`.

1. Edit `hardhat.config.js`:
   1. Set `mnemonic` to point to an account that has ETH on the Kovan test network. 
   1. Set `module.exports.networks.kovan` to point to a URL that accesses the Kovan test network.

1. Install the necessary packages.

   ```sh
   yarn
   ```

1. Connect the Hardhat console to Optimistic Kovan (L2):
  
   ```sh
   yarn hardhat console --network optimistic-kovan
   ```

1. Connect to the Greeter on L2 and see the greeting:

   ```js
   Greeter = await ethers.getContractFactory("Greeter")
   greeter = await Greeter.attach("0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c")
   await greeter.greet()
   ```

1. Open another window and connect the Hardhat console to Kovan (L1):

   ```js
   yarn hardhat console --network kovan
   Controller = await ethers.getContractFactory("ControlL2Greeter")
   controller = await Controller.deploy()
   tx = await controller.setGreeting("Shalom")
   rcpt = await tx.wait()
   ```

1. Communication between L1 and L2 is not instantaneous.
   While waiting, see the transaction on Etherescan:
   1. Get the value of `tx.hash`.
   1. Search for that value in [Kovan Etherscan](https://kovan.etherscan.io/).
   

## The L1 contract

Let's go over the L1 contract that controls Greeter on L2, [`ControlL2Greeter.sol`](contracts/ControlL2Greeter.sol).

```solidity
//SPDX-License-Identifier: Unlicense
// This contracts runs on L1, and controls a Greeter on L2.
pragma solidity ^0.8.0;

import { ICrossDomainMessenger } from 
    "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
```

This line imports the interface to send messages, [`ICrossDomainMessenger.sol`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/libraries/bridge/ICrossDomainMessenger.sol).


```solidity
contract ControlL2Greeter {
    address crossDomainMessengerAddr = 0x4361d0F75A0186C05f971c566dC6bEa5957483fD;
```

This is the address of [`Proxy_OVM_L1CrossDomainMessenger`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/deployments/kovan/Proxy__OVM_L1CrossDomainMessenger.json#L2) on Kovan. 
To call L2 from L1 on mainnet, you need to [use this address](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/deployments/mainnet/Proxy__OVM_L1CrossDomainMessenger.json#L2).

```solidity
    address greeterL2Addr = 0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c;
```    

This is the address on which `Greeter` is installed on Optimistic Kovan.
On the production Optimism, the same contract is installed on address [`0x5825fA9cD0986F52A8Dda506564E99d24a8684D1`](https://optimistic.etherscan.io/address/0x5825fA9cD0986F52A8Dda506564E99d24a8684D1).


```solidity
    function setGreeting(string calldata _greeting) public {
```

This function sets the new greeting. Note that the string is stored in `calldata`. 
This saves us some gas, because when we are called from an externally owned account or a different contract there no need to copy the input string to memory.
The downside is that we cannot call `setGreeting` from within this contract, because contracts cannot modify their own calldata.

```solidity
        bytes memory message;
```

This is where we'll store the message to send to L2.

```solidity 
        message = abi.encodeWithSignature("setGreeting(string)", 
            _greeting);
```

Here we create the message, the calldata to be sent on L2.
The Solidity [`abi.encodeWithSignature`](https://docs.soliditylang.org/en/v0.8.12/units-and-global-variables.html?highlight=abi.encodeWithSignature#abi-encoding-and-decoding-functions) function creates this calldata.
As [specified in the ABI](https://docs.soliditylang.org/en/v0.5.3/abi-spec.html), it is four bytes of signature for the function being called followed by the parameter, in this case a string.

```solidity
        ICrossDomainMessenger(crossDomainMessengerAddr).sendMessage(
            greeterL2Addr,
            message,
            1000000   // within the free gas limit amount
        );
```

This call actually sends the message. It gets three parameters:

1. The address on L2 of the contract being contacted
1. The calldata to send that contract
1. The gas limit.
   As long as the gas limit is below the [`enqueueL2GasPrepaid`](https://etherscan.io/address/0x5E4e65926BA27467555EB562121fac00D24E9dD2#readContract) value, there is no extra cost.

```solidity
    }      // function setGreeting 
}          // contract ControlL2Greeter
```

## Addresses

[For security reasons](https://community.optimism.io/docs/developers/build/differences/#using-eth-in-contracts) the source contract address for a call on L2 has to be different than the real L1 source contract address.