# AttestationStation Contract

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

The AttestationStation smart contract contains a public `attestations` mapping that anyone can write to and read from.
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


## Write an attestation

1. Create the attestation.
   
   ```js
   goatAddr = '0x00000000000000000000000000000000000060A7'
   attendedKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("animal-farm.school.attended"))
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

1. Read an attestation created by a different user (this one is a grade, so it's text)

   ```js
   historyKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("animal-farm.school.grades.history"))
   hex = await attestationStation.attestations('0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F', goatAddr, historyKey)
   ethers.utils.toUtf8String(hex)
   ```

   Note: To create the attestation with an ascii value I used this data structure:

   ```js
   attestation = {
      about: goatAddr, 
      key: historyKey, 
      val: ethers.utils.toUtf8Bytes("A+")
   }
   ```
