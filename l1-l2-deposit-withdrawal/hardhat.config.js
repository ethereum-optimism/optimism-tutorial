// Plugins
require('@nomiclabs/hardhat-ethers')
require('@eth-optimism/hardhat-ovm')

// Load environment variables from .env
require('dotenv').config();

module.exports = {
  networks: {
    optimism: {
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      gasPrice: 15000000,
      ovm: true // This sets the network as using the ovm and ensure contract will be compiled against that.
    },
    'optimism-kovan': {
      chainId: 69,
      url: 'https://kovan.optimism.io',
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 15000000,
      ovm: true
    },
    'optimism-mainnet': {
      chainId: 10,
      url: 'https://mainnet.optimism.io',
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 15000000,
      ovm: true
    }
  },
  solidity: '0.7.6',
  ovm: {
    solcVersion: '0.7.6'
  }
}
