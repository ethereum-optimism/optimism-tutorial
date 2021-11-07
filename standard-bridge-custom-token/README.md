# Bridging your Custom ERC20 token to Optimism using the Standard Bridge

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This is a practical guide to customising the [`L2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/optimistic-ethereum/libraries/standards/L2StandardERC20.sol) implementation for use on the [Standard Bridge infrastructure](https://community.optimism.io/docs/developers/bridge/standard-bridge.html).

For an L1/L2 token pair to work on the Standard Bridge the L2 token contract must implement [`IL2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/optimistic-ethereum/libraries/standards/IL2StandardERC20.sol) interface. The standard implementation of that is available in[`L2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/optimistic-ethereum/libraries/standards/L2StandardERC20.sol) contract as part of the `@eth-optimism/contracts` package, see [detailed instructions](../standard-bridge-standard-token/README.md) on using that as your L2 token.

## Customizing the `L2StandardERC20` implementation

Our example here implements a custom token [`L2CustomERC20`](contracts/L2CustomERC20.sol) based on the `L2StandardERC20` but which overrides the `decimals` function to return 9 instead of 18. 

For the purpose we import the `L2StandardERC20` from the `@eth-optimism/contracts` package. This standard token implementation is based on the OpenZeppelin ERC20 contract and implements the required `IL2StandardERC20` interface.

```
import { L2StandardERC20 } from "@eth-optimism/contracts/libraries/standards/L2StandardERC20.sol";
```

Then the only thing we need to do is call the internal `_mint` method to give the deployer the additional tokens.

## Deploying the Custom Token

The deployment script is available under `scripts/deploy-custom-token.js` that you can use to instantiate `L2CustomERC20` either on a local dev node (`optimistic-devnode`) or on `optimistic-kovan`.

Once you're ready with a tested kovan deployment, you can request a review via [this form](https://docs.google.com/forms/d/e/1FAIpQLSdKyXpXY1C4caWD3baQBK1dPjEboOJ9dpj9flc-ursqq8KU0w/viewform) form and we'll consider whitelisting your deployer address on `optimistic-mainnet`.

### Prerequisites

You should already have a Hardhat development environment, as explained in [the tutorial](../hardhat).

### The Configuration File

The hardhat config here `hardhat.config.js` is already setup to run against local dev environment, `optimistic-kovan`, and `optimistic-mainnet` networks.

### The .env File

To use a network (either Optimistic Kovan or Optimistic Ethereum), create an .env file in the root of `standard-bridge-standard-token` folder with these settings:

- `PRIVATE_KEY` is the account is going to be used for the script, on both L1 and L2. Remember to fund it.
- `INFURA_ID` is your Infura ID for using `optimistic-kovan` and `optimistic-mainnet`.



### Running the deploy script

Run the following script

```sh
git clone https://github.com/ethereum-optimism/optimism-tutorial.git
cd optimism-tutorial/standard-bridge-custom-token
yarn
yarn hardhat run scripts/deploy-custom-token.js --network optimistic-devnode
```

The `deploy-custom-token.js` script performs these actions:

1. Deploy an ERC-20 contract on L1. If you want to use an existing ERC-20 contract, modify the `makeL1Token` function.
1. Deploy `L2CustomERC20` to create the L2 ERC-20 token.
1. Verify the new contract connects to the correct L1 address.
1. Deposit tokens from L1 to L2.
1. Display the token balances for the user on L1 and L2, and the bridge on L1, to see that the new contract works and approximately how long it takes to deposit the tokens.
