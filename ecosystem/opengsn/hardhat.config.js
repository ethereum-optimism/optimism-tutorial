// Plugins
require('@nomiclabs/hardhat-ethers')

// No need for a real mnemonic when you send free transactions
junkMnemonic = 'test test test test test test test test test test test junk'


module.exports = {
  networks: {
    hardhat: {
      accounts: {
        mnemonic: junkMnemonic
      }
    },
    'optimistic-kovan-orig': {
      chainId: 69,
      url: 'https://kovan.optimism.io',
      accounts: {
         mnemonic: junkMnemonic
      }
    },    
    'optimistic-mainnet': {
      chainId: 10,
      url: 'https://mainnet.optimism.io',
      accounts: {
         mnemonic: junkMnemonic
      }
    },
  },
  solidity: '0.8.9',
}
