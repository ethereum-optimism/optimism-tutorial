const ethers = require('ethers')
const { predeploys, getContractInterface } = require('@eth-optimism/contracts')

const l1StandardBridgeArtifact = require(`../node_modules/@eth-optimism/contracts/artifacts/contracts/L1/messaging/L1StandardBridge.sol/L1StandardBridge.json`)
const factory__L1StandardBridge = new ethers.ContractFactory(l1StandardBridgeArtifact.abi, l1StandardBridgeArtifact.bytecode)

const l2StandardBridgeArtifact = require(`../node_modules/@eth-optimism/contracts/artifacts/contracts/L2/messaging/L2StandardBridge.sol/L2StandardBridge.json`)
const factory__L2StandardBridge = new ethers.ContractFactory(l2StandardBridgeArtifact.abi, l2StandardBridgeArtifact.bytecode)

async function main() {
  // Set up our RPC provider connections.
  const l1RpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:9545')
  const l2RpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

  // Set up our wallets (using a default private key with 10k ETH allocated to it).
  // Need two wallets objects, one for interacting with L1 and one for interacting with L2.
  // Both will use the same private key.
  const key = '0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd'
  const l1Wallet = new ethers.Wallet(key, l1RpcProvider)
  const l2Wallet = new ethers.Wallet(key, l2RpcProvider)

  // Get balances
  const getBalances = async () => {
    var l1Eth = ethers.utils.formatEther(await l1RpcProvider.getBalance(l1Wallet.address))
    var l2Eth = ethers.utils.formatEther(await l2RpcProvider.getBalance(l2Wallet.address))

    return [l1Eth, l2Eth]
  }    // getBalances

  // L2StandardBridge is always at the same address. We can use that to get the address for
  // L1StandardBridge. On Kovan and mainnet we can also use the known deployment addresses,
  // but this logic also works for local development nodes
  const L2StandardBridge = factory__L2StandardBridge
      .connect(l2Wallet)
      .attach('0x4200000000000000000000000000000000000010')
  const L1StandardBridgeAddress = await L2StandardBridge.l1TokenBridge();
  const L1StandardBridge = factory__L1StandardBridge.connect(l1Wallet).attach(L1StandardBridgeAddress)

  const beforeVals = await getBalances()

  tx = await L1StandardBridge.depositETH(2500000,[],
    {value:    ethers.utils.parseEther("1"),
     gasLimit: 30000000}
  )

  let afterVals = await getBalances()

  console.log(`Balances before the operation\tL1:${beforeVals[0]}\tL2:${beforeVals[1]}`)
  console.log(`Balances after the operation\tL1:${afterVals[0]}\tL2:${afterVals[1]}`)
  // Until the ETH gets deposited to L2
  var seconds = 0
  while (afterVals[1] == beforeVals[1]) {
    await new Promise(resolve => setTimeout(resolve, 1000))   // wait a second
    seconds++
    afterVals = await getBalances()
    console.log(`Balances after ${seconds} second${seconds-1 ? "s" : ""} \tL1:${afterVals[0]}\tL2:${afterVals[1]}`)
  }
} // main()

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
