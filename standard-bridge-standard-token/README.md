# Bridging your Standard ERC20 token to Optimism using the Standard Bridge

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This is a practical guide to getting your ERC20 token deployed on Optimism and bridging it using the
[Standard Bridge implementation](https://community.optimism.io/docs/developers/bridge/standard-bridge.html).

For an L1/L2 token pair to work on the Standard Bridge the L2 token contract has to implement
[`IL2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/IL2StandardERC20.sol). The standard implementation of that is available in
[`L2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/L2StandardERC20.sol) contract as part of the `@eth-optimism/contracts` package.

## Deploying a Standard Token

Deployment script is made available under `scripts/deploy-standard-token.js` that you can use to instantiate `L2StandardERC20` on `optimistic-kovan` or `optimistic-mainnet`.

The hardhat config `hardhat.config.js` is already setup to run against `optimistic-kovan` and `optimistic-mainnet` networks.

### Configuration

See an example config at [.env.example](.env.example); copy into a `.env` file before running.

`PRIVATE_KEY` - this account is going to be used to call the factory and create your L2 ERC20. Remember to fund your account for deployment.
`INFURA_ID` - is your Infura ID for using `optimistic-kovan` and `optimistic-mainnet`.
`L1_TOKEN_ADDRESS` - address of the L1 ERC20 which you want to bridge.
`L2_TOKEN_NAME` and `L2_TOKEN_SYMBOL` properties of the L2 token instance. These are normally the same as the ERC20 properties on L1.

### Running the deploy script

Run the following script

```sh
yarn hardhat run scripts/deploy-standard-token.js --network optimistic-kovan
```

The script uses our token factory contract `OVM_L2StandardTokenFactory` available as a predeploy at `0x4200000000000000000000000000000000000012`

to deploy a standard token on L2. At the end you should get a successful output confirming your token was created and the L2 address e.g.:

`L2StandardERC20 deployed to: 0x5CFE8703A62E3a80ab7233263C074698b722d48b`

# Deploying a Custom Token

When the `L2StandardERC20` implementation does not satisfy your requirements, we can consider allowing a custom implemetation. See this [tutorial on getting a custom token implemented and deployed](../standard-bridge-custom-token/README.md) to Optimistic Ethereum.