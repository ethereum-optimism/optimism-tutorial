# Estimate the costs of an Optimistic (L2) transaction

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)


This tutorial teaches you how to use the Optimism SDK to estimate the gas costs of L2 transactions. 
This calculation is complicated by the fact that the major cost is the cost of writing the transaction on L1, it doesn't work to just multiply the gas used by the transaction by the gas price, the same way you would on L1. 
[You can read the details of the calculation here](https://help.optimism.io/hc/en-us/articles/4411895794715-Transaction-fees).



## Prerequisites

[The node script](./gas.js) makes these assumptions:

1. You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
1. There is network connectivity to a provider on the Optimistic Kovan L2 network, and to the npm package registry.
1. The account it uses, [0xf5a6ead936fb47f342bb63e676479bddf26ebe1d](https://kovan-optimistic.etherscan.io/address/0xf5a6ead936fb47f342bb63e676479bddf26ebe1d), has enough Kovan ETH to pay for gas.
   If it does not have enough Kovan ETH, please replenish it [from a faucet](https://community.optimism.io/docs/useful-tools/faucets).


## Running the script

1. Use `yarn` to download the packages you need

   ```sh
   yarn
   ```

1. Use Node to run the script

   ```sh
   node gas.js
   ```

That's it.

### Results

The results you get from the script on Kovan look a bit strange, because the L1 gas price is tiny (7 wei) compared to the L2 gas price (1,000,000 wei).
Here is an example of results from the production Optimism blockchain, where the L2 gas price is still 1,000,000 wei, but the L1 gas price is, at writing, about 60 Gwei. 


```
ori@Oris-MacBook-Pro sdk-gas-estimate % node gas.js
About to create the transaction
Transaction created, submitting it
Transaction processed
Estimates:
   Total gas cost:      309728722234122 wei
      L1 gas cost:      309689454234122 wei
      L2 gas cost:          39268000000 wei

Real values:
   Total gas cost:      309727308234124 wei
      L1 gas cost:      309689454234123 wei
      L2 gas cost:          37854000001 wei

L1 Gas:
      Estimate:       4276
          Real:       4276
    Difference:          0

L2 Gas:
      Estimate:      39268
          Real:      37854
    Difference:      -1414    
```

There are several important facts to note here:

- The L1 gas cost is over 7,500 times the L2 gas cost.
  This is typical in Optimistic transactions, because of the cost ratio between L1 gas and L2 gas.
- The L1 gas estimate is accurate, but the L1 gas cost is off by one wei.
  This happens because as part of the calculation the gas cost is multiplied by a scalar (1.24 as I'm writing this).
  The result is sometimes rounded up and sometimes down, depending on where it is calculated.
- The L2 gas estimate is off by about 3%. 
  The mechanism `geth` uses to estimate the gas cost of a transaction has an approximation, not an exact figure.
- Because the cost discrepency is in L2 gas, the difference in cost is just 1.4 Gwei, which at current prices is less than a thousands of a cent.



## How does it work?

In this section we go over the script line by line to learn how to use the SDK for gas estimates.


```js
// Estimate the costs of an Optimistic (L2) transaction

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
const fs = require("fs")
```

The packages we need directly.

```js
const greeterJSON = JSON.parse(fs.readFileSync("Greeter.json"))
```

The transaction whose gas costs we'll estimate uses [the Hardhat Greeting.sol contract](https://github.com/NomicFoundation/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol).
This contract has one function that changes the state and there requires a transaction to call, [`setGreeting(string)`](https://github.com/NomicFoundation/hardhat/blob/master/packages/hardhat-core/sample-projects/basic/contracts/Greeter.sol#L18-L21).


```js
const network = "kovan"    // "kovan" or "mainnet"
const mnemonic = "test test test test test test test test test test test junk"
```

Configuration, the network to use and the mnemonic for the account.
This mnemonic is a common testing account.

```js
const l2Url = `https://${network}.optimism.io`
const greeterAddr = network === "kovan" ? 
                        "0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c" :
                        "0x5825fA9cD0986F52A8Dda506564E99d24a8684D1"
```

We deployed `Greeter` on both our test network and our production network, at these addresses.

```js
// Utilities
const displayWei = x => x.toString().padStart(20, " ")                        
const displayGas = x => x.toString().padStart(10, " ")
const sleep = ms => new Promise(resp => setTimeout(resp, ms));
```

The `sleep` function pauses execution for that number of milliseconds. 

```js
// Get an L2 signer
const getSigner = async () => {
    const l2RpcProvider = optimismSDK.asL2Provider(new ethers.providers.JsonRpcProvider(l2Url))
```

The function [`optimismSDK.asL2Provider`](https://sdk.optimism.io/modules.html#asL2Provider) takes a regular [Ethers.js Provider](https://docs.ethers.io/v5/api/providers/) and adds a few L2 specific functions, which are explained below.
Because it only adds functions, an [`L2Provider`](https://sdk.optimism.io/modules.html#L2Provider) can be used anywhere you use an Ethers `Provider`.

```js
    const privateKey = ethers.utils.HDNode.fromMnemonic(mnemonic).privateKey
    const wallet = new ethers.Wallet(privateKey, l2RpcProvider)

}   // getSigner
```

The rest on the function in standard usage of [`HDNode`](https://docs.ethers.io/v5/api/utils/hdnode/#HDNode) and [`Wallet`](https://docs.ethers.io/v5/api/signer/#Wallet) from the Ethers package.


```js
// Get estimates from the SDK
const getEstimates = async (provider, tx) => {
  let retVal = {}
```

We can't use the `{a: b(), c: d()}` syntax because the `L2Provider` functions connect to the Optimism endpoint, and therefore are asynchronous.


```js
  retVal.totalCost = await provider.estimateTotalGasCost(tx)
```

[Estimate the total cost (L1+L2) of running the transaction](https://sdk.optimism.io/modules.html#estimateTotalGasCost).

```js
  retVal.l1Cost    = await provider.estimateL1GasCost(tx)
  retVal.l2Cost    = await provider.estimateL2GasCost(tx)
```

Estimate the two components of the cost: [L1](https://sdk.optimism.io/modules.html#estimateL1GasCost) and [L2]()https://sdk.optimism.io/modules.html#estimateL1GasCost.

```js
  retVal.l1Gas     = await provider.estimateL1Gas(tx)
```

[Get the amount of gas we expect to use to store the transaction on L1](https://sdk.optimism.io/modules.html#estimateL1Gas).

```js
  return retVal
}    // getEstimates



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

    const Greeter = new ethers.ContractFactory(greeterJSON.abi, greeterJSON.bytecode, signer)
    const greeter = Greeter.attach(greeterAddr)

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
        sleep(100)
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
