import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async (hre: any) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const _initialSupply = hre.ethers.utils.parseEther('1000000000')
  const _name = 'My Optimisc Token'

  // Have single deploy script that decides whether it's for OVM or EVM
  await deploy('ERC20', {
    from: deployer,
    args: [_initialSupply, _name],
    log: true,
    gasPrice: hre.ethers.BigNumber.from('0')
  })
}

export default func
func.tags = ['ERC20']