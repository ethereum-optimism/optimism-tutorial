// Plugins
require('@nomiclabs/hardhat-ethers')

// Load environment variables from .env
require('dotenv').config();

module.exports = {
  networks: {
    'optimistic-kovan': {
      chainId: 69,
      url: 'https://kovan.optimism.io',
      accounts: [process.env.PRIVATE_KEY ||
       '0x0000000000000000000000000000000000000000000000000000000000000000']
    },
    'optimistic-mainnet': {
      chainId: 10,
      url: 'https://mainnet.optimism.io',
      accounts: [process.env.PRIVATE_KEY ||
       '0x0000000000000000000000000000000000000000000000000000000000000000']
    },
    'optimistic-devnode': {
      url: 'http://127.0.0.1:8545',
      accounts: { mnemonic: 'test test test test test test test test test test test junk' }
    }
  },
  solidity: '0.8.9'
}



