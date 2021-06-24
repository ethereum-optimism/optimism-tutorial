require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')
require('hardhat-deploy')
require('@eth-optimism/hardhat-ovm')

module.exports = {
  networks: {
    // Add this network to your config!
    optimism: {
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      // This sets the gas price to 0 for all transactions on L2. We do this
      // because account balances are not automatically initiated with an ETH
      // balance (yet, sorry!).
      gasPrice: 0,
      ovm: true // This sets the network as using the ovm and ensure contract will be compiled against that.
    },
    hardhat: {
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      }
    }
  },
  solidity: '0.8.4',
  ovm: {
    solcVersion: '0.8.4'
  },
  namedAccounts: {
    deployer: 0
  },
}
