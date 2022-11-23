# View transactions between layers

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)


This tutorial teaches you how to use [the Optimism SDK](https://sdk.optimism.io/) to view the transactions passed between L1 (Ethereum) and L2 (Optimism) by an address.




## Prerequisites

[The node script](./index.js) makes these assumptions:

1. You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
1. Access to L1 (Ethereum mainnet) and L2 (Optimism) providers.


## Running the script

1. Use `yarn` to download the packages the script needs.

   ```sh
   yarn
   ```

1. Copy `.env.example` to `.env` and specify the URLs for L1 and L2.
   These need to be matching chains, such as Ethereum mainnet (chainID 1) and Optimism mainnet (chainID 10) or Goerli (chainId 5) and Optimism Goerli (chainId 420).

1. Use Node to run the script

   ```sh
   node view-tx.js
   ```

### Results

Here are the expected results. 
Note that by the time you read this there might be additional transactions reported.

```
1 deposits by address 0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F
tx:0xa35a3085e025e2addd59c5ef2a2e5529be5141522c3cce78a1b137f2eb992d19
	Amount: 0.01 ETH
	Relayed: true



2 withdrawals by address 0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F
tx:0x7826399958c6bb3831ef0b02b658e7e3e69f334e20e27a3c14d7caae545c3d0d
	Amount: 1 DAI
	Relayed: false
tx:0xd9fd11fd12a58d9115afa2ad677745b1f7f5bbafab2142ae2cede61f80e90e8a
	Amount: 0.001 ETH
	Relayed: true
```

## How does it work?

In this section we go over the script line by line to learn how to use the SDK to view deposits and withdrawals.

### Initial code

<details>

```js
#! /usr/local/bin/node

// View transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
require('dotenv').config()
const yargs = require("yargs")
```

The packages we need.


```js
const argv = yargs
  .option('address', {
    description: "Address to trace",
    default: "0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F",
    type: 'string'
  })
  .help()
  .alias('help', 'h').argv;
```

The one parameter we need is the address we want to trace.

```js
// Global variable because we need it almost everywhere
let crossChainMessenger
```

</details>

### setup

Create the [`CrossChainMessenger`](https://sdk.optimism.io/classes/crosschainmessenger) object that we use to view information.
Note that we do not need signers here, since what we are only calling `view` functions.
However, we do need the chainId values.

```js
const setup = async() => {
  l1provider = new ethers.providers.JsonRpcProvider(process.env.L1URL)
  l2provider = new ethers.providers.JsonRpcProvider(process.env.L2URL)
```

Create new [`Provider` objects](https://docs.ethers.io/v5/api/providers/jsonrpc-provider/) from the URLs.

```js
  l1chainId = (await l1provider._networkPromise).chainId
  l2chainId = (await l2provider._networkPromise).chainId  
```

Read the chainId values.

```js
  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: l1chainId,
      l2ChainId: l2chainId,
      l1SignerOrProvider: l1provider,
      l2SignerOrProvider: l2provider,
      bedrock: l2chainId > 420
```

The bedrock alpha network has a higher chainId, so we can use this to distinguish between bedrock and the current version.
This parameter won't be required after bedrock is released.

```js      
  })
}    // setup
```

### ERC20ABI

<details>

We don't need the entire ABI, just the `symbol` function.

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
```

</details>


### getSymbol

<details>

This function gets the symbol of the asset that was transferred (either ETH or an ERC-20 token)

```js
const getSymbol = async l1Addr => {
  if (l1Addr == '0x0000000000000000000000000000000000000000')
    return "ETH"
  const l1Contract = new ethers.Contract(l1Addr, ERC20ABI, crossChainMessenger.l1SignerOrProvider)
  return await l1Contract.symbol()  
}   // getSymbol
```

</details>

### describeTx

<details>

```js
// Describe a cross domain transaction, either deposit or withdrawal
const describeTx = async tx => {
  console.log(`tx:${tx.transactionHash}`)
  // Assume all tokens have decimals = 18
  console.log(`\tAmount: ${tx.amount/1e18} ${await getSymbol(tx.l1Token)}`)
  console.log(`\tRelayed: ${await crossChainMessenger.getMessageStatus(tx.transactionHash)  
                              == optimismSDK.MessageStatus.RELAYED}`)
}  // describeTx
```

</details>

### main


```js
const main = async () => {    
    await setup()

    const deposits = await crossChainMessenger.getDepositsByAddress(argv.address)
    console.log(`${deposits.length} deposits by address ${argv.address}`)
    for (var i=0; i<deposits.length; i++)
      await describeTx(deposits[i])

    const withdrawals = await crossChainMessenger.getWithdrawalsByAddress(argv.address)
    console.log(`\n\n\n${withdrawals.length} withdrawals by address ${argv.address}`)
    for (var i=0; i<withdrawals.length; i++)
      await describeTx(withdrawals[i])
      
}  // main
```

We use [`getDepositsByAddress`](https://sdk.optimism.io/classes/crosschainmessenger#getDepositsByAddress) to get the deposit list and [`getWithdrawalsByAddress`](https://sdk.optimism.io/classes/crosschainmessenger#getWithdrawalsByAddress) to get the withdrawals.

```js
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
