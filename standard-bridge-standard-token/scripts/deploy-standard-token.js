
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");


// Two items we need fron the @eth-optimism/contracts package.
//
// predeploys contains the addresses of the predeployed contracts on L2
// getContractInterface is a function that lets us get the ABI of contracts in the package
const { predeploys, getContractInterface } = require('@eth-optimism/contracts')


// ERC20 contract factory
const erc20Artifact = require(`../artifacts/contracts/ERC20.sol/ERC20.json`)
const factory__ERC20 = new ethers.ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode)


// For clarity this example uses global variables.
let l1Provider, l2Provider
let l1Wallet, l2Wallet
let l2Key  // Always equals to l1Key so we'll have the same address
let userAddr, l1BridgeAddr

// The token contracts on both layers
let l1Token, l2Token


// These are tasks that need to happen before we can deploy a custom token to L2
const priorTasks = async () => {
   // Deploy an ERC20 token to L1, for use in the rest of the tutorial. We could have used an
   // existing one, but optimistic-devnode doesn't have one for us.
   await makeL1Token()
}  // priorTasks




// These are tasks that happen after we deploy the custom token, to verify it was deployed
// and connected to the bridge successfuly
const postTasks = async () => {
   await depositTokens()

   for(var i=1; i<100; i++) {
     await new Promise(resolve => setTimeout(resolve, 1000))
     console.log(`after ${i} seconds`)
     checkBalances()
   }
}    // postTasks





// Deploy an ERC20 token to L1, for use in the rest of the tutorial. We could have used an
// existing one, but optimistic-devnode doesn't have one for us.
const makeL1Token = async () => {
   let l1Url, l1Key

   // Get the configuration from the network name. If the network
   // is optimistic-devnode, use preset values. Otherwise, read the
   // values from .env (which isn't saved in github for safety).
   switch(hre.network.name) {
      case 'optimistic-devnode':
         l1Url = 'http://localhost:9545'
         l1Key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
         break
      // For other networks, l2Key = process.env.PRIVATE_KEY, l1Url is Infura
      // Add support when available
      default:
         console.error("Unsupported network")
         process.exit(1)
   }   // switch

   l2Key = l1Key

   // Create the provider and wallet to connect to L1
   l1Provider = new ethers.providers.JsonRpcProvider(l1Url)
   l1Wallet = new ethers.Wallet(l1Key, l1Provider)
   userAddr = l1Wallet.address

   // Deploy an ERC-20 token on L1.
   l1Token = await factory__ERC20.connect(l1Wallet).deploy(
      1337,       // initialSupply
      'L1 ERC20', // name
   )

   await l1Token.deployTransaction.wait()

   console.log(`L1 token contract deployed to ${l1Token.address}`)
}      // makeL1Token


// Show the balances on both layers. There are three potentially interesting
// balances:
// 1. The user's balance on L1
// 2. The user's balance on L2
// 3. The bridge's balance on L1. This is where the ERC-20 tokens are locked while they are on L2
//
// Exit once the L2 balance is correct
const showBalances = async () => {
   const l2Balance = (await l2Token.balanceOf(userAddr)).toString()

   console.log(`\tL1 balance: ${(await l1Token.balanceOf(userAddr)).toString()}\t` +
                 `L2 balance: ${l2Balance}\t` +
                 `L1 Bridge: ${(await l1Token.balanceOf(l1BridgeAddr)).toString()}`)

  if (l2Balance == "337")
    process.exit(0)
}


// Deposit tokens from L1 to L2, to show the L2 token contract was created successfully
const depositTokens = async () => {

  // Get the L2 standard bridge. The only reason we need it is that it knows the L1 address
  // of the standard bridge.
  //
  // Alternatively, you can get this value from
  // https://github.com/ethereum-optimism/optimism/blob/regenesis/0.5.0/packages/contracts/deployments/README.md
  // For public networks. But we need to support this method for optimistic-devnode
  const l2StandardBridge = new ethers.Contract(
     predeploys.L2StandardBridge,
     getContractInterface('L2StandardBridge'),
     l2Provider)

  const l1StandardBridge = new ethers.Contract(
     await l2StandardBridge.l1TokenBridge(),
     getContractInterface('L1StandardBridge'),
     l1Wallet)

  // We need l1BridgeAddr in showBalances() so we can see the balance of tokens locked in the bridge
  l1BridgeAddr = l2StandardBridge.l1TokenBridge()

  await showBalances()

  const amt = 337   // The amount to transfer

  // First you need to approve the L1 Standard Bridge spending these tokens for you
  const tx1 = await l1Token.approve(l1StandardBridge.address, amt)
  await tx1.wait()

  // Then you ask the bridge to deposit ERC20 to your L2 account
  const tx2 = await l1StandardBridge.depositERC20(
     l1Token.address,
     l2Token.address,
     amt,
     2000000, // gas to use on L2
     '0x')    // call data
  await tx2.wait()

  for(var i=1; i<100; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log(`after ${i} seconds`)
    await showBalances()
  }


} // depositTokens


const main = async () => {

  // We need an L1 ERC-20 token to bridge. If you prefer you can attach to an existing one
  await priorTasks()


  const l2TokenName = "L2 ERC20"
  const l2TokenSymbol = "L2 ERC20"

  // Instantiate the wallet of L2
  l2Provider = new ethers.providers.JsonRpcProvider(hre.network.config.url)
  l2Wallet = new ethers.Wallet(l2Key, l2Provider)

  console.log("Creating instance of L2StandardERC20 on", hre.network.name, "network")

  // Connect to the existing L2StandardTokenFactory
  let l2StandardTokenFactory =
      new ethers.Contract(predeploys.L2StandardTokenFactory,
                          getContractInterface('L2StandardTokenFactory'),
                          l2Wallet)

  // Ask the token factory to create a standard L2 token. This is a normal ERC-20 token
  // contract that manages the tokens while they are locked in the bridge on L1
  const tx = await l2StandardTokenFactory.createStandardL2Token(
    l1Token.address,
    l2TokenName, l2TokenSymbol
  )

  // The receipt includes the address of the new contract
  const receipt = await tx.wait()
  const args = receipt.events.find(({ event }) => event === 'StandardL2TokenCreated').args
  l2Token = new ethers.Contract(args._l2Token, getContractInterface('L2StandardERC20'), l2Wallet)
  console.log("L2StandardERC20 deployed to:", l2Token.address)



  // Sanity check - does this L2 connect to the correct L1? If not, transfering between
  // them is a BAD IDEA
  console.assert(l1Token.address == await l2Token.l1Token(),
    `L1 Token address (${l1Token.address}) != ` +
    `The L1 token L2 thinks it represents (${await l2Token.l1Token()}`)


  // A test to see that the custom token is successfully connected to the bridge
  await postTasks()
}  // main




// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
