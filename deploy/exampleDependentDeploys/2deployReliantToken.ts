import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const _initialSupply = hre.ethers.utils.parseEther('1000000000')
  const _name = 'My Reliant Token'

  // The contract name of this dependency
  await deploy('TheReliantToken', {
    from: deployer,
    args: [_initialSupply, _name],
    log: true,
    gasPrice: hre.ethers.BigNumber.from('0')
  })
}

export default func
// The required tag for this deploy script to be found and executed AFTER
// `deployWithDependencies` is executed.
func.tags = ['TheReliantToken'] // `func.tags` accepts `string[]` for many deps