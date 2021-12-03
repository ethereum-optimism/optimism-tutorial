// Plugins
require('@nomiclabs/hardhat-ethers')

// Load environment variables from .env
require('dotenv').config();

module.exports = {
  networks: {
    'optimistic-kovan': {
      chainId: 69,
      url: 'https://kovan.optimism.io',
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 15000000,
    },
    'optimistic-mainnet': {
      chainId: 10,
      url: 'https://mainnet.optimism.io',
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 15000000,
    }
  },
  solidity: '0.8.9',
}
