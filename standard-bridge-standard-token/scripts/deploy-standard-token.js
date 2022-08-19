// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const L2StandardTokenFactoryArtifact = require(`../node_modules/@eth-optimism/contracts/artifacts/contracts/L2/messaging/L2StandardTokenFactory.sol/L2StandardTokenFactory.json`);
const ERC20Artifact = require('../node_modules/@openzeppelin/contracts/build/contracts/ERC20.json')

async function main() {
  const L1TokenAddress = process.env.L1_TOKEN_ADDRESS;
  const L2TokenName = process.env.L2_TOKEN_NAME;
  const L2TokenSymbol = process.env.L2_TOKEN_SYMBOL;

  console.log(
    "Creating instance of L2StandardERC20 on",
    hre.network.name,
    "network"
  );

  // Instantiate the Standard token factory
  const l2StandardTokenFactory = new ethers.Contract(
    "0x4200000000000000000000000000000000000012",
    L2StandardTokenFactoryArtifact.abi,
    await ethers.getSigner()
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

  // Get the number of decimals
  const erc20 = new ethers.Contract(
    l2TokenAddress,
    ERC20Artifact.abi,
    ethers.provider
  );
  const decimals = await erc20.decimals()

  // Get the networks' names
  // chainId is not immediately available, but by this time we have run a transaction
  let l1net, l2net;
  if (ethers.provider._network.chainId == 10) {
    // mainnet
    l1net = "ethereum"
    l2net = "optimism"
  } else {
    l1net = "goerli"
    l2net = "optimism-goerli"
  }

  // Output a usable `data.json`:
  console.log(`
{
    "name": "${L2TokenName}",
    "symbol": "${L2TokenSymbol}",
    "decimals": ${decimals},
    "tokens": {
      "${l1net}": {
        "address": "${process.env.L1_TOKEN_ADDRESS}"
      },
      "${l2net}": {
        "address": "${l2TokenAddress}"
      }
    }
}
  `)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
