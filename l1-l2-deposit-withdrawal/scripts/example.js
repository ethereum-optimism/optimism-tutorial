const ethers = require('ethers')
const { Watcher } = require('@eth-optimism/core-utils')
const { predeploys, getContractInterface } = require('@eth-optimism/contracts')

// Set up some contract factories. You can ignore this stuff.
const erc20L1Artifact = require(`../artifacts/contracts/ERC20.sol/ERC20.json`)
const factory__L1_ERC20 = new ethers.ContractFactory(erc20L1Artifact.abi, erc20L1Artifact.bytecode)
//const factory__L1_ERC20 = factory('ERC20')
const erc20L2Artifact = require('../node_modules/@eth-optimism/contracts/artifacts-ovm/contracts/optimistic-ethereum/libraries/standards/L2StandardERC20.sol/L2StandardERC20.json')
const factory__L2_ERC20 = new ethers.ContractFactory(erc20L2Artifact.abi, erc20L2Artifact.bytecode)

const l1StandardBridgeArtifact = require(`../node_modules/@eth-optimism/contracts/artifacts/contracts/optimistic-ethereum/OVM/bridge/tokens/OVM_L1StandardBridge.sol/OVM_L1StandardBridge.json`)
const factory__L1StandardBridge = new ethers.ContractFactory(l1StandardBridgeArtifact.abi, l1StandardBridgeArtifact.bytecode)

const l2StandardBridgeArtifact = require(`../node_modules/@eth-optimism/contracts/artifacts/contracts/optimistic-ethereum/OVM/bridge/tokens/OVM_L2StandardBridge.sol/OVM_L2StandardBridge.json`)
const factory__L2StandardBridge = new ethers.ContractFactory(l2StandardBridgeArtifact.abi, l2StandardBridgeArtifact.bytecode)

async function main() {
  // Set up our RPC provider connections.
  const l1RpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:9545')
  const l2RpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

  // Set up our wallets (using a default private key with 10k ETH allocated to it).
  // Need two wallets objects, one for interacting with L1 and one for interacting with L2.
  // Both will use the same private key.
  const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  const l1Wallet = new ethers.Wallet(key, l1RpcProvider)
  const l2Wallet = new ethers.Wallet(key, l2RpcProvider)

  const l2AddressManager = new ethers.Contract(
    predeploys.Lib_AddressManager,
    getContractInterface('Lib_AddressManager'),
    l2RpcProvider
  )

  const l1Messenger = new ethers.Contract(
    await l2AddressManager.getAddress('OVM_L1CrossDomainMessenger'),
    getContractInterface('OVM_L1CrossDomainMessenger'),
    l1RpcProvider
  )

  const l1MessengerAddress = l1Messenger.address
  // L2 messenger address is always the same.
  const l2MessengerAddress = '0x4200000000000000000000000000000000000007'

  // Tool that helps watches and waits for messages to be relayed between L1 and L2.
  const watcher = new Watcher({
    l1: {
      provider: l1RpcProvider,
      messengerAddress: l1MessengerAddress
    },
    l2: {
      provider: l2RpcProvider,
      messengerAddress: l2MessengerAddress
    }
  })

  // Deploy an ERC20 token on L1.
  console.log('Deploying L1 ERC20...')

  const L1_ERC20 = await factory__L1_ERC20.connect(l1Wallet).deploy(
    1234, //initialSupply
    'L1 ERC20', //name
  )
  await L1_ERC20.deployTransaction.wait()
  console.log(`   L1_ERC20 deployed @ ${L1_ERC20.address}`)

  // Deploy the paired ERC20 token to L2.
  console.log('Deploying L2 ERC20...')
  const L2_ERC20 = await factory__L2_ERC20.connect(l2Wallet).deploy(
    '0x4200000000000000000000000000000000000010',
    // The first value is to check the case of an invalid L1. The second value
    // (L1_ERC20.address) is the correct one.
    // '0x1111111111000000000000000000000000000000',
    L1_ERC20.address,
    'L2 ERC20', //name
    'L2T', // symbol
  )
  await L2_ERC20.deployTransaction.wait()
  console.log(`   L2_ERC20 deployed @ ${L2_ERC20.address}`)

  const L2StandardBridge = factory__L2StandardBridge
      .connect(l2Wallet)
      .attach('0x4200000000000000000000000000000000000010')

  console.log('Instantiate L1 Standard Bridge...')
  const L1StandardBridgeAddress = await L2StandardBridge.l1TokenBridge();
  const L1StandardBridge = factory__L1StandardBridge.connect(l1Wallet).attach(L1StandardBridgeAddress)

  // Initial balances.
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 1234
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 0

  // Allow the gateway to lock up some of our tokens.
  console.log('Approving tokens for Standard Bridge...')
  const tx1 = await L1_ERC20.approve(L1StandardBridge.address, 1234)
  await tx1.wait()

  // Sanity check, is the L2 address really the correct IL2StandardERC20 for this
  // L1 token. If the contract doesn't implement IL2StandardERC20 we'll have an exception
  // and the transfer will also fail.
  //
  // DO NOT remove this check.
  // It ensures L2 token compliance and validity. If the L2 token contract doesn't implement
  // IL2StandardERC20 or it does not correspond to the L1 token being deposited, an exception
  // will occur and no deposit will take place. Alternatively the exception will occur once
  // the deposit is relayed to L2 and the seven day wait period will apply for the bad deposit
  // to be withdraw-able back on L1
  if (await L2_ERC20.l1Token() != L1_ERC20.address) {
    console.log(`L2 token does not correspond to L1 token: L2_ERC20.l1Token() = ${await L2_ERC20.l1Token()}`)
    process.exit(0)
  }

  // Lock the tokens up inside the gateway and ask the L2 contract to mint new ones.
  console.log('Depositing tokens into L2 ...')
  const tx2 = await L1StandardBridge.depositERC20(
    L1_ERC20.address,
    L2_ERC20.address,
    1234,
    2000000,
    '0x')
  await tx2.wait()

  // Wait for the message to be relayed to L2.
  console.log('Waiting for deposit to be relayed to L2...')
  const [ msgHash1 ] = await watcher.getMessageHashesFromL1Tx(tx2.hash)

  const receipt = await watcher.getL2TransactionReceipt(msgHash1, true)
  //console.log("receipt", receipt)

  // Log some balances to see that it worked!
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 0
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 1234

  // Burn the tokens on L2 and ask the L1 contract to unlock on our behalf.
  console.log(`Withdrawing tokens back to L1 ...`)
  const tx3 = await L2StandardBridge.withdraw(
    L2_ERC20.address,
    1234,
    2000000,
    '0x'
  )
  await tx3.wait()

  // Wait for the message to be relayed to L1.
  console.log(`Waiting for withdrawal to be relayed to L1...`)
  const [ msgHash2 ] = await watcher.getMessageHashesFromL2Tx(tx3.hash)
  await watcher.getL1TransactionReceipt(msgHash2)

  // Log balances again!
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 1234
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 0
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
