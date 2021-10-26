// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const L2StandardTokenFactoryArtifact =
    require(`../node_modules/@eth-optimism/contracts/artifacts/contracts/` +
       `L2/messaging/L2StandardTokenFactory.sol/L2StandardTokenFactory.json`)

const { predeploys, getContractInterface } = require('@eth-optimism/contracts')


// ERC20 contract factory
const erc20Artifact = require(`../artifacts/contracts/ERC20.sol/ERC20.json`)
const factory__ERC20 = new ethers.ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode)


let l1Provider, l2Provider
let l1Wallet, l2Wallet
let l2Key
let userAddr

// The token contracts on both layers
let l1Token, l2Token

// Deploy an ERC20 token to L1, for use in the rest of the tutorial
const makeL1Token = async () => {
   let l1Url, l1Key
   switch(hre.network.name) {
      case 'optimistic-devnode':
         l1Url = 'http://localhost:9545'
         l1Key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
         l2Key = l1Key
         break
      // For other networks, l2Key = process.env.PRIVATE_KEY
      default:
         console.error("Unsupported network")
         process.exit(1)
   }   // switch

   l1Provider = new ethers.providers.JsonRpcProvider(l1Url)
   l1Wallet = new ethers.Wallet(l1Key, l1Provider)
   userAddr = l1Wallet.address
   l1Token = await factory__ERC20.connect(l1Wallet).deploy(
      1337,       // initialSupply
      'L1 ERC20', // name
   )

   await l1Token.deployTransaction.wait()

   console.log(`L1 token contract deployed to ${l1Token.address}`)
}      // makeL1Token


// Show the user's balances on both layers
const showBalances = async () => {
   console.log(`\tL1 balance: ${(await l1Token.balanceOf(userAddr)).toString()}\t\t` +
               `L2 balance: ${(await l2Token.balanceOf(userAddr)).toString()}`)
}


// Deposit tokens from L1 to L2
const depositTokens = async () => {
  const l2Messenger = new ethers.Contract(
     predeploys.L2CrossDomainMessenger,
     getContractInterface('L2CrossDomainMessenger'),
     l2Provider)

  const l1Messenger = new ethers.Contract(
     await l2Messenger.l1CrossDomainMessenger(),
     getContractInterface('L1CrossDomainMessenger'),
     l1Provider)

  const l2StandardBridge = new ethers.Contract(
     predeploys.L2StandardBridge,
     getContractInterface('L2StandardBridge'),
     l2Provider)

  const l1StandardBridge = new ethers.Contract(
     await l2StandardBridge.l1TokenBridge(),
     getContractInterface('L1StandardBridge'),
     l1Wallet)

  const amt = 337

  const tx1 = await l1Token.approve(l1StandardBridge.address, amt)
  await tx1.wait()


  const tx2 = await l1StandardBridge.depositERC20(
     l1Token.address,
     l1Token.address,
     amt,
     2000000,
     '0x')
  await tx2.wait()

  await new Promise(resolve => setTimeout(resolve, 60000))

} // depositTokens


const main = async () => {
  await makeL1Token()

  const l2TokenName = "L2 ERC20"
  const l2TokenSymbol = "L2 ERC20"

  // Instantiate the signer
  l2Provider = new ethers.providers.JsonRpcProvider(hre.network.config.url)
  l2Wallet = new ethers.Wallet(l2Key, l2Provider)

  console.log("Creating instance of L2StandardERC20 on", hre.network.name, "network")

  let l2StandardTokenFactory =
      new ethers.Contract(predeploys.L2StandardTokenFactory,
                          getContractInterface('L2StandardTokenFactory'),
                          l2Wallet)

  const tx = await l2StandardTokenFactory.createStandardL2Token(
    l1Token.address,
    l2TokenName, l2TokenSymbol
  )
  const receipt = await tx.wait()
  const args = receipt.events.find(({ event }) => event === 'StandardL2TokenCreated').args
  l2Token = new ethers.Contract(args._l2Token, getContractInterface('L2StandardERC20'), l2Wallet)
  console.log("L2StandardERC20 deployed to:", l2Token.address)



  // Sanity check - does this L2 connect to the correct L1? If not, transfering between
  // them is a BAD IDEA
  console.assert(l1Token.address == await l2Token.l1Token(),
    `L1 Token address (${l1Token.address}) != ` +
    `The L1 token L2 thinks it represents (${await l2Token.l1Token()}`)


  console.log(`Initial state:`)
  await showBalances()

  await depositTokens()
  console.log(`After depositing tokens:`)
  await showBalances()}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
