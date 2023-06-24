# AttestationStation: Direct contract access

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

The [AttestationStation smart contract](https://github.com/ethereum-optimism/optimism/blob/8b392e9b613ea4ca0270c2dca24d3485b7454954/packages/contracts-periphery/contracts/universal/op-nft/AttestationStation.sol) contains a public `attestations` mapping that anyone can write to and read from. 
For more context on the AttestationStation visit the [overview in our developer documentation](https://community.optimism.io/docs/identity/).
In this tutorial you learn how to read, interpret, and write those attestations.

The contract we'll be using is on the OP Goerli network, at address [`0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77`](https://goerli-explorer.optimism.io/address/0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77).
On OP Mainnet the contract is [at the same address](https://explorer.optimism.io/address/0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77)

## Prerequisites

- You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
- There is network connectivity to a provider on the OP Goerli network, and to the npm package registry.


## Setup

1. Use `yarn` to download the packages you need

   ```sh
   yarn
   ```


1. Copy `.env.example` to `.env` and modify the parameters:

   - `MNEMONIC` is the mnemonic to an account that has enough ETH to pay for the transaction.

   - `ALCHEMY_API_KEY` is the API key for an OP Goerli app on [Alchemy](https://www.alchemy.com/), our preferred provider.

   - `OPTIMISM_GOERLI_URL` is the URL for OP Goerli, if you use [a different node provider](https://community.optimism.io/docs/useful-tools/providers/).


1. Enter the hardhat console:

   ```sh
   yarn hardhat console --network optimism-goerli
   ```


1. Attach to the contract on OP Goerli.
   Note that `0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77` is also the address on OP Mainnet.

   ```js
   AttestationStation = await ethers.getContractFactory("AttestationStation")
   attestationStation = AttestationStation.attach("0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77")
   ```

## Key values

Every attestation has these fields:

- Creator address (who attested this)
- Subject address (who is being attested about)
- Key
- Value

The first two are self-explanatory, and the value can be any number of bytes in whatever format is applicable.
For the key we propose this convention:

1. The raw key is a dot separated value, going from general to specific. For example,
  
   ```
   op.retropgf.szn-2.can-vote
   ```

   Means that the value attested is permission to vote in season 2 of the RetroPGF distribution of The Optimism Foundation.

   Note that there is no need for a central registry of top level names, such as `op.`, because if different addresses attest the same key they do not affect each other.

1. If the raw key is 31 characters long or less, just use it as is.

1. If the raw key is longer than 31 characters, use a different key (one that has the least significant bit turned on so it won't appear to be a regular key).
   For example, the key can be a hash of the raw key, with the least significant byte replaced by `0xFF`.
   To record the raw key, create another attestation with these value:
   
   | Parameter | Value |
   | --------- | ----- |
   | key       | Encoded key |
   | about     | 0 |
   | val       | Raw key |


You can use this function to encode raw keys.

```js
encodeRawKey = rawKey => {
   if (rawKey.length<32) 
      return ethers.utils.formatBytes32String(rawKey)

   const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(rawKey))
   return hash.slice(0,64)+'ff'
}
```

## Write an attestation

1. Create the attestation.
   
   ```js
   goatAddr = '0x00000000000000000000000000000000000060A7'
   attendedKey = encodeRawKey("animalfarm.school.attended")
   attestation = {
       about: goatAddr,
       key: attendedKey,
       val: 1   // for true
   }
   ```


1. Send the attestation.
   Note that `attestationStation.attest` accepts an array as parameter, so you'll be able to attest to many facts in a single transaction.

   ```js
   tx = await attestationStation.attest([attestation])
   rcpt = await tx.wait()
   ```

1. If you want to see the key, you can use the hash to find your transaction on Etherscan (or just [use my transaction](https://goerli-explorer.optimism.io/tx/0x0e77a32b2558f39e60c3e81bd6efd811cf4b3bd80a4f666d042a221ea63c93ab)), click **Click to see More**, and then **View Input As > UTF-8**.

## Read an attestation

To read an attestation you need to know three things:

- Creator address (who attested this)
- Subject address (who is being attested about)
- Key

1. Read the value for the attestation you just created.

   ```js
   creatorAddr = (await ethers.getSigner()).address
   (await attestationStation.attestations(creatorAddr, goatAddr, attendedKey) != '0x')
   ```

1. Check the attestation for a different address to see that the default is false

   ```js
   notGoatAddr = '0x000000000000000000000000000000000000BEEF'
   (await attestationStation.attestations(creatorAddr, notGoatAddr, attendedKey) != '0x')
   ```

1. Read an attestation created by a different user (this one is a grade, so it's a string)

   ```js
   historyKey = encodeRawKey("animal-farm.school.grades.history")
   hex = await attestationStation.attestations('0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F', goatAddr, historyKey)
   ethers.utils.toUtf8String(hex)
   ```

   Note: To create the attestation with an ascii value, and record the raw key to interpret it, I used this data structure:

   ```js
   attestations = [
      {
         about: goatAddr, 
         key: historyKey, 
         val: ethers.utils.toUtf8Bytes("A+")
      },
      {
         about: '0x'.padEnd(42,'0'),
         key: historyKey,
         val: ethers.utils.toUtf8Bytes("animal-farm.school.grades.history")
      }
   ]
   ```


## Read all relevant attestations

If you want to read all the attestations about a specific address, you need to look at the emitted `AttestationCreated` events.

You can do it using [MSilb7's adapter for Flipside Crypto](https://github.com/MSilb7/op_attestationstation_data).
You can also do it using any OP Mainnet node using JavaScript (see below):

1. Create a filter.
   You can filter based on any combination of:

   - Creator address (who attested this)
   - Subject address (who is being attested about)
   - Key
   - Value

   If any value should match the filter, use `null` for it.

   ```js
   aboutGoat = attestationStation.filters.AttestationCreated(null,goatAddr,null,null)
   ```

1. Get all the events.

   ```js
   events = await attestationStation.queryFilter(aboutGoat)
   ```


### Out of date information

One problem with using events is that they may contain out of date information.
For example, look at our goat again, just at key and creator values:

```js
events.map(x => [x.args.key, x.args.creator])
```

The results were (when I wrote this):
```js
[
   [
      '0x616e696d616c6661726d2e7363686f6f6c2e617474656e646564000000000000',
      '0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F'
   ],
   [
      '0x881a8d71a6dabe50856e9c9753e46aaa5c552185e26a834d9111472ebd494aff',
      '0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F'
   ],
   [
      '0x616e696d616c6661726d2e7363686f6f6c2e617474656e646564000000000000',
      '0x8Ff966Ab0DadaDC70C901dD5cDc2C708d3A229AA'
   ],
   [
      '0x616e696d616c6661726d2e7363686f6f6c2e617474656e646564000000000000',
      '0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F'
   ]
]   
```

We see that the same (key, creator) value is specified twice. 
This means two different attestations, and only the latest is still applicable.
We can solve this with a function that only updates data only if it finds newer information.

1. Create a key that includes the two fields we need to check for equality.

   ```js
   event2key = e => `${e.args.key}-${e.args.creator}`
   ```

1. Create a function that updates history unless it finds the history already includes
   newer info.

   ```js
   update2Latest = (history, event) => {
      key = event2key(event)
      if ((history[key] == null) || (history[key].blockNumber < event.blockNumber)) {
         history[key] = event
         return history   // including this event
      }
      return history      // without this event
   } 
   ```

   1. Get the history and transform it back to a list of events.

   ```js
   attestedHistory = events.reduce(update2Latest, {})
   relevantEvents = Object.keys(attestedHistory).map(key => attestedHistory[key])
   ```


## Separating creator, signer, and transaction payer

In some circumstances it is useful for the attestation transactions to be signed by one address, attested by another, and paid for by a third one.
For example, you might want attestations signed by a single EOA (externally owned account) right now, but with the freedom to upgrade to a multisig later while still attesting as the same creator.
Or maybe you want users to pay for their own attestations.

You can achieve this using an [AttestationProxy](contracts/AttestationProxy.sol).
An attestation proxy receives an attestation in a transaction (that could be sent by any account or smart contract), verifies that they are signed by the correct signer, and then attest them. 
Attestations are created by `msg.sender`, so if a smart contract calls `attest` the attestation's creator is the smart contract, not the transaction's origin.

### Seeing it in action

Follow these steps on the console.

1. Deploy `AttestationProxy`:

   ```js
   AttestationProxy = await ethers.getContractFactory("AttestationProxy")
   attestationProxy = await AttestationProxy.deploy(attestationStation.address)
   ```

1. Create an attestation and sign it.

   ```js
   msgHash = ethers.utils.solidityKeccak256(
      ["address", "bytes32", "bytes"],
      [
            goatAddr,
            historyKey,
            ethers.utils.toUtf8Bytes("A+")
      ]
   )
   signer = await ethers.getSigner()
   sig = await signer.signMessage(ethers.utils.arrayify(msgHash))   
   ```

1. Send the attestation to `AttestationProxy`.
   You are able to do it, because as the contract deployer you are the initial owner.

   ```js
   tx = await attestationProxy.attest(goatAddr, historyKey, ethers.utils.toUtf8Bytes("A+"), sig)
   rcpt = await tx.wait()
   ```

1. Make a note of the address of your attestation proxy.   

   ```js
   attestationProxy.address
   ```

1. View the [attestation station contract on OP Goerli](https://goerli-optimism.etherscan.io/address/0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77#internaltx) to see the new attestation.
   Note that it is an *internal* transaction, because `AttestationStation` is called by a contract, `AttestationProxy`, rather than directly.
   Every transaction appears twice because `0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77` is not the "real" AttestationStation contract, it is a proxy to enable upgrades.

1. Click the transaction hash and then the **Logs** tab to see that the creator of the attestation is indeed the proxy address.

1. The mnemonic in `.env` can generate multiple signers.
   From this point, we will use a different signer to show how the signer and payer can be different.
   The first step is to get that signer.

   ```js
   otherSigner = (await ethers.getSigners())[1]
   ```

1. Change signing authority to `otherSigner`.

   ```js
   tx = await attestationProxy.transferOwnership(otherSigner.address)
   rcpt = await tx.wait()
   ```

1. Try to submit an attestation signed by yourself again, see that it now fails.   

   ```js
   tx = await attestationProxy.attest(goatAddr, historyKey, ethers.utils.toUtf8Bytes("A+"), sig)
   ```

1. Get `otherSigner`'s signature and resubmit the transaction. See that it is successful.

   ```js
   sig = await otherSigner.signMessage(ethers.utils.arrayify(msgHash))
   tx = await attestationProxy.attest(goatAddr, historyKey, ethers.utils.toUtf8Bytes("A+"), sig)
   rcpt = await tx.wait()
   ```   

1. Go back to [attestation station contract on OP Goerli](https://goerli-optimism.etherscan.io/address/0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77#internaltx) to see the new attestation.
   Note that it is still the same creator address, because that is the proxy.
  
