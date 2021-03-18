/**
 * @dev How does having these deploy commands effect multi-contract
 *      deployments?
 * 
 * Commands in `package.json`: 
 * "evmDeploy": "yarn hardhat --network localhost deploy --tags",
 * "ovmDeploy": "yarn hardhat --network staging deploy --tags"
 * 
 * @notice Caveats:
 *     1. Cannot chain deploys with a command itself, e.g. something like the
 *        following does NOT work:
 *        `yarn evmDeploy ERC20 ERC20-ovm` || `yarn ovmDeploy ERC20 ERC20-ovm`
 * 
 *     2. Tedious to run consecutive deploys by repeating the deploy command:
 *        `yarn evmDeploy contract1 && yarn evmDeploy contract2 && ...`
 * 
 * @notice Sol:
 *     1. [CUR-SOL] Specify whether deploy is for EVM or OVM in `.json` name itself.
 *        This approach still needs to use a custom node-deploy script in 
 *        `package.json` 
 * 
 *     2. Use custom `hardhat-deploy` to auto-detect whether `.json` is for EVM
 *        or OVM. 
 *        However, EVM and OVM deploys require different networks which makes this 
 *        approach difficult. 
 *        This approach would also use a custom node-deploy script in `package.json` 
 *        (since the solution I imagine would be to add another flag to the 
 *        hardhat-deploy CLI to enable EVM or OVM deploys).
 */

import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const _initialSupply = hre.ethers.utils.parseEther('1000000000')
  const _name = 'My Optimistic ERC20 Token'

  await deploy('ERC20-ovm', {
    from: deployer,
    args: [_initialSupply, _name],
    log: true,
    gasPrice: hre.ethers.BigNumber.from('0')
  })
}

export default func
func.tags = ['ERC20-ovm']
func.dependencies = ['TheReliantToken']
