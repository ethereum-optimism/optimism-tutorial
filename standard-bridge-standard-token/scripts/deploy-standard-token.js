// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const L2StandardTokenFactoryArtifact = require(`../node_modules/@eth-optimism/contracts/artifacts/contracts/L2/messaging/L2StandardTokenFactory.sol/L2StandardTokenFactory.json`);

async function main() {
  // MODIFY TO DESIRED PARAMS
  const L1TokenAddress = process.env.L1_TOKEN_ADDRESS;
  const L2TokenName = process.env.L2_TOKEN_NAME;
  const L2TokenSymbol = process.env.L2_TOKEN_SYMBOL;

  // Instantiate the signer
  const provider = new ethers.providers.JsonRpcProvider(hre.network.config.url);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log(
    "Creating instance of L2StandardERC20 on",
    hre.network.name,
    "network"
  );
  // Instantiate the Standard token factory
  const l2StandardTokenFactory = new ethers.Contract(
    "0x4200000000000000000000000000000000000012",
    L2StandardTokenFactoryArtifact.abi,
    signer
  );

  const tx = await l2StandardTokenFactory.createStandardL2Token(
    L1TokenAddress,
    L2TokenName,
    L2TokenSymbol
  );
  const receipt = await tx.wait();
  const args = receipt.events.find(
    ({ event }) => event === "StandardL2TokenCreated"
  ).args;

  // Get the L2 token address from the emmited event and log
  const l2TokenAddress = args._l2Token;
  console.log("L2StandardERC20 deployed to:", l2TokenAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
