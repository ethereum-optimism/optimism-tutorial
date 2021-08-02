// Plugins
require('@nomiclabs/hardhat-ethers')
require('@eth-optimism/hardhat-ovm')

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
      },
      gasPrice: 0,
      ovm: true // This sets the network as using the ovm and ensure contract will be compiled against that.
    }
  },
  solidity: '0.7.6',
  ovm: {
    solcVersion: '0.7.6'
  }
}
