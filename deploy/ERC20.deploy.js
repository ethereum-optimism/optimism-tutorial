// Just a standard hardhat-deploy deployment definition file!
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const initialSupply = 1_000_000
  const name = 'My Optimistic Token'

  await deploy('ERC20', {
    from: deployer,
    args: [initialSupply, name],
    gasPrice: hre.ethers.BigNumber.from('0'),
    log: true
  })
}

func.tags = ['ERC20']
export default func
