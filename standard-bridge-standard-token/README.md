# Bridging your Standard ERC20 token to OP Mainnet using the Standard Bridge

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)


For an L1/L2 token pair to work on the Standard Bridge the L2 token contract must implement
[`IL2StandardERC20`](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/standards/IL2StandardERC20.sol) interface. 

If you do not need any special processing on L2, just the ability to deposit, transfer, and withdraw tokens, you can use [`OptimismMintableERC20Factory`](https://github.com/ethereum-optimism/optimism/blob/186e46a47647a51a658e699e9ff047d39444c2de/packages/contracts-bedrock/contracts/universal/OptimismMintableERC20Factory.sol).



**Warning:** The standard bridge does *not* support certain ERC-20 configurations:

- [Fee on transfer tokens](https://github.com/d-xo/weird-erc20#fee-on-transfer)
- [Tokens that modify balances without emitting a Transfer event](https://github.com/d-xo/weird-erc20#balance-modifications-outside-of-transfers-rebasingairdrops)


## Deploying the token

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

1. Connect to `OptimismMintableERC20Factory`. 

   ```js
   fname = "node_modules/@eth-optimism/contracts-bedrock/artifacts/contracts/universal/OptimismMintableERC20Factory.sol/OptimismMintableERC20Factory.json"
   ftext = fs.readFileSync(fname).toString().replace(/\n/g, "")
   optimismMintableERC20FactoryData = JSON.parse(ftext)
   optimismMintableERC20Factory = new ethers.Contract(
      "0x4200000000000000000000000000000000000012", 
      optimismMintableERC20FactoryData.abi, 
      await ethers.getSigner())
   ```


1. Deploy the contract.

   ```js
   deployTx = await optimismMintableERC20Factory.createOptimismMintableERC20(
      process.env.L1_TOKEN_ADDRESS,
      "Token Name on L2",
      "L2-SYMBOL"
   )
   deployRcpt = await deployTx.wait()
   ```

## Transferring tokens 

1. Get the token addresses.

   ```js
   l1Addr = process.env.L1_TOKEN_ADDRESS
   event = deployRcpt.events.filter(x => x.event == "OptimismMintableERC20Created")[0]
   l2Addr = event.args.localToken
   ```

1. Get the data for `OptimismMintableERC20`:

   ```js
   fname = "node_modules/@eth-optimism/contracts-bedrock/artifacts/contracts/universal/OptimismMintableERC20.sol/OptimismMintableERC20.json"
   ftext = fs.readFileSync(fname).toString().replace(/\n/g, "")
   optimismMintableERC20Data = JSON.parse(ftext)
   ```

1. Get the L2 contract.

   ```js
   l2Contract = new ethers.Contract(l2Addr, optimismMintableERC20Data.abi, await ethers.getSigner())   
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
   faucetTx = await l1Contract.faucet()
   faucetRcpt = await faucetTx.wait()
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
   optimismSDK = require("@eth-optimism/sdk")
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
      l2SignerOrProvider: l2Wallet
   })
   ```

#### Deposit (from Ethereum to OP Mainnet, or Goerli to OP Goerli)

1. Give the L1 bridge an allowance to use the user's token.
   The L2 address is necessary to know which bridge is responsible and needs the allowance.

   ```js
   depositTx1 = await crossChainMessenger.approveERC20(l1Contract.address, l2Addr, 1e9)
   await depositTx1.wait()
   ```

1. Check your balances on L1 and L2.
   Note that `l1Wallet` and `l2Wallet` have the same address, so it doesn't matter which one we use.

   ```js
   await l1Contract.balanceOf(l1Wallet.address) 
   await l2Contract.balanceOf(l1Wallet.address)
   ```   

1. Do the actual deposit

   ```js
   depositTx2 = await crossChainMessenger.depositERC20(l1Addr, l2Addr, 1e9)
   await depositTx2.wait()
   ```

1. Wait for the deposit to be relayed.

   ```js
   await crossChainMessenger.waitForMessageStatus(depositTx2.hash, optimismSDK.MessageStatus.RELAYED)
   ```

1. Check your balances on L1 and L2.

   ```js
   await l1Contract.balanceOf(l1Wallet.address) 
   await l2Contract.balanceOf(l1Wallet.address)
   ```

#### Withdrawal (from OP Mainnet to Ethereum or OP Goerli to Goerli)

1. Initiate the withdrawal on L2

   ```js
   withdrawalTx1 = await crossChainMessenger.withdrawERC20(l1Addr, l2Addr, 1e9)
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
   await l2Contract.balanceOf(l1Wallet.address)
   ```

## For L2 native tokens(L2_TOKEN_ADDRESS). 
The legacy API is preserved to ensure that existing applications will not experience any problems with the Bedrock StandardBridge contracts.
1. Open the hardhat console.
   ```js
   yarn hardhat console --network goerli
   ```
1. Connect to `OptimismMintableERC20Factory`.
   ```js
   fname = "node_modules/@eth-optimism/contracts-bedrock/artifacts/contracts/universal/OptimismMintableERC20Factory.sol/OptimismMintableERC20Factory.json"
   ftext = fs.readFileSync(fname).toString().replace(/\n/g, "")
   optimismMintableERC20FactoryData = JSON.parse(ftext)
   optimismMintableERC20Factory = new ethers.Contract(
      "0x883dcF8B05364083D849D8bD226bC8Cb4c42F9C5", 
      optimismMintableERC20FactoryData.abi, 
      await ethers.getSigner())
   ```
1. Deploy the contract.
   ```js
   deployTx = await optimismMintableERC20Factory.createOptimismMintableERC20(
      process.env.L2_TOKEN_ADDRESS,
      "Token Name",
      "L1-SYMBOL"
   )
   deployRcpt = await deployTx.wait()
   ```
1. Get the token addresses.
   ```js
   l2Addr = process.env.L2_TOKEN_ADDRESS
   event = deployRcpt.events.filter(x => x.event == "OptimismMintableERC20Created")[0]
   l1Addr = event.args.localToken
   ```
1. Get the data for `OptimismMintableERC20`:
   ```js
   fname = "node_modules/@eth-optimism/contracts-bedrock/artifacts/contracts/universal/OptimismMintableERC20.sol/OptimismMintableERC20.json"
   ftext = fs.readFileSync(fname).toString().replace(/\n/g, "")
   optimismMintableERC20Data = JSON.parse(ftext)
   ```
1. Get the L1 contract.
   ```js
   l1Contract = new ethers.Contract(l1Addr, optimismMintableERC20Data.abi, await ethers.getSigner())   
   ```
1. Get the L2 wallet.
   ```js
   l2Url = `https://opt-goerli.g.alchemy.com/v2/${process.env.L2_ALCHEMY_KEY}`
   l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
   hdNode = ethers.utils.HDNode.fromMnemonic(process.env.MNEMONIC)
   privateKey = hdNode.derivePath(ethers.utils.defaultPath).privateKey
   l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider)
   ```
1. Get the L2 contract.
   ```js
   l2Factory = await ethers.getContractFactory("OptimismUselessToken")
   l2Contract = new ethers.Contract(process.env.L2_TOKEN_ADDRESS, l2Factory.interface, l2Wallet)
   ```
1. Get tokens on L2 (and verify the balance)
   ```js
   faucetTx = await l2Contract.faucet()
   faucetRcpt = await faucetTx.wait()
   await l2Contract.balanceOf(l2Wallet.address)
   ```
1. Give the `l2StandardBridge` an allowance  
   ```js
   l2bridgeTx1 = await l2Contract.approve("0x4200000000000000000000000000000000000010", 1e9)
   await l2bridgeTx1.wait()
   ```
1. Check your balances on L1 and L2
   ```js
   await l1Contract.balanceOf(l2Wallet.address) 
   await l2Contract.balanceOf(l2Wallet.address)
   ```
1. Get the `l2StandardBridge` contract   
   ```js
   fname = "node_modules/@eth-optimism/contracts-bedrock/artifacts/contracts/L2/L2StandardBridge.sol/L2StandardBridge.json"
   ftext = fs.readFileSync(fname).toString().replace(/\n/g, "")
   l2StandardBridgeData = JSON.parse(ftext)
   l2StandardBridge = new ethers.Contract(
      "0x4200000000000000000000000000000000000010",
      l2StandardBridgeData.abi,
      l2Wallet)
   ```
1. Call the `bridgeERC20` interface of the `l2StandardBridge` on Layer 2.
   ```js
   l2bridgeTx2 = await l2StandardBridge.bridgeERC20(l2Addr, l1Addr, 1e9, 1, "0x")
   await l2bridgeTx2.wait()
   ```
1. Import the `Optimism SDK`.  
   ```js
   optimismSDK = require("@eth-optimism/sdk")
   ```
1. Create the cross domain messenger.  
   ```js
   l1ChainId = (await ethers.provider.getNetwork()).chainId
   l2ChainId = (await l2RpcProvider.getNetwork()).chainId
   l1Wallet = await ethers.provider.getSigner()
   crossChainMessenger = new optimismSDK.CrossChainMessenger({
   l1ChainId: l1ChainId,
   l2ChainId: l2ChainId,
   l1SignerOrProvider: l1Wallet,
   l2SignerOrProvider: l2Wallet
   })
   ```
1. Wait until the root state is published on L1, and then prove the withdrawal. 
   ```js
   await crossChainMessenger.waitForMessageStatus(l2bridgeTx2.hash, optimismSDK.MessageStatus.READY_TO_PROVE)
   l2bridgeTx3 = await crossChainMessenger.proveMessage(l2bridgeTx2.hash)
   await l2bridgeTx3.wait()
   ```
1. Wait the fault challenge period 
   ```js
   await crossChainMessenger.waitForMessageStatus(l2bridgeTx2.hash, optimismSDK.MessageStatus.READY_FOR_RELAY)
   l2bridgeTx4 = await crossChainMessenger.finalizeMessage(l2bridgeTx2.hash)
   await l2bridgeTx4.wait()
   ```
1. Check your balances on L1 and L2.    
   ```js
   await l1Contract.balanceOf(l1Wallet.address) 
   await l2Contract.balanceOf(l1Wallet.address)
   ```
1. Get the `l1StandardBridge` contract   
   ```js
   fname ="node_modules/@eth-optimism/contracts-bedrock/artifacts/contracts/L1/L1StandardBridge.sol/L1StandardBridge.json"
   ftext = fs.readFileSync(fname).toString().replace(/\n/g, "")
   l1StandardBridgeData = JSON.parse(ftext)
   l1StandardBridge= new ethers.Contract(
   "0x636Af16bf2f682dD3109e60102b8E1A089FedAa8", 
   l1StandardBridgeData.abi, 
   l1Wallet)
   ```
1. Call the `bridgeERC20` interface of `l1StandardBridge` on Layer 1   
   ```js
   l1bridgeTx =  await l1StandardBridge.bridgeERC20(l1Addr, l2Addr, 1e9, 1, "0x")
   await l1bridgeTx.wait()
   ```
1. Wait for the bridge to be relayed.   
   ```js
   await crossChainMessenger.waitForMessageStatus(l1bridgeTx.hash, optimismSDK.MessageStatus.RELAYED)
   ```
1. Check your balances on L1 and L2.    
   ```js
   await l1Contract.balanceOf(l1Wallet.address) 
   await l2Contract.balanceOf(l1Wallet.address)
   ```



