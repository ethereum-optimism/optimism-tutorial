# Bridging your Native L2 ERC20 token to Mainnet using the Standard Bridge

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

For an L1/Native L2 token pair to work on the Standard Bridge the L1 token contract must implement
[`IL2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/IL2StandardERC20.sol) interface.

If you do not need any special processing on L1, just the ability to deposit, transfer, and withdraw tokens, you can use [`OptimismMintableERC20Factory`](https://github.com/ethereum-optimism/optimism/blob/186e46a47647a51a658e699e9ff047d39444c2de/packages/contracts-bedrock/contracts/universal/OptimismMintableERC20Factory.sol).

**Warning:** The standard bridge does _not_ support certain ERC-20 configurations:

- [Fee on transfer tokens](https://github.com/d-xo/weird-erc20#fee-on-transfer)
- [Tokens that modify balances without emitting a Transfer event](https://github.com/d-xo/weird-erc20#balance-modifications-outside-of-transfers-rebasingairdrops)

## Deploying the remote token on L1 (Ethereum or Optimism Mainnet)

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
   - `L2_TOKEN_ADDRESS`, the address of the L2 ERC20 which you want to bridge.
     The default value, [`0xFdD187455224E9F5687F730D540856c7cd367A0c`](https://goerli.etherscan.io/address/0x32B3b2281717dA83463414af4E8CfB1970E56287) is a test ERC-20 contract on Goerli that lets you call `faucet` to give yourself test tokens.

1. Open the hardhat console.

   ```sh
   yarn hardhat console --network goerli
   ```

1. Connect to the `OptimismMintableERC20Factory` contract on L1. The address is `0x883dcF8B05364083D849D8bD226bC8Cb4c42F9C5` on goerli.

   ```js
   fname =
     "node_modules/@eth-optimism/contracts-bedrock/artifacts/contracts/universal/OptimismMintableERC20Factory.sol/OptimismMintableERC20Factory.json";
   ftext = fs.readFileSync(fname).toString().replace(/\n/g, "");
   optimismMintableERC20FactoryData = JSON.parse(ftext);
   optimismMintableERC20Factory = new ethers.Contract(
     "0x883dcF8B05364083D849D8bD226bC8Cb4c42F9C5",
     optimismMintableERC20FactoryData.abi,
     await ethers.getSigner()
   );
   ```

1. Deploy the contract on L1.

   ```js
   deployTx = await optimismMintableERC20Factory.createOptimismMintableERC20(
     process.env.L2_TOKEN_ADDRESS,
     "Token Name on L1",
     "L1-SYMBOL"
   );
   deployRcpt = await deployTx.wait();
   ```

##

### Bridge the tokens from L2 to L1.

1. Call the `bridgeERC20` function on the L2 Standard Bridge.

   The the L2 Standard Bridge is located at `0x4200000000000000000000000000000000000010` on the `optimism-goerli` network.

   You will need the address of your native L2 token and the address of the corresponding L1 token deployed in the previous step.

2. Save the transaction hash from the `bridgeERC20` function call in the previous step as we will need it later on.

### Setup L1 and L2 Providers / Wallets

```js
optimismSDK = require("@eth-optimism/sdk");

const mnemonic = process.env.MNEMONIC;

l1Url = `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_KEY}`;
l2Url = `https://opt-goerli.g.alchemy.com/v2/${process.env.OP_GOERLI_KEY}`;

l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url);
l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url);

hdNode = ethers.utils.HDNode.fromMnemonic(process.env.MNEMONIC);

privateKey = hdNode.derivePath(ethers.utils.defaultPath).privateKey;

l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider);
l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider);
```

### Complete Token Transfer (from OP Mainnet to Ethereum, or OP Goerli to Goerli)

Create and use [`CrossDomainMessenger`](https://sdk.optimism.io/classes/crosschainmessenger) (the Optimism SDK object used to bridge assets).
The SDK supports multiple OP Chains: OP, Base, etc.
To see whether a specific OP Chain is supported directly, [see the documentation](https://sdk.optimism.io/enums/l2chainid).
Chains that aren't officially supported just take a few extra steps.
Get the L1 contract addresses, and [provide them to the SDK](https://stack.optimism.io/docs/build/sdk/#contract-addresses).
Once you do that, you can use the SDK normally.

1. Import the Optimism SDK.

   ```js
   optimismSDK = require("@eth-optimism/sdk");
   ```

2. Create the cross domain messenger.

   ```js
   crossChainMessenger = new optimismSDK.CrossChainMessenger({
     l1ChainId: 5, // Goerli
     l2ChainId: 420, // OP Goerli
     l1SignerOrProvider: l1Wallet,
     l2SignerOrProvider: l2Wallet
   });
   ```

3. Create the withdrawl transaction object with the hash from the original `bridgeERC20` transaction earlier in the tutorial.

   ```js
   withdrawalTx1 = {}
   withdrawalTx1.hash = <your --bridge erc20 hash with quotes>
   ```

4. Wait for the `bridgeERC20` transaction from earlier to be relayed.
   ```js
   await crossChainMessenger.waitForMessageStatus(
     withdrawalTx1.hash,
     optimismSDK.MessageStatus.READY_TO_PROVE
   );
   ```
5. Wait until the root state is published on L1, and then prove the withdrawal. This is likely to take less than 240 seconds.
   ```js
   withdrawalTx2 = await crossChainMessenger.proveMessage(withdrawalTx1.hash);
   await withdrawalTx2.wait();
   ```
6. Wait the fault challenge period (a short period on Goerli, seven days on the production network) and then finish the withdrawal.

   ```js
   await crossChainMessenger.waitForMessageStatus(
     withdrawalTx1.hash,
     optimismSDK.MessageStatus.READY_FOR_RELAY
   );

   withdrawalTx3 = await crossChainMessenger.finalizeMessage(
     withdrawalTx1.hash
   );

   await withdrawalTx3.wait();
   ```

7. That's it! Your native L2 token has now been bridged to L1.

### Send the tokens back from L1 to L2 (from Ethereum to OP Mainnet, or Goerli to OP Goerli)

1. Call the `bridgeERC20` function on the L1 Standard Bridge.

   The the L1 Standard Bridge is located at `0x636Af16bf2f682dD3109e60102b8E1A089FedAa8` on the goerli network.

2. That's it! Your tokens will show up in your wallet on the corresponding L2 chain.
