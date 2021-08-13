async function main() {
  const l2CustomERC20Factory = await ethers.getContractFactory("L2CustomERC20");

  console.log('deploying L2CustomERC20 to', hre.network.name)

  let l1Token;
  if (hre.network.name == 'optimism') {
    l1Token = 'TODO'  // Dev L1 token address
  } else if (hre.network.name == 'optimistic-kovan') {
    l1Token = 'TODO'  // Kovan L1 token address
  } else if (hre.network.name == 'optimistic-mainnet') {
    l1Token = 'TODO'  // Mainnet L1 token address
  } else {
    throw Error("unsupported network")
  }

  const l2CustomERC20 = await l2CustomERC20Factory.deploy(
    '0x4200000000000000000000000000000000000010',  // L2 Standard Bridge
    l1Token);                                      // L1 token

  console.log("L2 CustomERC20 deployed to:", l2CustomERC20.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });