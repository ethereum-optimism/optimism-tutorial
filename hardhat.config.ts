import { HardhatUserConfig } from 'hardhat/types'

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import 'dotenv/config'
import 'hardhat-gas-reporter'
import '@eth-optimism/plugins/hardhat/compiler'
import 'hardhat-deploy'

const config: HardhatUserConfig = {
  defaultNetwork: 'localhost',
  namedAccounts: {
    deployer: 0
  },
  solidity: '0.7.6',
  ovm: {
    solcVersion: '0.7.6'
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:9545', // EVM L1 Chain
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      tags: ['local', 'L1']
    },
    staging: {
      url: 'http://127.0.0.1:8545', // OVM L2 Chain
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      tags: ['local', 'L2']
    }
  },
  mocha: {
    timeout: 0,
  }
}

export default config
