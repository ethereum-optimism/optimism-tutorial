# Trace cross domain transactions

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This tutorial teaches you how to trace individual cross-domain transactions between L1 Ethereum and OP Mainnet using [the Optimism SDK](https://sdk.optimism.io/).
To see how to send these messages, see [the cross domain tutorial](../cross-dom-comm/) or the tutorials on how to transfer [ETH](../cross-dom-bridge-eth/) and [ERC-20](../cross-dom-bridge-erc20/).

The SDK supports multiple OP Chains: OP, Base, etc.
To see whether a specific OP Chain is supported directly, [see the documentation](https://sdk.optimism.io/enums/l2chainid).
Chains that aren't officially supported just take a few extra steps.
Get the L1 contract addresses, and [provide them to the SDK](https://stack.optimism.io/docs/build/sdk/#contract-addresses).
Once you do that, you can use the SDK normally.

## Getting started

### Prerequisites

- Have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
- Access to L1 (Ethereum mainnet) and L2 (OP Mainnet) providers.


1. Use `yarn` to download the packages the script needs.

   ```sh
   yarn
   ```

1. Copy `.env.example` to `.env` and specify the URLs for L1 and L2.
   For the transactions in this tutorial we will use Goerli.
   However, you can use the same code to trace mainnet transactions.

1. Start the hardhat console

   ```sh
   yarn hardhat console --network l1
   ```

1. Create a [CrossDomainMessenger](https://sdk.optimism.io/#crosschainmessenger):

   ```js
   optimismSDK = require("@eth-optimism/sdk")
   l1Provider = new ethers.providers.JsonRpcProvider(process.env.L1URL)
   l2Provider = new ethers.providers.JsonRpcProvider(process.env.L2URL)
   l1ChainId = (await l1Provider._networkPromise).chainId
   l2ChainId = (await l2Provider._networkPromise).chainId  
   crossChainMessenger = new optimismSDK.CrossChainMessenger({
     l1ChainId: l1ChainId,    
     l2ChainId: l2ChainId,          
     l1SignerOrProvider: l1Provider,
     l2SignerOrProvider: l2Provider,
   })
   ```

## Tracing a deposit

We are going to trace [this deposit](https://goerli.etherscan.io/tx/0x80da95d06cfe8504b11295c8b3926709ccd6614b23863cdad721acd5f53c9052). 

1. Get the message status.

   ```js
   l1TxHash = "0x80da95d06cfe8504b11295c8b3926709ccd6614b23863cdad721acd5f53c9052"
   await crossChainMessenger.getMessageStatus(l1TxHash)
   ```

   The list of message statuses and their meaning is [in the SDK documentation](https://sdk.optimism.io/enums/messagestatus).
   `6` means the message was relayed successfully.
   
1. Get the message receipt.

   ```js
   l2Rcpt = await crossChainMessenger.getMessageReceipt(l1TxHash)
   ```

   In addition to `l2Rcpt.transactionReceipt`, which contains the standard transaction receipt, you get `l2Rcpt.receiptStatus` with the transaction status. 
   [`1` means successful relay](https://sdk.optimism.io/enums/messagereceiptstatus).

1. Get the hash of the L2 transaction (`l2Rcpt.transactionReceipt.transactionHash`) 

   ```js
   l2TxHash = l2Rcpt.transactionReceipt.transactionHash
   ```

   You can view this transaction [on Etherscan](https://goerli-optimism.etherscan.io/tx/0xa31eda15162e681e78a52e35b63c3b3379e23705129c19d186790089519ac7d7).
   

1. In OP Mainnet terminology *deposit* refers to any transaction going from L1 Ethereum to OP Mainnet, and *withdrawal* refers to any transaction going from OP Mainnet to L1 Ethereum, whether or not there are assets attached.
   To see if actual assets were transferred, you can parse the event log.

   The event names and their parameters are usually available on Etherscan, but you can't just copy and paste, you need to make a few changes:

   - Add `event` before each event.
   - Change the `index_topic_<n>` strings to `indexed`, and put them after the type rather than before.

   ```js
   abi = [
     "event Transfer (address indexed from, address indexed to, uint256 value)",
     "event Mint (address indexed _account, uint256 _amount)",
     "event DepositFinalized (address indexed _l1Token, address indexed _l2Token, address indexed  _from, address _to, uint256 _amount, bytes _data)",
     "event RelayedMessage (bytes32 indexed msgHash)"
   ]
   iface = new ethers.utils.Interface(abi)
   logEvents = l2Rcpt.transactionReceipt.logs.map(x => {
      try {
      res = iface.parseLog(x)
      res.address = x.address
      return res
      } catch (e) {}
   }).filter(e => e != undefined)
   ```

   The `try .. catch` syntax is necessary because not all the log entries can be parsed by `iface`.

1. When an asset is deposited, it is actually locked in the bridge on L1, and an equivalent asset is minted on L2.
   To see transferred assets, look for `Mint` events.

   ```js
   mints = logEvents.filter(x => x.name == 'Mint')
   for(i = 0; i<mints.length; i++)
     console.log(`Asset: ${mints[i].address}, amount ${mints[0].args._amount / 1e18}`)
   ```

## Tracing a withdrawal

We are going to trace [this withdrawal](https://goerli-optimism.etherscan.io/tx/0x548f9eed01498e1b015aaf2f4b8c538f59a2ad9f450aa389bb0bde9b39f31053).


1. Get the message status.

   ```js
   l2TxHash = "0x548f9eed01498e1b015aaf2f4b8c538f59a2ad9f450aa389bb0bde9b39f31053"
   await crossChainMessenger.getMessageStatus(l2TxHash)
   ```

   The list of message statuses and their meaning is [in the SDK documentation](https://sdk.optimism.io/enums/messagestatus).
   `6` means the message was relayed successfully.
   
1. Get the message receipt.

   ```js
   l1Rcpt = await crossChainMessenger.getMessageReceipt(l2TxHash)
   ```

   In addition to `l1Rcpt.transactionReceipt`, which contains the standard transaction receipt, you get `l1Rcpt.receiptStatus` with the transaction status. 
   [`1` means successful relay](https://sdk.optimism.io/enums/messagereceiptstatus).

1. Get the hash of the L1 transaction (`l1Rcpt.transactionReceipt.transactionHash`) 

   ```js
   l1TxHash = l1Rcpt.transactionReceipt.transactionHash
   ```

   You can view this transaction [on Etherscan](https://goerli.etherscan.io/tx/0xec821514b495c2c49dcba9b2c1a0955b85d02cd516748bc89c373d534ee878d4).
   

1. In OP Mainnet terminology *deposit* refers to any transaction going from L1 Ethereum to OP Mainnet, and *withdrawal* refers to any transaction going from OP Mainnet to L1 Ethereum, whether or not there are assets attached.
   To see if actual assets were transferred, you can parse the event log.
   This is how you parse the event log of the L2 transaction.

   The event names and their parameters are usually available on Etherscan, but you can't just copy and paste, you need to make a few changes:

   - Add `event` before each event.
   - Change the `index_topic_<n>` strings to `indexed`, and put them after the type rather than before.

   ```js
   abi = [
     "event Transfer (address indexed from, address indexed to, uint256 value)",
     "event Burn (address indexed _account, uint256 _amount)",
     "event SentMessage (address indexed target, address sender, bytes message, uint256 messageNonce, uint256 gasLimit)",
     "event WithdrawalInitiated (address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _data)"
   ]
   iface = new ethers.utils.Interface(abi)
   l2Rcpt = await l2Provider.getTransactionReceipt(l2TxHash)
   events = l2Rcpt.logs.map(x => {
     res = iface.parseLog(x)
     res.address = x.address
     return res
   })
   logEvents = l2Rcpt.logs.map(x => {
      try {
      res = iface.parseLog(x)
      res.address = x.address
      return res
      } catch (e) {}
   }).filter(e => e != undefined)
   ```

   The `try .. catch` syntax is necessary because not all the log entries can be parsed by `iface`.

1. When an asset is withdrawn, it is burned on L2, and then the bridge on L1 releases the equivalent asset.
   To see transferred assets, look for `Burn` events.

   ```js
   burns = logEvents.filter(x => x.name == 'Burn')
   for(i = 0; i<burns.length; i++)
     console.log(`Asset: ${burns[i].address}, amount ${burns[0].args._amount / 1e18}`)
   ```
