import hre from 'hardhat'
import { Wallet } from 'ethers'

const main = async () => {
  const ethers = (hre as any).l2ethers

  const provider = new ethers.providers.JsonRpcProvider(
    'http://localhost:8545'
  )

  const wallet = new Wallet('0x' + 'FF'.repeat(64), provider)

  const erc20fac = await ethers.getContractFactory('ERC20')
  const erc20 = await erc20fac.connect(wallet).deploy(
    1_000_000,
    'fucc'
  )

  await erc20.deployTransaction.wait()

  console.log(erc20.address)
  console.log(await provider.getCode(erc20.address))
  console.log((await erc20.balanceOf(wallet.address)).toNumber())
}

main()