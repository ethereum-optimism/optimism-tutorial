# Social Contract

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

The Social Contract smart contract contains a public `attestations` mapping that anyone can write to and read from.
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
   SocialContract = await ethers.getContractFactory("SocialContract")
   socialContract = SocialContract.attach("0x3Ca8c0B5608AE3E4D3b4d29b2699C5fCc0e67f3d")
   ```


## Write an attestation

1. Create the attestation.
   
   ```js
   goatAddr = '0x00000000000000000000000000000000000060A7'
   educationKey = ethers.utils.formatBytes32String("education")
   attestation = {
       about: goatAddr,
       key: educationKey,
       val: ethers.utils.toUtf8Bytes("Ate a geometry textbook")
   }
   ```


1. Send the attestation.
   Note that `socialContract.attest` accepts an array as parameter, so you'll be able to attest to many facts in a single transaction.

   ```js
   tx = await socialContract.attest([attestation])
   rcpt = await tx.wait()
   ```


## Read attestations

To read an attestation you need to know three things:

- Creator address (who attested this)
- Subject address (who is being attested about)
- Key

1. Read the hex value for the attestation you just created:

   ```js
   creatorAddr = (await ethers.getSigner()).address
   hex = await socialContract.attestations(creatorAddr, goatAddr, educationKey)
   ```

1. Convert to a readable string:

   ```js
   ethers.utils.toUtf8String(hex)
   ```

1. Read an attestation created by a different user.

   ```js
   hex = await socialContract.attestations('0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F', goatAddr, educationKey)
   ethers.utils.toUtf8String(hex)
   ```
