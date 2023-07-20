# Bridging ERC-20 tokens with the Optimism SDK

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This tutorial teaches you how to use the [Optimism SDK](https://sdk.optimism.io/) to transfer ERC-20 tokens between Layer 1 (Ethereum or Goerli) and Layer 2 (OP Mainnet or OP Goerli).
While you *could* use [the bridge contracts](https://community.optimism.io/docs/developers/bridge/standard-bridge/) directly, a [simple usage error](https://community.optimism.io/docs/developers/bridge/standard-bridge/#depositing-erc20s) can cause you to lock tokens in the bridge forever and lose their value. 
The SDK provides transparent safety rails to prevent that mistake.

The SDK supports multiple OP Chains: OP, Base, etc.
To see whether a specific OP Chain is supported directly, [see the documentation](https://sdk.optimism.io/enums/l2chainid).
Chains that aren't officially supported just take a few extra steps.
Get the L1 contract addresses, and [provide them to the SDK](https://stack.optimism.io/docs/build/sdk/#contract-addresses).
Once you do that, you can use the SDK normally.

**Warning:** The standard bridge does *not* support certain ERC-20 configurations:

- [Fee on transfer tokens](https://github.com/d-xo/weird-erc20#fee-on-transfer)
- [Tokens that modify balances without emitting a Transfer event](https://github.com/d-xo/weird-erc20#balance-modifications-outside-of-transfers-rebasingairdrops)


## Setup

1. Ensure your computer has:
   - [`git`](https://git-scm.com/downloads)
   - [`node`](https://nodejs.org/en/)

1. Clone this repository and enter it.

   ```sh
   git clone https://github.com/ethereum-optimism/optimism-tutorial.git
   cd optimism-tutorial/cross-dom-bridge-erc20
   ```

1. Install the necessary packages.

   ```sh
   yarn
   ```

1. Go to [Alchemy](https://www.alchemy.com/) and create two applications:

   - An application on Goerli
   - An application on OP Goerli

   Keep a copy of the two keys.

1. Copy `.env.example` to `.env` and edit it:

   1. Set `MNEMONIC` to point to an account that has ETH on the Goerli test network and the OP Goerli test network.
   1. Set `GOERLI_ALCHEMY_KEY` to the key for the Goerli app.
   1. Set `OP_GOERLI_ALCHEMY_KEY` to the key for the Optimistic Goerli app

   [This faucet gives ETH on the Goerli network](https://faucet.paradigm.xyz/). [This faucet gives ETH on the OP Goerli network](https://optimismfaucet.xyz/).


## Run the sample code

The sample code is in `index.js`, execute it.
After you execute it, wait. It is not unusual for each operation to take minutes on Goerli.
On the production network the withdrawals take around a week each, because of the [challenge period](https://community.optimism.io/docs/developers/bridge/messaging/#understanding-the-challenge-period).

### Expected output

The output from the script should be similar to:

```
Deposit ERC20
OUTb on L1:     OUTb on L2:
You don't have enough OUTb on L1. Let's call the faucet to fix that
Faucet tx: 0xccf8a2b4cc9009f78975c761f5b156f4dd02574af51310bb0fb9627dbe900510
	More info: https://goerli.etherscan.io/tx/0xccf8a2b4cc9009f78975c761f5b156f4dd02574af51310bb0fb9627dbe900510
New L1 OUTb balance: 1000
Allowance given by tx 0xe3c08d2dbed75f16f0eb9681d5b29971e76f831f0370175b1100a4d28b2940e1
	More info: https://goerli.etherscan.io/tx/0xe3c08d2dbed75f16f0eb9681d5b29971e76f831f0370175b1100a4d28b2940e1
Time so far 11.819 seconds
Deposit transaction hash (on L1): 0xb03a4e53aa7f237ff9a1feac59f56aa683a5c6f8f0f491597b0286ff8553925e
	More info: https://goerli.etherscan.io/tx/0xb03a4e53aa7f237ff9a1feac59f56aa683a5c6f8f0f491597b0286ff8553925e
Waiting for status to change to RELAYED
Time so far 21.561 seconds
OUTb on L1:999     OUTb on L2:1
depositERC20 took 179.776 seconds


Withdraw ERC20
OUTb on L1:999     OUTb on L2:1
Transaction hash (on L2): 0x30758c4550035687ef13f4b1211fac9683847a9b1fab5902f6d4caf8642c4973
	For more information: https://goerli-optimism.etherscan.io/tx/0x30758c4550035687ef13f4b1211fac9683847a9b1fab5902f6d4caf8642c4973
Waiting for status to be READY_TO_PROVE
Time so far 8.223 seconds
Time so far 313.661 seconds
In the challenge period, waiting for status READY_FOR_RELAY
Time so far 317.002 seconds
Ready for relay, finalizing message now
Time so far 339.851 seconds
Waiting for status to change to RELAYED
Time so far 342.437 seconds
OUTb on L1:1000     OUTb on L2:
withdrawERC20 took 351.272 seconds
```

As you can see, the total running time is about six minutes.
It could be longer.


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
const l2Url = `https://opt-goerli.g.alchemy.com/v2/${process.env.OP_GOERLI_KEY}`
```

Configuration, read from `.env`.


```js
// Contract addresses for OPTb tokens, taken
// from https://github.com/ethereum-optimism/ethereum-optimism.github.io/blob/master/data/OUTb/data.json
const erc20Addrs = {
  l1Addr: "0x32B3b2281717dA83463414af4E8CfB1970E56287",
  l2Addr: "0x3e7eF8f50246f725885102E8238CBba33F276747"
}    // erc20Addrs
```

The addresses of the ERC-20 token on L1 and L2.

```js
// Global variable because we need them almost everywhere
let crossChainMessenger
let l1ERC20, l2ERC20    // OUTb contracts to show ERC-20 transfers
let ourAddr   // Our address
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

### `erc20ABI`

A fragment of the ABI with the functions we need to call directly.


```js
const erc20ABI = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
```

This is `balanceOf` from the ERC-20 standard, used to get the balance of an address. 

```js
  // faucet
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }  
]    // erc20ABI
```

This is `faucet`, a function supported by the L1 contract, which gives the caller a thousand tokens.
Technically speaking we should have two ABIs, because the L2 contract does not have `faucet`, but that would be a needless complication in this case when we can just avoid trying to call it.


### `setup`

This function sets up the parameters we need for transfers.

```js
const setup = async() => {
  const [l1Signer, l2Signer] = await getSigners()
  ourAddr= l1Signer.address
```

Get the signers we need, and our address.

```js
  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: 5,    // Goerli value, 1 for mainnet
      l2ChainId: 420,  // OP Goerli value, 10 for mainnet
      l1SignerOrProvider: l1Signer,
      l2SignerOrProvider: l2Signer,
  })
```

Create the [`CrossChainMessenger`](https://sdk.optimism.io/classes/crosschainmessenger) object that we use to transfer assets.


```js
  l1ERC20 = new ethers.Contract(erc20Addrs.l1Addr, erc20ABI, l1Signer)
  l2ERC20 = new ethers.Contract(erc20Addrs.l2Addr, erc20ABI, l2Signer)
}    // setup
```

The ERC20 contracts, one per layer.


```

### `reportERC20Balances`

This function reports the ERC-20 balances of the address on both layers.

```js
const reportERC20Balances = async () => {
  const l1Balance = (await l1ERC20.balanceOf(addr)).toString().slice(0,-18)
  const l2Balance = (await l2ERC20.balanceOf(addr)).toString().slice(0,-18)
  console.log(`OUTb on L1:${l1Balance}     OUTb on L2:${l2Balance}`)
```

Get the balances.

```js
  if (l1Balance != 0)
    return
```

If the L1 balance isn't zero, return - there is nothing we need to do.
Otherwise, call `l1ERC20.faucet()` to get the user `OUTb` tokens to deposit and withdraw through the bridge.

```js
  console.log(`You don't have enough OUTb on L1. Let's call the faucet to fix that`)
  const tx = (await l1ERC20.faucet())
  console.log(`Faucet tx: ${tx.hash}`)
  console.log(`\tMore info: https://goerli.etherscan.io/tx/${tx.hash}`)
  await tx.wait()
  const newBalance = (await l1ERC20.balanceOf(addr)).toString().slice(0,-18)
  console.log(`New L1 OUTb balance: ${newBalance}`)
}    // reportERC20Balances
```


### `depositERC20`

This function shows how to deposit an ERC-20 token from Ethereum to OP Mainnet (or from Goerli to OP Goerli).

```js
const oneToken = 1000000000000000000n
```

`OUTb` tokens are divided into $10^18$ basic units, same as ETH divided into wei. 

```js
const depositERC20 = async () => {

  console.log("Deposit ERC20")
  await reportERC20Balances()
```

To show that the deposit actually happened we show before and after balances.

```js  
  const start = new Date()

  // Need the l2 address to know which bridge is responsible
  const allowanceResponse = await crossChainMessenger.approveERC20(
    erc20Addrs.l1Addr, erc20Addrs.l2Addr, oneToken)
```

To enable the bridge to transfer ERC-20 tokens, it needs to get an allowance first.
The reason to use the SDK here is that it looks up the bridge address for us.
While most ERC-20 tokens go through the standard bridge, a few require custom business logic that has to be written into the bridge itself.
In those cases there is a custom bridge contract that needs to get the allowance. 

```js
  await allowanceResponse.wait()
  console.log(`Allowance given by tx ${allowanceResponse.hash}`)
  console.log(`\tMore info: https://goerli.etherscan.io/tx/${allowanceResponse.hash}`)
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)
```

Wait until the allowance transaction is processed and then report the time it took and the hash.

```js
  const response = await crossChainMessenger.depositERC20(
    erc20Addrs.l1Addr, erc20Addrs.l2Addr, oneToken)
```

[`crossChainMessenger.depositERC20()`](https://sdk.optimism.io/classes/crosschainmessenger#depositERC20-2) creates and sends the deposit trasaction on L1.

```js
  console.log(`Deposit transaction hash (on L1): ${response.hash}`)
  console.log(`\tMore info: https://goerli.etherscan.io/tx/${response.hash}`)
  await response.wait()
```

Of course, it takes time for the transaction to actually be processed on L1.

```js
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)
  await crossChainMessenger.waitForMessageStatus(response.hash,
                                                  optimismSDK.MessageStatus.RELAYED)
```

After the transaction is processed on L1 it needs to be picked up by an offchain service and relayed to L2. 
To show that the deposit actually happened we need to wait until the message is relayed. 
The [`waitForMessageStatus`](https://sdk.optimism.io/classes/crosschainmessenger#waitForMessageStatus) function does this for us.
[Here are the statuses we can specify](https://sdk.optimism.io/enums/messagestatus).

The third parameter (which is optional) is a hashed array of options:
- `pollIntervalMs`: The poll interval
- `timeoutMs`: Maximum time to wait

```js
  await reportERC20Balances()
  console.log(`depositERC20 took ${(new Date()-start)/1000} seconds\n\n`)
}     // depositERC20()
```

Once the message is relayed the balance change on OP Mainnet (or OP Goerli) is practically instantaneous.
We can just report the balances and see that the L2 balance rose by 1 gwei.

### `withdrawERC20`

This function shows how to withdraw ERC-20 from OP Mainnet to Ethereum (or OP Goerli to Goerli).
The withdrawal process has these stages:

1. Submit the withdrawal transaction on OP Mainnet (or OP Goerli).
1. Wait until the state root with the withdrawal is published (and the status changes to `optimismSDK.MessageStatus.READY_TO_PROVE`).
1. Submit the proof on L1 using `crossChainMessenger.proveMessage()`.
1. Wait the fault challenge period. 
   When this period is over, the status becomes `optimismSDK.MessageStatus.READY_FOR_RELAY`
1. Finalize to cause the actual withdrawal on L1 using `crossChainMessenger.finalizeMessage()`.

[You can read more about this in the documentation](https://community.optimism.io/docs/developers/bedrock/how-is-bedrock-different/#two-phase-withdrawals).

```js
const withdrawERC20 = async () => {

  console.log("Withdraw ERC20")
  const start = new Date()
  await reportERC20Balances()
```

We want users to see their balances, and how long the withdrawal is taking.

```js
  const response = await crossChainMessenger.withdrawERC20(
    erc20Addrs.l1Addr, erc20Addrs.l2Addr, oneToken)
  console.log(`Transaction hash (on L2): ${response.hash}`)
  console.log(`\tFor more information: https://goerli-optimism.etherscan.io/tx/${response.hash}`)
  await response.wait()
```

This is the initial withdrawal transaction on OP Goerli (it would look the same on OP Mainnet).

```js
  console.log("Waiting for status to be READY_TO_PROVE")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)
  await crossChainMessenger.waitForMessageStatus(response.hash, 
    optimismSDK.MessageStatus.READY_TO_PROVE)
```

The Merkle proof has to be submitted after the state root is written on L1.
On Goerli we usually submit a new state root every four minutes.
When the state root is updated, you see a new transaction [on the L2OutputOracle contract](https://goerli.etherscan.io/address/0xE6Dfba0953616Bacab0c9A8ecb3a9BBa77FC15c0).

```js
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.proveMessage(response.hash)
```

Submit the Merkle proof, starting the challenge period.

```js
  console.log("In the challenge period, waiting for status READY_FOR_RELAY") 
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response.hash, 
                                                optimismSDK.MessageStatus.READY_FOR_RELAY)
```

Wait the challenge period.
On Goerli the challenge period is very short (a few seconds) to speed up debugging.
On the production network it is seven days for security.

```js
  console.log("Ready for relay, finalizing message now")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.finalizeMessage(response.hash)
```

Finalize the withdrawal and actually get back the token.

```js
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response, 
    optimismSDK.MessageStatus.RELAYED)
  await reportERC20Balances()   
  console.log(`withdrawERC20 took ${(new Date()-start)/1000} seconds\n\n\n`)  
}     // withdrawERC20()
```

Wait for the message status to change to `optimismSDK.MessageStatus.RELAYED`, at which time the tokens are finally withdrawn.

### `main`

A `main` to run the setup followed by both operations.

```js
const main = async () => {
    await setup()
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

You should now be able to write applications that use our SDK and bridge to transfer ERC-20 assets between layer 1 and layer 2. 

Note that for withdrawals of a commonly used ERC-20 token (or ETH) you would probably want to use a [third party bridge](https://www.optimism.io/apps/bridges) for higher speed and lower cost.
Here is the API documentation for some of those bridges:

* [Hop](https://docs.hop.exchange/js-sdk/getting-started)
* [Synapse](https://docs.synapseprotocol.com/bridge-sdk/sdk-reference/bridge-synapsebridge)
* [Across](https://docs.across.to/bridge/developers/across-sdk)
* [Celer Bridge](https://cbridge-docs.celer.network/developer/cbridge-sdk)
