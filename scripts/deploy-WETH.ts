import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet, ContractFactory, Contract } from 'ethers'
import * as L2ERC20 from '../artifacts/contracts/ERC20.sol/ERC20.ovm.json'

const main = async () => {
  const l1Provider = new JsonRpcProvider(process.env.L1_WEB3_URL)
  const l2Provider = new JsonRpcProvider(process.env.L2_WEB3_URL)
  const l1Wallet = new Wallet(process.env.L1_USER_PRIVATE_KEY, l1Provider)
  const l2Wallet = new Wallet(process.env.L2_USER_PRIVATE_KEY, l2Provider)
  const initialAmount = 1000
  const name = 'OWETH'
  const L2WETHaddress = process.env.L2_WETH_ADDRESS
  let L2_WETH

  if (L2WETHaddress) {
    L2_WETH = new Contract(L2WETHaddress, L2ERC20.abi, l2Wallet)
  } else {
    const L2ERC20Factory = new ContractFactory(L2ERC20.abi, L2ERC20.bytecode, l2Wallet)
    L2_WETH = await L2ERC20Factory.deploy(initialAmount, name)
  }
  console.log('L2_WETH', L2_WETH.address)
  const balance = await L2_WETH.balanceOf(l2Wallet.address)
  console.log('balance', balance.toString())
}

main()
