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
    'optimism-goerli': {
      chainId: 420,
      url: `https://opt-goerli.g.alchemy.com/v2/${process.env.L2_ALCHEMY_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    'optimism-mainnet': {
      chainId: 10,
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.L2_ALCHEMY_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
  solidity: '0.8.9',
}
