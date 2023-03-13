# AttestationStation SDK

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

The [AttestationStation smart contract](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-periphery/contracts/universal/op-nft/AttestationStation.sol) contains a public `attestations` mapping that anyone can write to and read from. 
For more context on the AttestationStation visit the [overview in our developer documentation](https://community.optimism.io/docs/governance/attestation-station/).
In this tutorial you learn how to read, interpret, and write those attestations.

The contract we'll be using is on the Optimism Goerli network, at address [`0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77`](https://goerli-explorer.optimism.io/address/0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77).
On the production Optimism network the contract is [at the same address](https://explorer.optimism.io/address/0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77)

This is one of the methods to access AttestationStation (ATST).
[There are other ways](../README.md).

## Prerequisites

- You have [Node.js](https://nodejs.org/en/) running on your computer.
- There is network connectivity to a provider on the Optimism Goerli network, and to the npm package registry.


## Running the app

1. Use `npm` to download the packages you need

   ```sh
   npm install
   ```


1. Copy `.env.example` to `.env` and modify the parameters:

   - `PRIVATE_KEY`: Private key to an account that has enough ETH to pay for writing a new attestation.
   - `ALCHEMY_API_KEY`: API key for [Alchemy](../../alchemy/).
     Alchemy are our preferred RPC provider, but you can use others - you'll just need to change a few lines of code.

1. Run the application.

  ```bash
  node index.mjs
  ```


## How it works

```javascript
#! /usr/local/bin/node

// Read .env
import dotenv from "dotenv"
dotenv.config()
```

This part uses [`dotenv`](https://www.npmjs.com/package/dotenv) to read the private key and Optimism Goerli URL.

```js
import ethers from "ethers"
const wagmiCore = await import("@wagmi/core")
const wagmiAlchemy = await import("@wagmi/core/providers/alchemy")
const wagmiChains = await import("@wagmi/core/chains")
const atst = await import("@eth-optimism/atst")
```

Import the libraries we need. 
The SDK is build on top of [wagmi](https://wagmi.sh/).
While the wagmi library was originally built for use with React, the core functionality (available in [`@wagmi/core`](https://www.npmjs.com/package/@wagmi/core)) can work inside any JavaScript engine, such as Node, without requiring it.

If you need to use a different RPC provider than Alchemy, [import that provider](https://wagmi.sh/core/providers/configuring-chains).


```js
const { chains, provider, webSocketProvider } = wagmiCore.configureChains(
  [wagmiChains.optimismGoerli],
  [wagmiAlchemy.alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY })],
)
```

This is how you create a [wagmi provider](https://wagmi.sh/core/providers/jsonRpc).
To use the Optimism production network, you'd use `wagmiChains.optimism` here.
[See here](https://wagmi.sh/core/chains#supported-chains) to the list of supported chains.


```js
const setup = () => {
  wagmiCore.createClient({
    provider,
    webSocketProvider
  })
}   // end of setup
```

This function sets up [the wagmi client](https://wagmi.sh/core/client).
Note that this client is a [singleton](https://en.wikipedia.org/wiki/Singleton_pattern), which is why it is not necessary to specify which one we're using later.

This level of connection is sufficient for calling [`view`](https://www.tutorialspoint.com/solidity/solidity_view_functions.htm) functions.

```js
// \/  Definitions only required for writing attestations  \/

const wagmiCoreMock = import("@wagmi/core/connectors/mock")
```

When wagmi runs inside a browser, it can use the wallet to prompt the user to sign transactions (using an entity called [`connector`](https://wagmi.sh/examples/connect-wallet)). 
However, this example runs inside Node, which is a server. 
There is no user to prompt for signing transactions.
Therefore, to submit transactions (which is necessary to write attestations), we use a [mock connector](https://wagmi.sh/core/connectors/mock) that has a private key.

If you are going to use `atst` in client-side code to write attestations, use a different connector, probably through [RainbowKit](https://www.rainbowkit.com/docs/installation#configure) or [ConnectKit](https://docs.family.co/connectkit).

```js
const writeSetup = async () => {

  // Connect the client to a mock connector
  await wagmiCore.connect({
    // MockConnector is used for server processes when there is no
    // user wallet
    connector: new wagmiCoreMock.MockConnector({
      options: {
        chainId: wagmiChains.optimismGoerli.id,
        signer: new ethers.Wallet(process.env.PRIVATE_KEY, 
          provider(wagmiChains.optimismGoerli)
```

A wagmi provider is a function, what gives you [an Ethers `Provider`](https://docs.ethers.org/v5/api/providers/provider/) when you give it the chain you want. 

```js          
        ),
      },
    }),   // end of new wagmiCoreMock.MockConnector
  })   // end of wagmiCore.connect

}  // end of writeSetup

//  /\  Definitions only required for writing attestations /\


const main = async () => {

    setup()
    await writeSetup()
```

To write an attestation we need both setups.

```js
    
    const readCreatorAddr = "0xc2dfa7205088179a8644b9fdcecd6d9bed854cfe"
    const aboutAddr = "0x00000000000000000000000000000000000060A7"
    const key = "animalfarm.school.GPA"

    // Read an attestation
    const val = await atst.readAttestationString(
        readCreatorAddr,
        aboutAddr,
        key)   
```

Read an attesation.
The SDK lets you specify what data type you're expecting, and converts the value to that type for you.
The supported data types are:

- `string` (default)
- `bytes` 
- `number`, which is an integer
- `bool`
- `address`

You can also specify as an additional parameter the contract address if you are not using the default.

```js
    
    console.log(`According to ${readCreatorAddr} the ${key} for ${aboutAddr} is ${val}`)
    
    console.log(`--------------`)
```

```js     
    const preparedTx = await atst.prepareWriteAttestation(
      "0x00000000000000000000000000000000000060A7",  // about
      "animalfarm.school.GPA",                       // key
      "3.25",                                        // value
    )
```

The way wagmi works, you first [prepare a transaction](https://wagmi.sh/react/prepare-hooks) and then send it.
One advantage of this approach is that the prepared transaction already includes, for example, the gas cost of the transaction (although note that on Optimism that is the tiny [L2 execution fee](https://community.optimism.io/docs/developers/build/transaction-fees/#the-l2-execution-fee), not the much larger [L1 data fee](https://community.optimism.io/docs/developers/build/transaction-fees/#the-l1-data-fee)).

Another advantage is user responsiveness.
Preparing a transaction requires a gas estimate, which is provided by a network node.
That is a relatively long procedure, which takes place before the user is prompted to sign the transaction.
By preparing the transaction in advance we can show the wallet's transaction signing window immediately.

```js
    // const txReq = preparedTx.request
```

You can use the information in `preparedTx.request` to [estimate the total cost of the transaction (L2 execution fee and L1 data fee)](../../../sdk-estimate-gas/).

```js
    const tx = await atst.writeAttestation(preparedTx)
    const rcpt = await tx.wait()
    console.log(`Attestation written:`)
    console.log(`https://goerli-explorer.optimism.io/tx/${rcpt.transactionHash}`)
}
```
   
Here we actually send the transaction, wait for it to be received, and point the user to the transaction on a block explorer.

```js
    console.log(`---------------`)
    
    const events = await atst.getEvents({
      creator: null,    // any creator
      about: aboutAddr, // Only 0x0...060A7
      key: null,        // any key
      key: null,        // any value
      provider: provider(wagmiChains.optimismGoerli),
      // fromBlockOrBlockhash?: ethers.providers.BlockTag | undefined
      // toBlock?: ethers.providers.BlockTag | undefined
    })
``` 

You can use `getEvents` to search for attestations based on specific criteria.
Note that as this function uses the `eth_getLogs` RPC, it is subject to some limitations:

1. It is limited (on Alchemy) to 10k attestations.
   [See here for more information](https://docs.alchemy.com/reference/sdk-getlogs).

1. It returns all events that match the filter, including those that since been superceded (attestations can be overwritten).
   [See here for how to remove overwritten attestations](../contract-access/README.md#out-of-date-information).



## Conclusion

In many cases you will use the JavaScript SDK for a user interface, and [this is best done through the app starter](https://github.com/ethereum-optimism/optimism-starter).
However, hopefully this tutorial helped you get started with attestations. 
If you need more information, see the [SDK documentation](https://github.com/ethereum-optimism/optimism/blob/develop/packages/atst/docs/sdk.md).

Now, write the killer app that will wow the whole world.