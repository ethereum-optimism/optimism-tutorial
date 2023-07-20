# Bridging your Custom ERC20 token to OP Mainnet using the Standard Bridge

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)


For an L1/L2 token pair to work on the Standard Bridge, there has to be a layer of original mint (where the minting and burning of tokens is controlled by the business logic), and a bridged layer where the Standard Bridge controls minting and burning.
The most common configuration is to have L1 as the layer of original mint, and L2 as the bridged layer, this allows for ERC-20 contracts that were written with no knowledge of OP Mainnet to be bridged.
The contract on the bridged layer has to implement either the legacy [`IL2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/8b392e9b613ea4ca0270c2dca24d3485b7454954/packages/contracts/contracts/standards/IL2StandardERC20.sol) interface (only if the bridged layer is L2) or the new [`IOptimismMintableERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/contracts/universal/IOptimismMintableERC20.sol) interface. 

For this to be done securely, the *only* entity that is allowed to mint and burn tokens on the bridged layer has to be the Standard Bridge, to ensure that the tokens on the bridged layer are backed up by real tokens on the layer of original mint. 
It is also necessary that the ERC-20 token contract on the layer of original mint *not* implement either of the interfaces, to make sure the bridge contracts don't get confused and think it is the bridged layer.

**Warning:** The standard bridge does *not* support certain ERC-20 configurations:

