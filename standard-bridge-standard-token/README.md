# Bridging your Standard ERC20 token to Optimism using the Standard Bridge

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

This is a practical guide to getting your ERC20 token deployed on Optimism and bridging it using the
[Standard Bridge implementation](https://community.optimism.io/docs/developers/bridge/standard-bridge.html).

For an L1/L2 token pair to work on the Standard Bridge the L2 token contract has to implement
[`IL2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/IL2StandardERC20.sol). 


## Deploying a standard token

If there is no need for custom logic on Optimism, it's easiest to use the standard token, available as the
[`L2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/L2StandardERC20.sol) contract as part of the `@eth-optimism/contracts` package. 
The [standard token factory](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/L2/messaging/L2StandardTokenFactory.sol) can deploy the standard contract for you.

You can use the deployment script under [`scripts/deploy-standard-token.js`](scripts/deploy-standard-token.js) to call this token factory. 
The Hardhat config [`hardhat.config.js`](hardhat.config.js) is already setup for both Optimism (the production network) and Optimism Goerli (the testnet).

### Configuration

1. Install the necessary packages.

   ```sh
   yarn
   ```

1. Copy the example configuration to the production one:

   ```sh
   cp .env.example .env
   ```

1. Get an [Alchemy](https://dashboard.alchemyapi.io/) application for Optimism, either Optimism Goerli for testing or Optimism Mainnet for deployment.

1. Edit `.env` to set the deployment parameters:

   - `MNEMONIC`, the mnemonic for an account that has enough ETH for the deployment.
   - `L2_ALCHEMY_KEY`, the key for the alchemy application for the endpoint.
   - `L1_TOKEN_ADDRESS`, the address of the L1 ERC20 which you want to bridge.
     The default value, [`0x32B3b2281717dA83463414af4E8CfB1970E56287`](https://goerli.etherscan.io/address/0x32B3b2281717dA83463414af4E8CfB1970E56287) is a test ERC-20 contract on Goerli that lets you call `faucet` to give yourself test tokens.
   - `L2_TOKEN_NAME` and `L2_TOKEN_SYMBOL` are the parameters for the L2 token contract. 
     In almost all cases, these would be the same as the L1 token name and symbol.

### Running the deploy script

1. Run the script:

   ```sh
   yarn hardhat run scripts/deploy-standard-token.js --network optimism-goerli
   ```

The script uses our token factory contract `OVM_L2StandardTokenFactory` available as a predeploy at `0x4200000000000000000000000000000000000012` to deploy a standard token on L2. 
At the end you should get a successful output with the text for a `data.json` file you'll be able to use to [add the token to the bridge](https://github.com/ethereum-optimism/ethereum-optimism.github.io).
Note that if you have the token both on the test network and the production network you should not use that `data.json` by itself, but combine it the information in the two files. 


### Adding a token to the bridge

You can find the directions to add a token to the bridge [here](https://github.com/ethereum-optimism/ethereum-optimism.github.io).
If you want an empty logo for testing purposes, you can use [this file from Wikipedia](https://commons.wikimedia.org/wiki/File:Sq_blank.svg).

The PR you submit should be similar to [this one](https://github.com/ethereum-optimism/ethereum-optimism.github.io/pull/149).


## Deploying a Custom Token

When the `L2StandardERC20` implementation does not satisfy your requirements, we can consider allowing a custom implemetation. 
See this [tutorial on getting a custom token implemented and deployed](../standard-bridge-custom-token/README.md) to Optimistic Ethereum.

## Testing 

For testing your token, see [tutorial on depositing and withdrawing between L1 and L2](../cross-dom-bridge).

