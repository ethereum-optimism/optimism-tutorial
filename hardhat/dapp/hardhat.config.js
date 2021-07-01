require("@nomiclabs/hardhat-waffle");
require('@eth-optimism/hardhat-ovm')


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.6",
  networks: {
    // Add this network to your config!
    optimistic: {
       url: 'http://127.0.0.1:8545',
       accounts: {
          mnemonic: 'test test test test test test test test test test test junk'
       },
       // This sets the gas price to 0 for all transactions on L2. We do this
       // because account balances are not automatically initiated with an ETH
       // balance (yet, sorry!).
       gasPrice: 0,
       ovm: true // This sets the network as using the ovm and ensure contract will be compiled against that.
    }
  }
};

