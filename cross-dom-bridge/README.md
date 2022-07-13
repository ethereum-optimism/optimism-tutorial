# Bridging Assets with the Optimism SDK

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This tutorial teaches you how to use the [Optimism SDK](https://sdk.optimism.io/) to transfer assets between Layer 1 (Ethereum) and Layer 2 (Optimism).
It covers both deposits (Ethereum to Optimism) and withdrawals (Optimism to Ethereum) of the two most common asset types: ETH and ERC-20.

## Setup

1. Ensure your computer has:
   - [`git`](https://git-scm.com/downloads)
   - [`node`](https://nodejs.org/en/)
   - [`yarn`](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)

1. Clone this repository and enter it.

   ```sh
   git clone https://github.com/ethereum-optimism/optimism-tutorial.git
   cd optimism-tutorial/cross-dom-bridge
   ```

1. Install the necessary packages.

   ```sh
   yarn
   ```

1. Copy `.env.example` to `.env` and edit it:

   1. Set `MNEMONIC` to point to an account that has ETH and DAI on the Kovan test network.
   1. Set `KOVAN_URL` to point to a URL that accesses the Kovan test network.
   1. Set `OPTI_KOVAN_URL` to point to the URL for [an Optimism endpoint](https://community.optimism.io/docs/useful-tools/networks/)

   On the Kovan test network you can get ETH and DAI from [this faucet](https://faucet.paradigm.xyz/).


## Run the sample code

The sample code is in `index.js`, execute it.
After you execute it, wait. It is not unusual for each operation to take over a minute on Kovan.
On the production network the withdrawals take around a week each, because of the [challenge period](https://community.optimism.io/docs/developers/bridge/messaging/#understanding-the-challenge-period).

### Expected output

When running on Kovan, the output from the script should be similar to:

```
Deposit ETH
On L1:2009880620 Gwei    On L2:1869999738 Gwei
Transaction hash (on L1): 0xf75598dad30a58bf55a275102bb401bf6c1fdcfab500af3f217735aca7e18393
Waiting for status to change to RELAYED
Time so far 8.456 seconds
On L1:2009528846 Gwei    On L2:1869999739 Gwei
depositETH took 64.78 seconds


Withdraw ETH
On L1:2009528846 Gwei    On L2:1869999739 Gwei
Transaction hash (on L2): 0x98417dc55a0757239987196a28929083e65436db90ee2e51f88ca7ebc4127679
Waiting for status to change to IN_CHALLENGE_PERIOD
Time so far 4.458 seconds
In the challenge period, waiting for status READY_FOR_RELAY
Time so far 73.447 seconds
Ready for relay, finalizing message now
Time so far 85.866 seconds
Waiting for status to change to RELAYED
Time so far 93.217 seconds
On L1:2017707614 Gwei    On L2:1859999738 Gwei
withdrawETH took 102.777 seconds



Deposit ERC20
DAI on L1:1001     DAI on L2:999
Allowance given by tx 0x35f4b3dcb453bbe03346046583e1191b96c6b0bf1d5f7f196e09c6a3159433c4
Time so far 10.904 seconds
Deposit transaction hash (on L1): 0x55c9ce0251d990c367398cd55d73f1e97cc9ea3bc0c5b04e8af3cb9ae49787ff
Waiting for status to change to RELAYED
Time so far 21.966 seconds
DAI on L1:1000     DAI on L2:1000
depositERC20 took 88.256 seconds


Withdraw ERC20
DAI on L1:1000     DAI on L2:1000
Transaction hash (on L2): 0x477f2b890d47637818ace5fad5f15c332bdf83989cbd56f9919d073f2a743d63
Waiting for status to change to IN_CHALLENGE_PERIOD
Time so far 11.367 seconds
In the challenge period, waiting for status READY_FOR_RELAY
Time so far 71.944 seconds
Ready for relay, finalizing message now
Time so far 85.024 seconds
Waiting for status to change to RELAYED
Time so far 91.493 seconds
DAI on L1:1001     DAI on L2:999
withdrawERC20 took 101.889 seconds
```

As you can see, the total running time is about six minutes.


## How does it work?


```js
#! /usr/local/bin/node

// Transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
require('dotenv').config()

```

The libraries we need: [`ethers`](https://docs.ethers.io/v5/), [`dotenv`](https://www.npmjs.com/package/dotenv) and the Optimism SDK itself.

```js
const network = "kovan"  

const mnemonic = process.env.MNEMONIC
const l1Url = process.env.KOVAN_URL
const l2Url = process.env.OPTI_KOVAN_URL
```

Configuration, read from `.env`.

```js
// Contract addresses for DAI tokens, taken 
// from https://static.optimism.io/optimism.tokenlist.json
const daiAddrs = {
  l1Addr: "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa",
  l2Addr: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
}    // daiAddrs
```

The addresses for the DAI contracts on Kovan and Optimistic Kovan.
We use DAI here because we can get it for free [from the faucet](https://faucet.paradigm.xyz/).

```js
// Global variable because we need them almost everywhere
let crossChainMessenger
let l1ERC20, l2ERC20    // DAI contracts to show ERC-20 transfers
let addr    // Our address
```

The configuration parameters required for transfers.

### `getSigners`

This function returns the two signers (one for each layer). 

```js
const getSigners = async () => {
    const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)    
    const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
```

The first step is to create the two providers, each connected to an endpoint in the appropriate layer.

```js
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic)
    const privateKey = hdNode.derivePath(ethers.utils.defaultPath).privateKey
```    

To derive the private key and address from a mnemonic it is not enough to create the `HDNode` ([Hierarchical Deterministic Node](https://en.bitcoin.it/wiki/Deterministic_wallet#Type_2:_Hierarchical_deterministic_wallet)).
The same mnemonic can be used for different blockchains (it's originally a Bitcoin standard), and the node with Ethereum information is under [`ethers.utils.defaultPath`](https://docs.ethers.io/v5/single-page/#/v5/api/utils/hdnode/-%23-hdnodes--defaultpath).

```js    
    const l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider)
    const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider)

    return [l1Wallet, l2Wallet]
}   // getSigners
```

Finally, create and return the wallets.
We need to use wallets, rather than providers, because we need to sign transactions.



### `setup`

This function sets up the parameters we need for transfers.

```js
const setup = async() => {
  const [l1Signer, l2Signer] = await getSigners()
  addr = l1Signer.address
```

We need to know our address to get our ERC-20 balances.

```js
  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: 42,   // For Kovan, it's 1 for Mainnet    
      l1SignerOrProvider: l1Signer,
      l2SignerOrProvider: l2Signer
  })
```

Create the [`CrossChainMessenger`](https://sdk.optimism.io/classes/crosschainmessenger) object that we use to transfer assets.

```js
  l1ERC20 = new ethers.Contract(daiAddrs.l1Addr, erc20ABI, l1Signer)
  l2ERC20 = new ethers.Contract(daiAddrs.l2Addr, erc20ABI, l2Signer)  
}   // setup
```

Create the two contract objects we'll use to check ERC-20 balances. 

```js
// The ABI fragment for an ERC20 we need to get a user's balance.
const erc20ABI = [  
    // balanceOf
    {    
      constant: true,  
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
  ]    // erc20ABI
```

Most of our calls to the ERC-20 accounts are going to be handled by `crossDomainMessenger`, so we won't have worry about the ABI. But we need this specific fragment to be able to check balances.


### Variables that make it easier to convert between WEI and ETH

Both ETH and DAI are denominated in units that are 10^18 of their basic unit.
These variables simplify the conversion.

```js
const gwei = 1000000000n
const eth = gwei * gwei   // 10^18
const centieth = eth/100n
const dai = eth 
```

### `reportBalances`

This function reports the ETH balances of the address on both layers.

```js
const reportBalances = async () => {
  const l1Balance = (await crossChainMessenger.l1Signer.getBalance()).toString().slice(0,-9)
  const l2Balance = (await crossChainMessenger.l2Signer.getBalance()).toString().slice(0,-9)

  console.log(`On L1:${l1Balance} Gwei    On L2:${l2Balance} Gwei`)
}    // reportBalances
```


### `reportERC20Balances`

This function reports the ERC-20 balances on both layers.
We can afford to transfer whole DAIs because we get 500 each time we use the faucet, in contrast to ETH where we only get one.

```js
const reportERC20Balances = async () => {
  const l1Balance = (await l1ERC20.balanceOf(addr)).toString().slice(0,-18)
  const l2Balance = (await l2ERC20.balanceOf(addr)).toString().slice(0,-18)
  console.log(`DAI on L1:${l1Balance}     DAI on L2:${l2Balance}`)  
}    // reportERC20Balances
```


### `depositETH`

This function shows how to deposit ETH from Ethereum to Optimism.

```js
const depositETH = async () => {

  console.log("Deposit ETH")
  await reportBalances()
```

To show that the deposit actually happened we show before and after balances.

```js  
  const start = new Date()

  const response = await crossChainMessenger.depositETH(gwei)  
```

[`crossChainMessenger.depositETH()`](https://sdk.optimism.io/classes/crosschainmessenger#depositETH-2) creates and sends the deposit trasaction on L1.

```js
  console.log(`Transaction hash (on L1): ${response.hash}`)
  await response.wait()
```

Of course, it takes time for the transaction to actually be processed on L1.

```js
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)
  await crossChainMessenger.waitForMessageStatus(response.hash, 
                                                  optimismSDK.MessageStatus.RELAYED) 
```

After the transaction is processed on L1 it needs to be picked up by an off-chain service and relayed to L2. 
To show that the deposit actually happened we need to wait until the message is relayed. 
The [`waitForMessageStatus`](https://sdk.optimism.io/classes/crosschainmessenger#waitForMessageStatus) function does this for us.
[Here are the statuses we can specify](https://sdk.optimism.io/enums/messagestatus).

The third parameter (which is optional) is a hashed array of options:
- `pollIntervalMs`: The poll interval
- `timeoutMs`: Maximum time to wait

```js
  await reportBalances()    
  console.log(`depositETH took ${(new Date()-start)/1000} seconds\n\n`)
}     // depositETH()
```

Once the message is relayed the balance change on Optimism is practically instantaneous.
We can just report the balances and see that the L2 balance rose by 1 gwei.


### `depositERC20`

This function is similar to `depositETH` above, with a few changes for ERC-20.
Therefore, this tutorial only explains the new parts.

ERC-20 deposit is a two step process:

1. Provide an allowance to the bridge
1. Call the bridge to use the allowance to perform a transfer

```js
const depositERC20 = async () => {

  console.log("Deposit ERC20")
  await reportERC20Balances()
  const start = new Date()

  // Need the l2 address to know which bridge is responsible
  const allowanceResponse = await crossChainMessenger.approveERC20(
    daiAddrs.l1Addr, daiAddrs.l2Addr, dai)
```

[Create the transaction that approves the allowance](https://sdk.optimism.io/classes/crosschainmessenger#approveERC20-2).
We have to provide both the L1 token address and the L2 token address for two reasons:

1. There could be multiple L2 ERC-20 contracts that represent the same L1 token.
1. Some token pairs use a different bridge from the standard one.

So the SDK needs to know which bridge needs to get the allowance.

```js
  await allowanceResponse.wait()
  console.log(`Allowance given by tx ${allowanceResponse.hash}`)
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)
```

Providing an allowance is a pure L1 action, so there is no need to wait until a message is relayed.

```js

  const response = await crossChainMessenger.depositERC20(
    daiAddrs.l1Addr, daiAddrs.l2Addr, dai)
```

The `depositERC20()` function](https://sdk.optimism.io/classes/crosschainmessenger#depositERC20-2) also needs both token addresses.


```js
  console.log(`Deposit transaction hash (on L1): ${response.hash}`)
  await response.wait()
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response.hash, 
                                                  optimismSDK.MessageStatus.RELAYED) 

  await reportERC20Balances()    
  console.log(`depositERC20 took ${(new Date()-start)/1000} seconds\n\n`)
}     // depositETH()
```


### `withdrawERC20`

In contract to deposits, ERC-20 withdrawals (from Optimism to Ethereum) do not require an allowance.

```js
const withdrawERC20 = async () => { 
  
  console.log("Withdraw ERC20")
  const start = new Date()  
  await reportERC20Balances()

  const response = await crossChainMessenger.withdrawERC20(
    daiAddrs.l1Addr, daiAddrs.l2Addr, dai)
```

[See here for the `withdrawERC20()` documentation](https://sdk.optimism.io/classes/crosschainmessenger#withdrawERC20-2).

```js
  console.log(`Transaction hash (on L2): ${response.hash}`)
  await response.wait()

  console.log("Waiting for status to change to IN_CHALLENGE_PERIOD")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)
  await crossChainMessenger.waitForMessageStatus(response.hash, 
    optimismSDK.MessageStatus.IN_CHALLENGE_PERIOD) 
```

The challenge period starts when the L2 transaction is written to the cannonical transaction chain on L1, which is not immediate, so it makes sense to wait until [the challenge period](https://community.optimism.io/docs/how-optimism-works/#fault-proofs) starts.


```js
  console.log("In the challenge period, waiting for status READY_FOR_RELAY") 
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response.hash, 
                                                optimismSDK.MessageStatus.READY_FOR_RELAY) 
```

Wait until the state that includes the transaction gets past the challenge period, at which time we can finalize (also known as claim) the transaction.

```js
  console.log("Ready for relay, finalizing message now")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.finalizeMessage(response)
```

Finalizing the message takes a bit of time.


```js
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response, 
    optimismSDK.MessageStatus.RELAYED)
  await reportERC20Balances()   
  console.log(`withdrawERC20 took ${(new Date()-start)/1000} seconds\n\n\n`)  
}     // withdrawERC20()
```

Once the transaction is related the L1 balance is increased and the withdrawal is done.



### `withdrawETH`

[This function](https://sdk.optimism.io/classes/crosschainmessenger#withdrawETH-2) is very similar to `withdrawERC20` above. 

```js
const withdrawETH = async () => { 
  
  console.log("Withdraw ETH")
  const start = new Date()  
  await reportBalances()

  const response = await crossChainMessenger.withdrawETH(centieth)
```

For deposits it was enough to transfer 1 gwei to show that the L2 balance increases.
However, in the case of withdrawals the withdrawing account needs to be pay for finalizing the message, which costs more than that.

By sending 0.01 ETH it is guaranteed that the withdrawal will actually increase the L1 ETH balance instead of decreasing it.

```js
  console.log(`Transaction hash (on L2): ${response.hash}`)
  await response.wait()

  console.log("Waiting for status to change to IN_CHALLENGE_PERIOD")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response.hash, 
    optimismSDK.MessageStatus.IN_CHALLENGE_PERIOD)
  console.log("In the challenge period, waiting for status READY_FOR_RELAY") 
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response.hash, 
                                                optimismSDK.MessageStatus.READY_FOR_RELAY)
                                                
  console.log("Ready for relay, finalizing message now")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.finalizeMessage(response)
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response, 
    optimismSDK.MessageStatus.RELAYED) 
  await reportBalances()   
  console.log(`withdrawETH took ${(new Date()-start)/1000} seconds\n\n\n`)  
}     // withdrawETH()
```

### `main`

A `main` to run the setup followed by all four operations.

```js
const main = async () => {    
    await setup()
    await depositETH()
    await withdrawETH() 
    await depositERC20()   
    await withdrawERC20()

}  // main



main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

## Conclusion

You should now be able to write applications that use our SDK and bridge to transfer assets between layer 1 and layer 2. 

Note that for withdrawals of a commonly used ERC-20 token (or ETH) you would probably want to use a [third party bridge](https://www.optimism.io/apps/bridges) for higher speed and lower cost.
Here is the API documentation for some of those bridges:

* [Hop](https://docs.hop.exchange/js-sdk/getting-started)
* [Synapse](https://docs.synapseprotocol.com/bridge-sdk/sdk-reference/bridge-synapsebridge)
* [Across](https://docs.across.to/bridge/developers/across-sdk)
* [Celer Bridge](https://cbridge-docs.celer.network/developer/cbridge-sdk)
