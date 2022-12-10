# AttestationStation Contract

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

The AttestationStation smart contract contains a public `attestations` mapping that anyone can write to and read from. For more context on the AttestationStation visit the [overview in our developer documentation](https://community.optimism.io/docs/governance/attestation-station/).
In this tutorial you learn how to read, interpret, and write those attestations.

The contract we'll be using is on the Optimism Goerli network, at address [`0x3Ca8c0B5608AE3E4D3b4d29b2699C5fCc0e67f3d`](https://goerli-optimism.etherscan.io/address/0x3Ca8c0B5608AE3E4D3b4d29b2699C5fCc0e67f3d).

## Prerequisites

- You have [Node.js](https://nodejs.org/en/) running on your computer, as well as [yarn](https://classic.yarnpkg.com/lang/en/).
- There is network connectivity to a provider on the Optimism Goerli network, and to the npm package registry.


## Setup

1. Use `yarn` to download the packages you need

   ```sh
   yarn
   ```


1. Copy `.env.example` to `.env` and modify the parameters:

   - `MNEMONIC` is the mnemonic to an account that has enough ETH to pay for the transaction.

   - `ALCHEMY_API_KEY` is the API key for an Optimism Goerli app on [Alchemy](https://www.alchemy.com/), our preferred provider.

   - `OPTIMISM_GOERLI_URL` is the URL for Optimism Goerli, if you use [a different node provider](https://community.optimism.io/docs/useful-tools/providers/).


1. Enter the hardhat console:

   ```sh
   yarn hardhat console --network optimism-goerli
   ```


1. Attach to the contract on the Optimism Goerli network:

   ```js
   AttestationStation = await ethers.getContractFactory("AttestationStation")
   attestationStation = AttestationStation.attach("0x3Ca8c0B5608AE3E4D3b4d29b2699C5fCc0e67f3d")
   ```

## Key values

Every attestation has three fields:

- Creator address (who attested this)
- Subject address (who is being attested about)
- Key

The first two are self-explanatory, but for the key we propose this convention:

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

1. If you want to see the key, you can use the hash to find your transaction on Etherscan (or just [use my transaction](https://goerli-optimism.etherscan.io/tx/0x9b2f821cd9924fa264d053471346e99ffbb125b754f9844e7bbca9723e5c3c0c)), click **Click to see More**, and then **View Input As > UTF-8**.

## Read attestations

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