- [Fee on transfer tokens](https://github.com/d-xo/weird-erc20#fee-on-transfer)
- [Tokens that modify balances without emitting a Transfer event](https://github.com/d-xo/weird-erc20#balance-modifications-outside-of-transfers-rebasingairdrops)

## Customizing the `L2StandardERC20` implementation

Our example here implements a custom token [`L2CustomERC20`](contracts/L2CustomERC20.sol) based on the `L2StandardERC20` but with `8` decimal points, rather than `18`.

For the purpose we import the `L2StandardERC20` from the `@eth-optimism/contracts` package. This standard token implementation is based on the OpenZeppelin ERC20 contract and implements the required `IL2StandardERC20` interface.

```
import { L2StandardERC20 } from "@eth-optimism/contracts/standards/L2StandardERC20.sol";
```

Then the only thing we need to do is call the internal `_setupDecimals(8)` method to alter the token `decimals` property from the default `18` to `8`.

## Deploying the custom token

1. Download the necessary packages.

   ```sh
   yarn
   ```

1. Copy `.env.example` to `.env`.

   ```sh
   cp .env.example .env
   ```

1. Edit `.env` to set the deployment parameters:

   - `MNEMONIC`, the mnemonic for an account that has enough ETH for the deployment.
   - `L1_ALCHEMY_KEY`, the key for the alchemy application for a Goerli endpoint.   
   - `L2_ALCHEMY_KEY`, the key for the alchemy application for an OP Goerli endpoint.
   - `L1_TOKEN_ADDRESS`, the address of the L1 ERC20 which you want to bridge.
     The default value, [`0x32B3b2281717dA83463414af4E8CfB1970E56287`](https://goerli.etherscan.io/address/0x32B3b2281717dA83463414af4E8CfB1970E56287) is a test ERC-20 contract on Goerli that lets you call `faucet` to give yourself test tokens.

1. Open the hardhat console.

   ```sh
   yarn hardhat console --network optimism-goerli
   ```

1. Deploy the contract.

   ```sh
   l2CustomERC20Factory = await ethers.getContractFactory("L2CustomERC20")   
   l2CustomERC20 = await l2CustomERC20Factory.deploy(
      "0x4200000000000000000000000000000000000010",
      process.env.L1_TOKEN_ADDRESS)
   ```

## Transferring tokens 

1. Get the token addresses.

   ```js
   l1Addr = process.env.L1_TOKEN_ADDRESS
   l2Addr = l2CustomERC20.address
   ```

### Get setup for L1 (provider, wallet, tokens, etc)

1. Get the L1 wallet.

   ```js
   l1Url = `https://eth-goerli.g.alchemy.com/v2/${process.env.L1_ALCHEMY_KEY}`
   l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)
   hdNode = ethers.utils.HDNode.fromMnemonic(process.env.MNEMONIC)
   privateKey = hdNode.derivePath(ethers.utils.defaultPath).privateKey
   l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider)
   ```

1. Get the L1 contract.

   ```js
   l1Factory = await ethers.getContractFactory("OptimismUselessToken")
   l1Contract = new ethers.Contract(process.env.L1_TOKEN_ADDRESS, l1Factory.interface, l1Wallet)
   ```

1. Get tokens on L1 (and verify the balance)

   ```js
   tx = await l1Contract.faucet()
   rcpt = await tx.wait()
   await l1Contract.balanceOf(l1Wallet.address)
   ```


### Transfer tokens

Create and use [`CrossDomainMessenger`](https://sdk.optimism.io/classes/crosschainmessenger) (the Optimism SDK object used to bridge assets).
The SDK supports multiple OP Chains: OP, Base, etc.
To see whether a specific OP Chain is supported directly, [see the documentation](https://sdk.optimism.io/enums/l2chainid).
Chains that aren't officially supported just take a few extra steps.
Get the L1 contract addresses, and [provide them to the SDK](https://stack.optimism.io/docs/build/sdk/#contract-addresses).
Once you do that, you can use the SDK normally.

1. Import the Optimism SDK.

   ```js
   const optimismSDK = require("@eth-optimism/sdk")
   ```

1. Create the cross domain messenger.

   ```js
   l1ChainId = (await l1RpcProvider.getNetwork()).chainId
   l2ChainId = (await ethers.provider.getNetwork()).chainId
   l2Wallet = await ethers.provider.getSigner()
   crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: l1ChainId,
      l2ChainId: l2ChainId,
      l1SignerOrProvider: l1Wallet,
      l2SignerOrProvider: l2Wallet,
   })
   ```

#### Deposit (from Goerli to OP Goerli, or Ethereum or OP Mainnet)

1. Give the L2 bridge an allowance to use the user's token.
   The L2 address is necessary to know which bridge is responsible and needs the allowance.

   ```js
   depositTx1 = await crossChainMessenger.approveERC20(l1Contract.address, l2Addr, 1e9)
   await depositTx1.wait()
   ```

1. Check your balances on L1 and L2.

   ```js
   await l1Contract.balanceOf(l1Wallet.address) 
   await l2CustomERC20.balanceOf(l1Wallet.address)
   ```   

1. Do the actual deposit

   ```js
   depositTx2 = await crossChainMessenger.depositERC20(l1Contract.address, l2Addr, 1e9)
   await depositTx2.wait()
   ```

1. Wait for the deposit to be relayed.

   ```js
   await crossChainMessenger.waitForMessageStatus(depositTx2.hash, optimismSDK.MessageStatus.RELAYED)
   ```

1. Check your balances on L1 and L2.

   ```js
   await l1Contract.balanceOf(l1Wallet.address) 
   await l2CustomERC20.balanceOf(l1Wallet.address)
   ```

#### Withdrawal (from OP Mainnet to Ethereum, or OP Goerli to Goerli)

1. Initiate the withdrawal on L2

   ```js
   withdrawalTx1 = await crossChainMessenger.withdrawERC20(l1Contract.address, l2Addr, 1e9)
   await withdrawalTx1.wait()
   ```

1. Wait until the root state is published on L1, and then prove the withdrawal.
   This is likely to take less than 240 seconds.

   ```js
   await crossChainMessenger.waitForMessageStatus(withdrawalTx1.hash, optimismSDK.MessageStatus.READY_TO_PROVE)
   withdrawalTx2 = await crossChainMessenger.proveMessage(withdrawalTx1.hash)
   await withdrawalTx2.wait()
   ```

1. Wait the fault challenge period (a short period on Goerli, seven days on the production network) and then finish the withdrawal.

   ```js
   await crossChainMessenger.waitForMessageStatus(withdrawalTx1.hash, optimismSDK.MessageStatus.READY_FOR_RELAY)
   withdrawalTx3 = await crossChainMessenger.finalizeMessage(withdrawalTx1.hash)
   await withdrawalTx3.wait()   
   ```


1. Check your balances on L1 and L2.
   The balance on L2 should be back to zero.

   ```js
   await l1Contract.balanceOf(l1Wallet.address) 
   await l2CustomERC20.balanceOf(l1Wallet.address)
   ```
