# Bridging Assets with the Optimism SDK

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This tutorial teaches you how to use the [Optimism SDK](https://sdk.optimism.io/) to transfer assets between Layer 1 (Ethereum) and Layer 2 (Optimism).


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

1. Go to [Alchemy](https://www.alchemy.com/) and create two applications:

   - An application on Goerli
   - An application on Optimistic Goerli

   Keep a copy of the two keys.

1. Copy `.env.example` to `.env` and edit it:

   1. Set `MNEMONIC` to point to an account that has ETH on the Goerli test network and the Optimism Goerli test network.
   1. Set `GOERLI_ALCHEMY_KEY` to the key for the Goerli app.
   1. Set `OPTIMISM_GOERLI_ALCHEMY_KEY` to the key for the Optimistic Goerli app

   On the Goerli test network you can get ETH from [this faucet](https://faucet.paradigm.xyz/).


## Run the sample code

The sample code is in `index.js`, execute it.
After you execute it, wait. It is not unusual for each operation to take minutes on Goerli.
On the production network the withdrawals take around a week each, because of the [challenge period](https://community.optimism.io/docs/developers/bridge/messaging/#understanding-the-challenge-period).

### Expected output

When running on Goerli, the output from the script should be similar to:

```
Deposit ETH
On L1:151154093 Gwei    On L2:139999999 Gwei
Transaction hash (on L1): 0x70d64968fa9e4a58d19c6bdc091ab3e793f1150426168dccf111dbf5b6bee1c4
Waiting for status to change to RELAYED
Time so far 29.92 seconds
On L1:150942902 Gwei    On L2:140000000 Gwei
depositETH took 225.198 seconds


Withdraw ETH
On L1:150942902 Gwei    On L2:140000000 Gwei
Transaction hash (on L2): 0xaddc7562ab0d7125debb9238aeb7f777c2232e724fe30c434a4524a522d4917b
Waiting for status to change to IN_CHALLENGE_PERIOD
Time so far 2.779 seconds

In the challenge period, waiting for status READY_FOR_RELAY
Time so far 969.294 seconds
Ready for relay, finalizing message now
Time so far 979.332 seconds
Waiting for status to change to RELAYED
Time so far 982.856 seconds
On L1:160107872 Gwei    On L2:130000000 Gwei
withdrawETH took 997.834 seconds
```

As you can see, the total running time is about twenty minutes.


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
const mnemonic = process.env.MNEMONIC
const l1Url = `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_KEY}`
const l2Url = `https://opt-goerli.g.alchemy.com/v2/${process.env.OPTIMISM_GOERLI_KEY}`
```

Configuration, read from `.env`.


```js
// Global variable because we need them almost everywhere
let crossChainMessenger
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


```js
  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: 5,    // Goerli value, 1 for mainnet
      l2ChainId: 420,  // Goerli value, 10 for mainnet
      l1SignerOrProvider: l1Signer,
      l2SignerOrProvider: l2Signer
  })
```

Create the [`CrossChainMessenger`](https://sdk.optimism.io/classes/crosschainmessenger) object that we use to transfer assets.


### Variables that make it easier to convert between WEI and ETH

Both ETH and DAI are denominated in units that are 10^18 of their basic unit.
These variables simplify the conversion.

```js
const gwei = 1000000000n
const eth = gwei * gwei   // 10^18
const centieth = eth/100n
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

### `withdrawETH`

This function shows how to deposit ETH from Ethereum to Optimism.

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
```

There are two wait periods for a withdrawal:

1. Until the status root is written to L1. 
1. The challenge period.

You can read more about this [here](https://community.optimism.io/docs/developers/bridge/messaging/#for-optimism-l2-to-ethereum-l1-transactions).

```js
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response.hash, 
    optimismSDK.MessageStatus.IN_CHALLENGE_PERIOD)
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

Finalizing the message also takes a bit of time.

```js
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
