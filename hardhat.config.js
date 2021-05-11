require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')
require('@eth-optimism/hardhat-ovm')
require('hardhat-deploy')

module.exports = {
  networks: {
    hardhat: {
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      }
    }
  },
  solidity: '0.7.6',
  ovm: {
    solcVersion: '0.7.6'
  },
  namedAccounts: {
    deployer: 0
  },
}