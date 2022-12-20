# Trace cross domain transactions

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This tutorial teaches you how to trace individual cross-domain transactions between L1 Ethereum and Optimism using [the Optimism SDK](https://sdk.optimism.io/).


## Getting started

### Prerequisites

1. You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
1. Access to L1 (Ethereum mainnet) and L2 (Optimism) providers.

1. Use `yarn` to download the packages the script needs.

   ```sh
   yarn
   ```

1. Copy `.env.example` to `.env` and specify the URLs for L1 and L2.
   For the transactions in this tutorial we will use mainnet.
   However, you can use the same code to trace Georli testnet transactions.

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
     l2SignerOrProvider: l2Provider
   })
   ```

## Tracing a deposit

We are going to trace [this deposit](https://etherscan.io/tx/0xa35a3085e025e2addd59c5ef2a2e5529be5141522c3cce78a1b137f2eb992d19). 

1. Get the message status.

   ```js
   l1TxHash = "0xa35a3085e025e2addd59c5ef2a2e5529be5141522c3cce78a1b137f2eb992d19"
   await crossChainMessenger.getMessageStatus(l1TxHash)
   ```

   The list of message statuses and their meaning is [in the SDK documentation](https://sdk.optimism.io/enums/messagestatus).
   `6` means the message was relayed successfully.
   
1. Get the message receipt.

   ```js
   rcpt = await crossChainMessenger.getMessageReceipt (l1TxHash)
   ```

   In addition to `rcpt.transactionReceipt`, which contains the stardard transaction receipt, you get `rcpt.receiptStatus` with the transaction status. 
   [`1` means successful relay](https://sdk.optimism.io/enums/messagereceiptstatus).

1. Get the hash of the L2 transaction (`rcpt.transactionReceipt.transactionHash`) 

   ```js
   l2TxHash = rcpt.transactionReceipt.transactionHash
   ```

   You can view this transaction [on Etherscan](https://optimistic.etherscan.io/tx/0xacebdaad885f1b8228fab4f5ef781cdbec05546fab68b005a17a56687efa2428).
   

1. In Optimism terminology *deposit* refers to any transaction going from L1 Ethereum to Optimism, and *withdrawal* refers to any transaction going from Optimism to L1 Ethereum, whether or not there are assets attached.
   To see if actual assets were transfered, you can parse the event log.

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
   events = rcpt.transactionReceipt.logs.map(x => {
     res = iface.parseLog(x)
     res.address = x.address
     return res
   })
   ```

1. When an asset is deposited, it is actually locked in the bridge on L1, and an equivalent asset is minted on L2.
   To see transfered assets, look for `Mint` events.

   ```js
   mints = events.filter(x => x.name == 'Mint')
   for(i = 0; i<mints.length; i++)
     console.log(`Asset: ${mints[i].address}, amount ${mints[0].args._amount / 1e18}`)
   ```

## Tracing a withdrawal

We are going to trace [this withdrawal](https://optimistic.etherscan.io/tx/0xd9fd11fd12a58d9115afa2ad677745b1f7f5bbafab2142ae2cede61f80e90e8a).


1. Get the message status.

   ```js
   l2TxHash = "0xd9fd11fd12a58d9115afa2ad677745b1f7f5bbafab2142ae2cede61f80e90e8a"
   await crossChainMessenger.getMessageStatus(l2TxHash)
   ```

   The list of message statuses and their meaning is [in the SDK documentation](https://sdk.optimism.io/enums/messagestatus).
   `6` means the message was relayed successfully.
   
1. Get the message receipt.

   ```js
   rcpt = await crossChainMessenger.getMessageReceipt(l2TxHash)
   ```

   In addition to `rcpt.transactionReceipt`, which contains the stardard transaction receipt, you get `rcpt.receiptStatus` with the transaction status. 
   [`1` means successful relay](https://sdk.optimism.io/enums/messagereceiptstatus).

1. Get the hash of the L1 transaction (`rcpt.transactionReceipt.transactionHash`) 

   ```js
   l1TxHash = rcpt.transactionReceipt.transactionHash
   ```

   You can view this transaction [on Etherscan](https://etherscan.io/tx/0x12fb3b98dfaee334e32d6feeb358e9382806a8a5f418e8837e71a0d92967bef9).
   

1. In Optimism terminology *deposit* refers to any transaction going from L1 Ethereum to Optimism, and *withdrawal* refers to any transaction going from Optimism to L1 Ethereum, whether or not there are assets attached.
   To see if actual assets were transfered, you can parse the event log.
   This is how you parse the event log of the L2 transaction

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
   l2Rcpt = await l2provider.getTransactionReceipt(l2TxHash)
   events = l2Rcpt.logs.map(x => {
     res = iface.parseLog(x)
     res.address = x.address
     return res
   })
   ```

1. When an asset is withdrawn, it is burned on L2, and then the bridge on L1 releases the equivalent asset.
   To see transfered assets, look for `Burn` events.

   ```js
   burns = events.filter(x => x.name == 'Burn')
   for(i = 0; i<burns.length; i++)
     console.log(`Asset: ${burns[i].address}, amount ${burns[0].args._amount / 1e18}`)
   ```