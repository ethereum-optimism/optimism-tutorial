// Plugins
require('@nomiclabs/hardhat-ethers')

// Load environment variables from .env
require('dotenv').config();

module.exports = {
  networks: {
    hardhat: {
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      }
    },
    optimism: {
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      }
    },
    'optimistic-kovan': {
      chainId: 69,
      url: 'https://opt-kovan.g.alchemy.com/v2/alJzQdUTzE-X9Z3Ahzzo-5eCFvRQxRNt', // 'https://kovan.optimism.io',
      accounts: {
         mnemonic: process.env.MNEMONIC
      }
    },
    'optimistic-kovan-orig': {
      chainId: 69,
      url: 'https://kovan.optimism.io',
      accounts: {
         mnemonic: process.env.MNEMONIC
      }
    },    
    'optimistic-mainnet': {
      chainId: 10,
      url: 'https://mainnet.optimism.io',
      accounts: {
         mnemonic: process.env.MNEMONIC
      }
    },
  },
  solidity: '0.8.9',
}
