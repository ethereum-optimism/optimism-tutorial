require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


const mnemonic = '<<< your mnemonic here >>>'   
// "test test test test test test test test test test test junk"


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
     "optimistic-kovan": {
        url: 'https://kovan.optimism.io',
        accounts: { mnemonic: mnemonic }
      },
      "kovan": {
        url: '<<< your URL here >>>'
        accounts: { mnemonic: mnemonic }
      }
  } 
};
