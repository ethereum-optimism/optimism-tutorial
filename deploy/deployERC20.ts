import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const _initialSupply = hre.ethers.utils.parseEther('1000000000')
  const _name = 'My Optimisc Token'

  await deploy('ERC20', {
    from: deployer,
    args: [_initialSupply, _name],
    gasPrice: hre.ethers.BigNumber.from('0'),
    log: true
  })
}

export default func
func.tags = ['ERC20']