# Communication between contracts on Optimism and Ethereum

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This tutorial teaches you how to do interlayer communication.
You will learn how run a contract on Ethereum that runs another contract on Optimism, and also how to run a contract on Optimism that calls a contract on Ethereum.

[You can read more details about this process here](https://community.optimism.io/docs/developers/bridge/messaging/).

## Seeing it in action

To show how this works we installed [a slightly modified version of HardHat's `Greeter.sol`](hardhat/contracts/Greeter.sol) on both L1 Goerli and Optimistic Goerli


| Network | Greeter address  |
| ------- | ---------------- |
| Goerli (L1) | [0x7fA4D972bB15B71358da2D937E4A830A9084cf2e](https://goerli.etherscan.io/address/0x7fA4D972bB15B71358da2D937E4A830A9084cf2e) |
| Optimistic Goerli (L2) | [0xC0836cCc8FBa87637e782Dde6e6572aD624fb984](https://blockscout.com/optimism/goerli/address/0xC0836cCc8FBa87637e782Dde6e6572aD624fb984) |

::: Tip What if somebody else uses the same contracts at the same time?
If somebody else uses these contracts while you are going through the tutorial, they might update the greeting after you.
In that case you'll see the wrong greeting when you call the `Greeter` contract.
However, you can still verify your controller works in one of these ways:

- Find the transaction on either [Goerli Etherscan](https://goerli.etherscan.io/address/0x7fA4D972bB15B71358da2D937E4A830A9084cf2e#internaltx) or [Optimistic Goerli BlockScount](https://blockscout.com/optimism/goerli/address/0xC0836cCc8FBa87637e782Dde6e6572aD624fb984/internal-transactions#address-tabs).
  In either case, it will be an internal transaction because the contract called directly is the cross domain messenger.
- Just try again.
:::

### Hardhat

This is how you can see communication between domains work in hardhat.

#### Setup

This setup assumes you already have [Node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/) installed on your system. 

1. Go to [Alchemy](https://www.alchemy.com/) and create two applications:

   - An application on Goerli
   - An application on Optimistic Goerli

   Keep a copy of the two keys.

1. Copy `.env.example` to `.env` and edit it:

   1. Set `MNEMONIC` to point to an account that has ETH on the Goerli test network and the Optimism Goerli test network.
   1. Set `GOERLI_ALCHEMY_KEY` to the key for the Goerli app.
   1. Set `OPTIMISM_GOERLI_ALCHEMY_KEY` to the key for the Optimistic Goerli app
   
1. Install the necessary packages.

   ```sh
   yarn
   ```

#### Ethereum message to Optimism

1. Connect the Hardhat console to Optimism Goerli (L2):

   ```sh
   yarn hardhat console --network optimism-goerli
   ```

1. Connect to the greeter on L2:
  
   ```js
   Greeter = await ethers.getContractFactory("Greeter")
   greeter = await Greeter.attach("0xC0836cCc8FBa87637e782Dde6e6572aD624fb984")
   await greeter.greet()
   ```

<!--
 1. [Browse to the Greeter contract on BlockScout](https://blockscout.com/optimism/goerli/address/0xC0836cCc8FBa87637e782Dde6e6572aD624fb984/read-contract#address-tabs) to see the result of **greet**.
-->

1. In a separatate terminal window connect the Hardhat console to Goerli (L1):

   ```sh
   yarn hardhat console --network goerli
   ```

1. Deploy and call the `FromL1_ControlL2Greeter` contract.

   ```js
   Controller = await ethers.getContractFactory("FromL1_ControlL2Greeter")
   controller = await Controller.deploy()
   tx = await controller.setGreeting(`Hello from L1 ${Date()}`)
   rcpt = await tx.wait()
   ```

1. Make a note of the address of `FromL1_ControlL2Greeter`.

   ```js
   controller.address
   ```

1. Back in the Optimism Goerli console, see the new greeting.
   Note that it may take a few minutes to update after the transaction is processed on L2.

   ```js
   await greeter.greet()
   ```

1. In the block explorer, [view the event log](https://blockscout.com/optimism/goerli/address/0xC0836cCc8FBa87637e782Dde6e6572aD624fb984/logs#address-tabs).
   Notice that the `xorigin` value is the controller address.

#### Optimism message to Ethereum

##### Send the message

1. Get the current L1 greeting. There are two ways to do that:

   - [Browse to the Greeter contract on Etherscan](https://goerli.etherscan.io/address/0x7fA4D972bB15B71358da2D937E4A830A9084cf2e#readContract) and click **greet** to see the greeting.

   - Run these commands in the Hardhat console connected to L1 Goerli:

     ```js
     Greeter = await ethers.getContractFactory("Greeter")
     greeter = await Greeter.attach("0x7fA4D972bB15B71358da2D937E4A830A9084cf2e")
     await greeter.greet()     
     ```

1. Connect the Hardhat console to Optimistic Goerli (L2):

   ```sh
   yarn hardhat console --network optimistic-goerli
   ```

1. Deploy and call the `FromL2_ControlL1Greeter` contract.

   ```js
   Controller = await ethers.getContractFactory("FromL2_ControlL1Greeter")
   controller = await Controller.deploy()
   tx = await controller.setGreeting(`Hello from L2 ${Date()}`)
   rcpt = await tx.wait()
   ```

1. Make a note of the address of `FromL2_ControlL1Greeter`.

   ```js
   controller.address
   ```

1. Keep a copy of the transaction hash.

   ```js
   tx.hash
   ```

##### Receive the message

Transactions from Optimism to Ethereum are not accepted immediately, because we need to wait [to make sure there are no successful challenges](https://community.optimism.io/docs/how-optimism-works/#fault-proofs).
Once the fault challenge period is over (ten seconds on Goerli, seven days on the production network) it is necessary to claim the transaction on L1. 
This is a complex process that requires a [Merkle proof](https://medium.com/crypto-0-nite/merkle-proofs-explained-6dd429623dc5).
You can do it using [the Optimism SDK](https://www.npmjs.com/package/@eth-optimism/sdk).


1. Connect the Hardhat console to Goerli (L1):

   ```sh
   yarn hardhat console --network goerli
   ```

1. Get the SDK (it is already in `node_modules`).

   ```js
   sdk = require("@eth-optimism/sdk")
   ```

1. Configure a `CrossChainMessenger` object:

   ```js
   l1Signer = await ethers.getSigner()
   l2Url = `https://opt-goerli.g.alchemy.com/v2/${process.env.OPTIMISM_GOERLI_ALCHEMY_KEY}`
   crossChainMessenger = new sdk.CrossChainMessenger({ 
      l1ChainId: 5,
      l2ChainId: 420,
      l1SignerOrProvider: l1Signer, 
      l2SignerOrProvider: new ethers.providers.JsonRpcProvider(l2Url)
   })
   ```

1. Check the status of the transaction.
   If it is `false`, wait a few seconds and try again.

   ```js
   hash = <<< tx.hash from L2 >>>
   (await crossChainMessenger.getMessageStatus(hash)) == sdk.MessageStatus.READY_FOR_RELAY
   ```

   `await crossChainMessenger.getMessageStatus(hash)` can return several values at this stage:

   - `sdk.MessageStatus.STATE_ROOT_NOT_PUBLISHED` (2): The state root has not been published yet.
     The challenge period only starts when the state root is published, which is means you might need to wait a few minutes.

   - `sdk.MessageStatus.IN_CHALLENGE_PERIOD` (3): Still in the challenge period, wait a few seconds.

   - `sdk.MessageStatus.READY_FOR_RELAY` (4): Ready to finalize the message.
     Go on to the next step.


1. Finalize the message.

   ```js
   tx = await crossChainMessenger.finalizeMessage(hash)
   rcpt = await tx.wait()
   ```

1. Get the new L1 greeting. There are two ways to do that:

   - [Browse to the Greeter contract on Etherscan](https://goerli.etherscan.io/address/0x7fA4D972bB15B71358da2D937E4A830A9084cf2e#readContract) and click **greet** to see the greeting.

   - Run these commands in the Hardhat console connected to L1 Goerli:

     ```js
     Greeter = await ethers.getContractFactory("Greeter")
     greeter = await Greeter.attach("0x7fA4D972bB15B71358da2D937E4A830A9084cf2e")
     await greeter.greet()     
     ```



### Foundry

#### Setup

1. Install the `@eth-optimims/sdk` library (assuming you already have Node.js and yarn):

   ```sh
   cd foundry/lib
   yarn
   ```

1. Create environment variables for the URLs for the Goerli and Optimism Goerli applications:

   ```sh
   cd ..
   export GOERLI_URL= ...
   export OPTI_GOERLI_URL= ...
   ```

1. Create environment variables for the Greeter contracts' addresses

   ```sh
   export GREETER_L1=0x7fA4D972bB15B71358da2D937E4A830A9084cf2e
   export GREETER_L2=0xC0836cCc8FBa87637e782Dde6e6572aD624fb984
   ```

1. Put your account mnemonic in the file `mnem.delme`.


#### Ethereum message to Optimism

1. See the current greeting.

   ```sh
   cast call --rpc-url $OPTI_GOERLI_URL $GREETER_L2 "greet()"  | cast --to-ascii
   ```

1. Deploy the `FromL1_ControlL2Greeter` contract.

   ```sh
   forge create FromL1_ControlL2Greeter --rpc-url $GOERLI_URL --mnemonic-path mnem.delme
   ```

1. Create an environment variable for the `Deployed to:` address:

   ```sh
   export FROM_L1_CONTROLLER= << address >>
   ```   

1. Send a transaction to change the L2 greeting:

   ```sh
   cast send --rpc-url $GOERLI_URL \
      --mnemonic-path mnem.delme --gas-limit 130000 \
      $FROM_L1_CONTROLLER "setGreeting(string)" '"Salam"'
   ```

   Note that `cast` doesn't estimate the gas limit correctly in this case, so you need to specify it manually.

1. See the greeting has changed. Note that the change might take a few minutes to propagate.

   ```sh
   cast call --rpc-url $OPTI_GOERLI_URL $GREETER_L2 "greet()"  | cast --to-ascii   
   ```

#### Optimism message to Ethereum

##### Send the message

1. See the current greeting.

   ```sh
   cast call --rpc-url $GOERLI_URL $GREETER_L1 "greet()"  | cast --to-ascii
   ```

1. Deploy the `FromL2_ControlL1Greeter` contract.

   ```sh
   forge create FromL2_ControlL1Greeter --rpc-url $OPTI_GOERLI_URL --mnemonic-path mnem.delme --legacy
   ```

1. Create an environment variable for the `Deployed to:` address:

   ```sh
   export FROM_L2_CONTROLLER= << address >>
   ```   

1. Send a transaction to change the L1 greeting:

   ```sh
   cast send --rpc-url $OPTI_GOERLI_URL --legacy \
      --mnemonic-path mnem.delme $FROM_L2_CONTROLLER \
      "setGreeting(string)" '"Salam"'
   ```

1. Create an environment variable for the transaction hash:

   ```sh
   export HASH= << transaction hash >>
   ```

##### Receive the message


1. Run `node`, the JavaScript command line.
 
   ```sh
   cd lib
   node
   ```

1. Get the SDK and the Ethers libraries (they are already in `node_modules`).

   ```js
   sdk = require("@eth-optimism/sdk")
   ethers = require("ethers")
   ```

1. Configure a `CrossChainMessenger` object:

   ```js
   l1Provider = new ethers.providers.JsonRpcProvider(process.env.GOERLI_URL)
   mnemonic = fs.readFileSync("../mnem.delme").toString()
   wallet = ethers.Wallet.fromMnemonic(mnemonic.slice(0,-1))
   l1Signer = wallet.connect(l1Provider)
   l2Provider = new ethers.providers.JsonRpcProvider(process.env.OPTI_GOERLI_URL)
   crossChainMessenger = new sdk.CrossChainMessenger({ 
      l1ChainId: 5,
      l2ChainId: 420,
      l1SignerOrProvider: l1Signer,
      l2SignerOrProvider: l2Provider
   })
   ```

1. To check the status of the transaction, run these commands:

   ```js
   statusPromise = crossChainMessenger.getMessageStatus(process.env.HASH)
   statusPromise.then(status => console.log(status === sdk.MessageStatus.READY_FOR_RELAY))
   ```

   `crossChainMessenger.getMessageStatus(hash)` can return several values at this stage:

   - `sdk.MessageStatus.STATE_ROOT_NOT_PUBLISHED` (2): The state root has not been published yet.
     The challenge period only starts when the state root is published, which is means you might need to wait a few minutes.

   - `sdk.MessageStatus.IN_CHALLENGE_PERIOD` (3): Still in the challenge period, wait a few seconds.

   - `sdk.MessageStatus.READY_FOR_RELAY` (4): Ready to finalize the message.
     Go on to the next step.


1. Finalize the message.

   ```js
   crossChainMessenger.finalizeMessage(process.env.HASH)
   ```


1. Exit `node`:

   ```js
   .exit
   ```

1. See the greeting has changed.

   ```sh
   cast call --rpc-url $OPTI_GOERLI_URL $GREETER_L2 "greet()"  | cast --to-ascii   
   ```



## How it's done (in Solidity)

We'll go over the L1 contract that controls Greeter on L2, [`FromL1_ControlL2Greeter.sol`](hardhat/contracts/FromL1_ControlL2Greeter.sol).
Except for addresses, the contract going the other direction, [`FromL2_ControlL1Greeter.sol`](hardhat/contracts/FromL2_ControlL21reeter.sol), is identical.

```solidity
//SPDX-License-Identifier: Unlicense
// This contracts runs on L1, and controls a Greeter on L2.
pragma solidity ^0.8.0;

import { ICrossDomainMessenger } from 
    "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
```

This line imports the interface to send messages, [`ICrossDomainMessenger.sol`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/libraries/bridge/ICrossDomainMessenger.sol).


```solidity
contract FromL1_ControlL2Greeter {
    address crossDomainMessengerAddr = 0x5086d1eEF304eb5284A0f6720f79403b4e9bE294;
```

This is the address of [`Proxy_OVM_L1CrossDomainMessenger`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/deployments/goerli/Proxy__OVM_L1CrossDomainMessenger.json#L2) on Goerli. 
To call L2 from L1 on mainnet, you need to [use this address](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/deployments/mainnet/Proxy__OVM_L1CrossDomainMessenger.json#L2).
To call L1 from L2, on either mainnet or Kovan, use the address of `L2CrossDomainMessenger`, 0x4200000000000000000000000000000000000007.

```solidity
    address greeterL2Addr = 0xC0836cCc8FBa87637e782Dde6e6572aD624fb984;
```    

This is the address on which `Greeter` is installed on Optimistic Goerli.


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
As [specified in the ABI](https://docs.soliditylang.org/en/v0.8.12/abi-spec.html), it is four bytes of signature for the function being called followed by the parameter, in this case a string.

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
   Note that this parameter is also required on messages from L2 to L1, but there it does not affect anything.

```solidity
    }      // function setGreeting 
}          // contract FromL1_ControlL2Greeter
```


## Getting the source address

If you look at Etherscan, for either the [L1 Greeter](https://goerli.etherscan.io/address/0x7fA4D972bB15B71358da2D937E4A830A9084cf2e#events) or the [L2 Greeter](https://blockscout.com/optimism/goerli/address/0xC0836cCc8FBa87637e782Dde6e6572aD624fb984/logs#address-tabs), you will see events with the source address on the other layer.
The way this works is that the cross domain messenger that calls the target contract has a method, `xDomainMessageSender()`, that returns the source address. It is used by the `getXsource` function in `Greeter`.

```solidity
  // Get the cross domain origin, if any
  function getXorig() private view returns (address) {
    address cdmAddr = address(0);    
```

It might look like it would be more efficient to calculate the address of the cross domain messanger just once, but that would involve changing the state, which is an expensive operation. 
Unless we are going to run this code thousands of times, it is more efficient to just have a few `if` statements.

```solidity
    // Mainnet
    if (block.chainid == 1)
      cdmAddr = 0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1;

    // Kovan
    if (block.chainid == 42)
      cdmAddr = 0x4361d0F75A0186C05f971c566dC6bEa5957483fD;

    // Goerli
    if (block.chainid == 5)
      cdmAddr = 0x5086d1eEF304eb5284A0f6720f79403b4e9bE294;

    // L2 (same address on every network)
    if (block.chainid == 10 || block.chainid == 69 || block.chainid == 420)
      cdmAddr = 0x4200000000000000000000000000000000000007;
      
```

There are three possibilities for the cross domain messenger's address on L1, because the address is not under our control.
On L2 Optimism has full control of the genesis block, so we can put all of our contracts on convenient addresses.

```solidity
    // If this isn't a cross domain message
    if (msg.sender != cdmAddr)
      return address(0);
```

If the sender isn't the cross domain messenger, then this isn't a cross domain message.
Just return zero.


```solidity
    // If it is a cross domain message, find out where it is from
    return ICrossDomainMessenger(cdmAddr).xDomainMessageSender();
  }    // getXorig()
```

If it is the cross domain messenger, call `xDomainMessageSender()` to get the original source address.

## Conclusion

You should now be able to control contracts on Optimism from Ethereum or the other way around.
This is useful, for example, if you want to hold cheap DAO votes on Optimism to manage an Ethereum treasury (see [rollcall](https://github.com/withtally/rollcall)) or offload a complicated calculation, which must be done in a traceable manner, to Optimism where gas is cheap.
