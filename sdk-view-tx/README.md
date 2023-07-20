# View transactions between layers

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)


This tutorial teaches you how to use [the Optimism SDK](https://sdk.optimism.io/) to view the transactions passed between L1 (Ethereum) and L2 (OP Mainnet) by an address.

The SDK supports multiple OP Chains: OP, Base, etc.
To see whether a specific OP Chain is supported directly, [see the documentation](https://sdk.optimism.io/enums/l2chainid).
Chains that aren't officially supported just take a few extra steps.
Get the L1 contract addresses, and [provide them to the SDK](https://stack.optimism.io/docs/build/sdk/#contract-addresses).
Once you do that, you can use the SDK normally.


## Prerequisites

[The node script](./index.js) makes these assumptions:

1. You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
1. Access to L1 (Ethereum mainnet) and L2 (OP Mainnet) providers.


## Running the script

1. Use `yarn` to download the packages the script needs.

   ```sh
   yarn
   ```

1. Copy `.env.example` to `.env` and specify the URLs for L1 and L2.

1. Use Node to run the script

   ```sh
   node view-tx.js
   ```

### Results

Here are the expected results. 
Note that by the time you read this there might be additional transactions reported.

```
Deposits by address 0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F
tx:0xa35a3085e025e2addd59c5ef2a2e5529be5141522c3cce78a1b137f2eb992d19
	Amount: 0.01 ETH
	Relayed: true



Withdrawals by address 0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F
tx:0x7826399958c6bb3831ef0b02b658e7e3e69f334e20e27a3c14d7caae545c3d0d
	Amount: 1 DAI
	Relayed: false
tx:0xd9fd11fd12a58d9115afa2ad677745b1f7f5bbafab2142ae2cede61f80e90e8a
	Amount: 0.001 ETH
	Relayed: true
```

## How does it work?

In this section we go over the script line by line to learn how to use the SDK to view deposits and withdrawals.

```js
#! /usr/local/bin/node

// View transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
require('dotenv').config()

// Global variable because we need them almost everywhere
let crossChainMessenger


const setup = async() => {

  l1SignerOrProvider = new ethers.providers.JsonRpcProvider(process.env.L1URL)
  l2SignerOrProvider = new ethers.providers.JsonRpcProvider(process.env.L2URL)

  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: (await l1SignerOrProvider._networkPromise).chainId,
      l2ChainId: (await l2SignerOrProvider._networkPromise).chainId,      
      l1SignerOrProvider: l1SignerOrProvider,
      l2SignerOrProvider: l2SignerOrProvider
  })
}    // setup
```

Create the [`CrossChainMessenger`](https://sdk.optimism.io/classes/crosschainmessenger) object that we use to view information.
Note that we do not need signers here, since we are only calling `view` functions.
However, we do need the chainId values.


```js
// Only the part of the ABI we need to get the symbol
const ERC20ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
        {
            "name": "",
            "type": "string"
        }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
]     // ERC20ABI



const getSymbol = async l1Addr => {
  if (l1Addr == '0x0000000000000000000000000000000000000000')
    return "ETH"
```

If `l1Addr` is all zeroes, it means the transfer was ETH.

```js
  const l1Contract = new ethers.Contract(l1Addr, ERC20ABI, crossChainMessenger.l1SignerOrProvider)
  return await l1Contract.symbol()  
```

Otherwise, ask the contract (we could have used the L1 or the L2) what is the correct symbol.

```js
}   // getSymbol



// Describe a cross domain transaction, either deposit or withdrawal
const describeTx = async tx => {
  console.log(`tx:${tx.transactionHash}`)
  // Assume all tokens have decimals = 18
  console.log(`\tAmount: ${tx.amount/1e18} ${await getSymbol(tx.l1Token)}`)
  console.log(`\tRelayed: ${await crossChainMessenger.getMessageStatus(tx.transactionHash)  
                              == optimismSDK.MessageStatus.RELAYED}`)
```

The result of [`crossDomainMessenger.getMessageStatus`](https://sdk.optimism.io/classes/crosschainmessenger#getMessageStatus) is [a `MessageStatus` enumerated value](https://sdk.optimism.io/enums/messagestatus).
In this case we only care whether the deposit/withdrawal is still in process or if it is done.

```js
}  // describeTx


const main = async () => {    
    await setup()

    // The address we trace
    const addr = "0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F"

    const deposits = await crossChainMessenger.getDepositsByAddress(addr)
```

[The `crossChainMessenger.getDepositsByAddress` function](https://sdk.optimism.io/classes/crosschainmessenger#getDepositsByAddress) gives us all the deposits by an address.

```js
    console.log(`Deposits by address ${addr}`)
    for (var i=0; i<deposits.length; i++)
      await describeTx(deposits[i])

    const withdrawals = await crossChainMessenger.getWithdrawalsByAddress(addr)
```

[The `crossChainMessenger.getWithdrawalsByAddress` function](https://sdk.optimism.io/classes/crosschainmessenger#getWithdrawalsByAddress) gives us all the deposits by an address.

```js
    console.log(`\n\n\nWithdrawals by address ${addr}`)
    for (var i=0; i<withdrawals.length; i++)
      await describeTx(withdrawals[i])

}  // main



main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```


## Conclusion

You should now know how to identify all the deposits and/or withdrawals done by a specific address.
There are some additional tracing functions in [`CrossChainMessenger`](https://sdk.optimism.io/classes/crosschainmessenger), but they are very similar in operation.
Of course, if you have any problems you can ask on [our Discord](https://discord-gateway.optimism.io/).
