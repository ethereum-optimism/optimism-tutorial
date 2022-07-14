# Bridging your Custom ERC20 token to Optimism using the Standard Bridge

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This is a practical guide to customising the [`L2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/L2StandardERC20.sol) implementation for use on the [Standard Bridge infrastructure](https://community.optimism.io/docs/developers/bridge/standard-bridge.html).

For an L1/L2 token pair to work on the Standard Bridge the L2 token contract must implement
[`IL2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/IL2StandardERC20.sol) interface. The standard implementation of that is available in
[`L2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/L2StandardERC20.sol) contract as part of the `@eth-optimism/contracts` package, see [detailed instructions](../standard-bridge-standard-token/README.md) on using that as your L2 token.

## Customizing the `L2StandardERC20` implementation

Our example here implements a custom token [`L2CustomERC20`](contracts/L2CustomERC20.sol) based on the `L2StandardERC20` but with `8` decimal points, rather than `18`.

For the purpose we import the `L2StandardERC20` from the `@eth-optimism/contracts` package. This standard token implementation is based on the OpenZeppelin ERC20 contract and implements the required `IL2StandardERC20` interface.

```
import { L2StandardERC20 } from "@eth-optimism/contracts/standards/L2StandardERC20.sol";
```

Then the only thing we need to do is call the internal `_setupDecimals(8)` method to alter the token `decimals` property from the default `18` to `8`.

## Deploying the Custom Token

Deployment script is made available under `scripts/deploy-custom-token.js` that you can use to instantiate `L2CustomERC20` either on a local dev node or on `optimistic-kovan`.

Once you're ready with a tested kovan deployment, you can request a review via
[this](https://docs.google.com/forms/d/e/1FAIpQLSdKyXpXY1C4caWD3baQBK1dPjEboOJ9dpj9flc-ursqq8KU0w/viewform) form and we'll consider whitelisting your deployer address on `optimistic-mainnet`.

The hardhat config `hardhat.config.js` is already setup to run against `optimistic-kovan` and `optimistic-mainnet` networks.

### Configuration

See an example config at [.env.example](.env.example); copy into a `.env` file before running.

`PRIVATE_KEY` - this account is going to be used to call the factory and create your L2 ERC20. Remember to fund your account for deployment.
`INFURA_ID` - is your Infura ID for using `optimistic-kovan` and `optimistic-mainnet`.
`L1_TOKEN_ADDRESS` - address of the L1 ERC20 which you want to bridge.

### Running the deploy script

Run the following script

```sh
yarn hardhat run scripts/deploy-custom-token.js --network optimistic-kovan
```

At the end you should get a successful output confirming your token was created and the L2 address:

`L2CustomERC20 deployed to: 0x5CFE8703A62E3a80ab7233263C074698b722d48b`

For testing your token, see [tutorial on depositing and withdrawing between L1 and L2](../cross-dom-bridge).
