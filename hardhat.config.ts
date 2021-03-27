import { HardhatUserConfig } from 'hardhat/types'

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'

import '@eth-optimism/plugins/hardhat/compiler'

const config: HardhatUserConfig = {
  solidity: "0.7.3",
};

export default config
