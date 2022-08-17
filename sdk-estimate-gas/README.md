# Estimate the costs of an Optimistic (L2) transaction

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)


This tutorial teaches you how to use the Optimism SDK to estimate the gas costs of L2 transactions. 
This calculation is complicated by the fact that the major cost is the cost of writing the transaction on L1, it doesn't work to just multiply the gas used by the transaction by the gas price, the same way you would on L1. 
[You can read the details of the calculation here](https://help.optimism.io/hc/en-us/articles/4411895794715-Transaction-fees).



## Prerequisites

[The node script](./gas.js) makes these assumptions:

- You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
- There is network connectivity to a provider on the Optimistic Kovan L2 network, and to the npm package registry.


## Running the script

1. Use `yarn` to download the packages you need

   ```sh
   yarn
   ```

1. Copy `.env.example` to `.env` and modify the parameters:

   - `MNEMONIC` is the mnemonic to an account that has enough ETH to pay for the transaction.

   - `ALCHEMY_API_KEY` is the API key for an Optimism Goerli app on [Alchemy](https://www.alchemy.com/), our preferred provider.

   - `OPTIMISM_GOERLI_URL` is the URL for Optimism Goerli, if you use [a different node provider](https://community.optimism.io/docs/useful-tools/providers/).


1. Use Node to run the script

   ```sh
   node gas.js
   ```

That's it.

### Results

The results you get from the script on Optimism Goerli are different than the ones you'd get from running on the main Optimism blockchain. 
The reason is that on Goerli L1 gas costs is just seven times the L1 gas cost.
On the main network the ratio is usually in the tens of thousands ([click here to see the current values](https://public-grafana.optimism.io/d/9hkhMxn7z/public-dashboard?orgId=1&refresh=5m)).

Here is an example of results from the main Optimism blockchain.


```
ori@Oris-MBP sdk-estimate-gas % ./gas.js 
About to get estimates
About to create the transaction
Transaction created, submitting it
Transaction processed
Estimates:
   Total gas cost:       99958954362216 wei
      L1 gas cost:       99926386362216 wei
      L2 gas cost:          32568000000 wei

Real values:
   Total gas cost:       99493733721792 wei
      L1 gas cost:       99461179721796 wei
      L2 gas cost:          32553999996 wei

L1 Gas:
      Estimate:       4296
          Real:       4276
    Difference:        -20

L2 Gas:
      Estimate:      32568
          Real:      32554
    Difference:        -14

```

The L1 gas cost is thousands of times the L2 gas cost.
This is typical in Optimistic transactions, because of the cost ratio between L1 gas and L2 gas.



## How does it work?

In this section we go over the script line by line to learn how to use the SDK for gas estimates.


```js
#! /usr/local/bin/node

// Estimate the costs of an Optimistic (L2) transaction

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
const fs = require("fs")
```

The packages we need directly.

```js
require('dotenv').config()
```

The [`dotenv`](https://www.npmjs.com/package/dotenv) package reads the `.env` file and adds the parameters to `process.env`.

```js
const greeterJSON = JSON.parse(fs.readFileSync("Greeter.json"))
```

The transaction whose gas costs we'll estimate uses [the Hardhat Greeting.sol contract](https://github.com/NomicFoundation/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol).
This contract has one function that changes the state and there requires a transaction to call, [`setGreeting(string)`](https://github.com/NomicFoundation/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol#L18-L21).


```js
const greeterAddrs = {
  // Optimism
  "10":  "0x5825fA9cD0986F52A8Dda506564E99d24a8684D1",

  // Optimism Goerli
  "420": "0x106941459A8768f5A92b770e280555FAF817576f"
}
```

The address of the Greeter contract, which is different on different networks.


```js
// Utilities
const displayWei = x => x.toString().padStart(20, " ")                        
const displayGas = x => x.toString().padStart(10, " ")
const sleep = ms => new Promise(resp => setTimeout(resp, ms));
```

The `sleep` function pauses execution for that number of milliseconds. 

```js
const getSigner = async () => {
  const optimismGoerliUrl = 
  process.env.ALCHEMY_API_KEY ? 
    `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` :
    process.env.OPTIMISM_GOERLI_URL

    const l2RpcProvider = optimismSDK.asL2Provider(
      new ethers.providers.JsonRpcProvider(optimismGoerliUrl)
    )
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).
      connect(l2RpcProvider)

    return wallet
}   // getSigner
```

The function [`optimismSDK.asL2Provider`](https://sdk.optimism.io/modules.html#asL2Provider) takes a regular [Ethers.js Provider](https://docs.ethers.io/v5/api/providers/) and adds a few L2 specific functions, which are explained below.
Because it only adds functions, an [`L2Provider`](https://sdk.optimism.io/modules.html#L2Provider) can be used anywhere you use an Ethers `Provider`.

```js
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).
      connect(l2RpcProvider)

    return wallet
}   // getSigner
```

The rest on the function in standard usage of [`Wallet`](https://docs.ethers.io/v5/api/signer/#Wallet) from the Ethers package.


```js
// Get estimates from the SDK
const getEstimates = async (provider, tx) => {
  return {
    totalCost: await provider.estimateTotalGasCost(tx),
```

[Estimate the total cost (L1+L2) of running the transaction](https://sdk.optimism.io/modules.html#estimateTotalGasCost).

> :warning: This function calls `eth_estimateGas`, which runs the transaction in the node (without changing the blockchain state). 
> This means that the account in `l2Provider` has to have enough ETH to pay for the gas cost of the transaction.

```js
    l1Cost: await provider.estimateL1GasCost(tx),
    l2Cost: await provider.estimateL2GasCost(tx),
```

Estimate the two components of the cost: [L1](https://sdk.optimism.io/modules.html#estimateL1GasCost) and [L2]()https://sdk.optimism.io/modules.html#estimateL1GasCost.

```js    
    l1Gas: await provider.estimateL1Gas(tx)
  }
}    // getEstimates
```

[Get the amount of gas we expect to use to store the transaction on L1](https://sdk.optimism.io/modules.html#estimateL1Gas).


```js
const displayResults = (estimated, real) => {
  console.log(`Estimates:`)
  console.log(`   Total gas cost: ${displayWei(estimated.totalCost)} wei`)
  console.log(`      L1 gas cost: ${displayWei(estimated.l1Cost)} wei`)
  console.log(`      L2 gas cost: ${displayWei(estimated.l2Cost)} wei`)

  console.log(`\nReal values:`)    
  console.log(`   Total gas cost: ${displayWei(real.totalCost)} wei`)
  console.log(`      L1 gas cost: ${displayWei(real.l1Cost)} wei`)
  console.log(`      L2 gas cost: ${displayWei(real.l2Cost)} wei`)

  console.log(`\nL1 Gas:`)
  console.log(`      Estimate: ${displayGas(estimated.l1Gas)}`)
  console.log(`          Real: ${displayGas(real.l1Gas)}`)  
  console.log(`    Difference: ${displayGas(real.l1Gas-estimated.l1Gas)}`)
  
  console.log(`\nL2 Gas:`)
  console.log(`      Estimate: ${displayGas(estimated.l2Gas)}`)
  console.log(`          Real: ${displayGas(real.l2Gas)}`)  
  console.log(`    Difference: ${displayGas(real.l2Gas-estimated.l2Gas)}`)
}   // displayResults
```

This function displays the results to show you the estimates and the real information.
This lets you see how accurate the estimates were.

```js
const main = async () => {    
    
    const signer = await getSigner()
    const chainId = (await signer.provider._networkPromise).chainId

    if(!greeterAddrs[chainId]) {
      console.log(`I don't know the Greeter address on chainId: ${chainId}`)
      process.exit(-1)  
    }

    const Greeter = new ethers.ContractFactory(greeterJSON.abi, greeterJSON.bytecode, signer)
    const greeter = Greeter.attach(greeterAddrs[chainId])

    const greeting = "Hello!"

    let real = {}

```

To create a valid estimate, we need these transaction fields:

- `data`
- `to`
- `gasPrice`
- `type`
- `nonce`
- `gasLimit`

We need the exact values, because a zero costs only 4 gas and any other byte costs 16 bytes.
For example, it is cheaper to encode `gasLimit` if it is `0x100000` rather than `0x10101`.

```js
    const fakeTxReq = await greeter.populateTransaction.setGreeting(greeting)
```

Ether's [`populateTransaction` function](https://docs.ethers.io/v5/api/contract/contract/#contract-populateTransaction) gives us three fields:

- `data`
- `from`
- `to`

```js
    const fakeTx = await signer.populateTransaction(fakeTxReq)
```

The contract cannot provide us with the `nonce`, `chainId`, `gasPrice`, or `gasLimit`.
To get those fields we use [`signer.populateTransaction`](https://docs.ethers.io/v5/api/signer/#Signer-populateTransaction).

```js
    console.log("About to get estimates")
    let estimated = await getEstimates(signer.provider, fakeTx)
```

Call `getEstimates` to get the `L2Provider` estimates.

```js
    estimated.l2Gas = await greeter.estimateGas.setGreeting(greeting)
```

There is no need for a special function to estimate the amount of L2 gas, the normal `estimateGas.<function>` can do the same job it usually does.

```js
    // If the transaction fails, error out with additional information
    let realTx, realTxResp
    const weiB4 = await signer.getBalance()
```

Get the balance prior to the transaction, so we'll be able to see how much it really cost.

```js
    try {
      console.log("About to create the transaction")
      realTx = await greeter.setGreeting(greeting)
      console.log("Transaction created, submitting it")
      realTxResp = await realTx.wait()
      console.log("Transaction processed")
```

Create the transaction and then wait for it to be processed.
This is [the standard way to submit a transaction in Ethers](https://docs.ethers.io/v5/api/contract/contract/#contract-functionsSend).

```js
    } catch (err) {        
      console.log(`Error: ${err}`)
      console.log(`Coming from address: ${await signer.getAddress()} on Optimistic ${network}`)
      console.log(`            balance: ${displayWei(await signer.getBalance())} wei`)
      process.exit(-1)
    }
```

If the transaction failed, it could be because the account lacks the ETH to pay for gas.
The error message shows that information so the user knows about it.

```js
    // If the balance hasn't been updated yet, wait 0.1 sec
    real.totalCost = 0
    while (real.totalCost === 0) {
        const weiAfter = await signer.getBalance()
        real.totalCost= weiB4-weiAfter
        await sleep(100)
    }
```

It takes a bit of time before the change in the account's balance is processed.
This loop lets us wait until it is processed so we'll be able to know the full cost.

Note that this is not the only way to wait until a transaction happens.
You can also use [`crossDomainMessenger.waitForMessageStatus`](https://sdk.optimism.io/interfaces/icrosschainmessenger#waitForMessageStatus). 

```js
    // Get the real information (cost, etc.) from the transaction response
    real.l1Gas = realTxResp.l1GasUsed
    real.l1Cost = realTxResp.l1Fee 
```

These fields are specific to Optimism transaction responses.

```js
    real.l2Gas = realTxResp.gasUsed
```

The gas used on L2 is the gas used for processing.
[This field is standard in Ethers](https://docs.ethers.io/v5/api/providers/types/#providers-TransactionReceipt).


```js
    real.l2Cost = real.totalCost - real.l1Cost
```

This is one way to get the L2 cost of the transaction.
Another would be to multiply `gasUsed` by `gasPrice`.


```js
    displayResults(estimated, real)    
}  // main


main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```


## Conclusion

Using the Optimism SDK you can show users how much a transaction would cost before they submit it.
This is a useful feature in decentralized apps, because it lets people decide if the transaction is worth doing or not.
