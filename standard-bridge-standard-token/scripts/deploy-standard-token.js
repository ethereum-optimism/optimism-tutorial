// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const L2StandardTokenFactoryArtifact = require(`../node_modules/@eth-optimism/contracts/artifacts-ovm/contracts/optimistic-ethereum/OVM/bridge/tokens/OVM_L2StandardTokenFactory.sol/OVM_L2StandardTokenFactory.json`)

async function main() {
  // MODIFY TO DESIRED PARAMS
  const L1TokenAddress = "0x"
  const L2TokenName = "NAME"
  const L2TokenSymbol = "SYMBOL"

  // Instantiate the signer
  const provider = new ethers.providers.JsonRpcProvider(hre.network.config.url)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  console.log("Creating instance of L2StandardERC20 on", hre.network.name, "network")
  // Instantiate the Standard token factory on respective network
  let l2StandardTokenFactory;
  if (hre.network.name == 'optimistic-kovan') {
    l2StandardTokenFactory = new ethers.Contract('0x50EB44e3a68f1963278b4c74c6c343508d31704C', L2StandardTokenFactoryArtifact.abi, signer)  // Kovan instance
  } else if (hre.network.name == 'optimistic-mainnet') {
    l2StandardTokenFactory = new ethers.Contract('0x2e985AcD6C8Fa033A4c5209b0140940E24da7C5C', L2StandardTokenFactoryArtifact.abi, signer)  // Mainnet instance
  } else {
    throw Error("unsupported network")
  }

  const tx = await l2StandardTokenFactory.createStandardL2Token(
    L1TokenAddress,
    L2TokenName,
    L2TokenSymbol
  )
  const receipt = await tx.wait()
  const args = receipt.events.find(({ event }) => event === 'StandardL2TokenCreated').args

  // Get the L2 token address from the emmited event and log
  const l2TokenAddress = args._l2Token
  console.log("L2StandardERC20 deployed to:", l2TokenAddress)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
