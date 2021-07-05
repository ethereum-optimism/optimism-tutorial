# Bridging ERC-20 Tokens Between L1 and Optimistic Ethereum

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

The most common L1-L2 communication requirement is to move assets, especially ERC-20 tokens, between the underlying L1 network and the L2
solution. Optimisitc Ethereum provides you with a simple mechanism to do exactly that.

1. On Optimistic Ethereum create an ERC-20 contract that inherits from 
   [L2StandardERC20](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/optimistic-ethereum/libraries/standards/L2StandardERC20.sol).
2. Transfer from L1 to L2:
   1. Do A
   2. Do b
3. Transfer from L2 to L1:
   1. Do A
   2. Do b


**Note:** If you don't need the explanations and just want to see running code, 
[click here](https://github.com/ethereum-optimism/optimism-tutorial/). The 
`erc20-bridge/dapp` directory
is just an `npm install` away from being a working example.

## Setup

### Prerequisites

I am going to assume you already have a Hardhat development environment, as explained in 
[the tutorial](https://github.com/ethereum-optimism/optimism-tutorial/tree/main/hardhat). Most of 
these directions should also work with Truffle if you prefer that development environment, but there
might be a few minor differences.

### The Configuration File

In this tutorial we need to access both Optimistic Ethereum and the underlying L1 Ethereum. In the
local test system provided by `docker-compose up`, the L1 Ethereum is listening on port 9545. To
use it, edit `hardhat.config.js` to add to `module.exports.networks`:

```javascript
    underlying: {
       url: 'http://127.0.0.1:9545'
    }
```

### The L1 ERC-20 Contract

On the L1 network you can use any ERC-20 compliant contract. For the purposes of this tutorial, I 
am going to use [this 
contract](https://github.com/ethereum-optimism/optimism-tutorial/blob/main/erc20-bridge/dapp/contracts/L1_ERC20.sol) 
which is a slightly modified version of [the OpenZeppelin ERC-20 
contract](https://ethereum.org/en/developers/tutorials/erc20-annotated-code/).

As part of the setup we need to do two things with things with this contract:

1. Deploy it on L1 and get the address
2. Mint tokens for our account so we'll be able to transfer them.

To do this, run these commands:

```sh
npx hardhat compile --network underlying
npx hardhat console --network underlying
```

Type these commands in the console:

```javascript
l1factory = await ethers.getContractFactory("L1_ERC20")
l1contract = await l1factory.deploy("L1 Token", "L1T")
await l1contract.deployed()
await l1contract.faucet()
l1userAddr = (await ethers.getSigner()).address
balance = (await l1contract.balanceOf(l1userAddr)).toString()
console.log(`L1 ERC-20 contract address ${l1contract.address}`)
console.log(`Address ${l1userAddr} has ${balance} L1 tokens`)
```

Leave the console open, you'll need it again soon.


### The L2 ERC-20 Contract

The L2 ERC-20 contract needs a bit more functionality than a standard ERC-20 contract:

1. Store the addresses of the L2 bridge and the corresponding L1 token.
2. Allow the bridge to mint tokens when they are transferred from L1 to L2.
3. Allow the bridge to burn tokens when they are transferred back to L1.

To do this we can use the [L2StandardERC20
](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/optimistic-ethereum/libraries/standards/L2StandardERC20.sol)
contract, possibly modified (directly or through inheritence) for custom business logic. In this tutorial we 
do not need any custom logic, so we just use the original version. 

L2StandardERC20 requires the [OpenZeppelin contract library](https://openzeppelin.com/contracts/), which
you can install using this command:

```sh
npm install @openzeppelin/contracts@3.3.0 --save
```

Then, to compile and enter the console, type:
```sh
npx hardhat compile --network optimistic
npx hardhat console --network optimistic
```

In the console, run these commands. 

```javascript
l1contractAddr = <address of the L1 ERC20>
l2factory = await ethers.getContractFactory("L2StandardERC20")
l2contract = await l2factory.deploy("0x4200000000000000000000000000000000000010", l1contractAddr, "L2 Token", "L2T")
await l2contract.deployed()
l2userAddr = (await ethers.getSigner()).address
balance = (await l2contract.balanceOf(l2userAddr)).toString()
console.log(`L2 ERC-20 contract address ${l2contract.address}`)
console.log(`Address ${l2userAddr} has ${balance} L2 tokens`)
```

Leave the console open, you'll need it again soon.

### Optimistic Ethereum Packages

We need several packages, install them:

```sh
npm install @eth-optimism/contracts --save
npm install @eth-optimism/watcher --save
```


<!-- The easiest way is to copy the already compiled bridge
contract from `/optimism` (run these commands from the `dapp` directory):

```sh
mkdir -p artifacts/contracts
cd artifacts/contracts
(cd ~/optimism/packages/contracts/artifacts/contracts/optimistic-ethereum/OVM/bridge/tokens; tar cf - OVM_L1StandardBridge.sol) | tar xf -
cd ../..
mkdir -p artifacts-ovm/contracts
cd artifacts-ovm/contracts
(cd ~/optimism/packages/contracts/artifacts-ovm/contracts/optimistic-ethereum/OVM/bridge/tokens; tar cf - OVM_L2StandardBridge.sol) | tar xf -
```

-->


## Transfering Tokens from L1 to L2

You do this from the L1 console (the one you ran with `--network underlying`).

1. Get the address of the L1 bridge:

   ```sh
   curl http://localhost:8080/addresses.json | grep Proxy__OVM_L1StandardBridge
   ```

2. Give the bridge on L1 an allowance of ERC-20 tokens.

   ```javascript
   l1bridgeAddr = <address of Proxy__OVM_L1StandardBridge>
   transferAmt = 5000000
   await l1contract.approve(l1bridgeAddr, transferAmt)
   ```

3. Tell the bridge to transfer the allowance to L2 and see the lower L1 balance (still in the L1 console):

   ```javascript
   l2contractAddr = <address of l2 ERC-20 contract>
   l2userAddr = <address of the user in L2, type l2userAddr in the L2 console to see the value>
   l1bridgeFactory = await ethers.getContractFactory("OVM_L1StandardBridge")
   l1bridge = await l1bridgeFactory.attach(l1bridgeAddr)
   result = await l1bridge.depositERC20To(l1contract.address, l2contractAddr, l2userAddr, transferAmt, 1000000, [])
   console.log(`Address ${l1userAddr} has ${(await l1contract.balanceOf(l1userAddr))} L1 tokens`)
   ```
   
4. In the L2 console finalize the transfer and see it actually happened.

   ```javascript
   l2bridgeAddr = '0x4200000000000000000000000000000000000010'
   l2bridgeFactory = await ethers.getContractFactory("OVM_L2StandardBridge")
   l2bridge = await l2bridgeFactory.attach(l2bridgeAddr)   
   
   console.log(`Address ${l2userAddr} has ${(await l2contract.balanceOf(l2userAddr))} L2 tokens`) 
   ```
      
      

## Transfering Tokens from L2 to L1


## Conclusion

