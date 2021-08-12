// Plugins
require('@nomiclabs/hardhat-ethers')
require('@eth-optimism/hardhat-ovm')

// Load environment variables from .env
require('dotenv').config();

module.exports = {
  networks: {
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
