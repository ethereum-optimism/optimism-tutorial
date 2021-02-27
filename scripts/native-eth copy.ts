import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { Wallet, ContractFactory, Contract } from 'ethers'
import { Watcher } from '@eth-optimism/watcher'
import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/../.env' });

import { getContractInterface } from '@eth-optimism/contracts'


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const main = async () => {
  // Grab wallets for both chains
  const l1Provider = new JsonRpcProvider(process.env.L1_WEB3_URL)
  const l2Provider = new JsonRpcProvider(process.env.L2_WEB3_URL)
  const l1Wallet = new Wallet(process.env.USER_PRIVATE_KEY, l1Provider)
  const l2Wallet = new Wallet(process.env.USER_PRIVATE_KEY, l2Provider)
  
  // Grab messenger addresses
  const l1MessengerAddress = process.env.L1_MESSENGER_ADDRESS
  const l2MessengerAddress = '0x4200000000000000000000000000000000000007'

  // Grab existing addresses if specified
  // let l1ERC20Address = process.env.L1_ERC20_ADDRESS
  // const l1ERC20GatewayAddress = process.env.L1_ERC20_GATEWAY_ADDRES

  const l1ETHGatewayAddress = process.env.L1_ETH_GATEWAY_ADDRESS

  // init watcher
  const watcher = new Watcher({
    l1: {
      provider: l1Provider,
      messengerAddress: l1MessengerAddress
    },
    l2: {
      provider: l2Provider,
      messengerAddress: l2MessengerAddress
    }
  })

  const OVM_L1ETHGateway  = new Contract(
    l1ETHGatewayAddress,
    getContractInterface('OVM_L1ETHGateway'),
    l1Wallet
  )
  const OVM_L2ETHGateway = new Contract(
    '0x4200000000000000000000000000000000000006',
    getContractInterface('OVM_L2ERC20Gateway'),
    l2Wallet
  )

  // console.log('addresses are')
  // console.log([l1ERC20GatewayAddress, OVM_L1ETHGateway.address])
  
   const logBalances = async (description: string = '') => {
     console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ' + description + ' ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
       const l1UserBalance = await l1Provider.send('eth_getBalance', [l1Wallet.address])
       console.log('L1 balance of l1 wallet ', l1Wallet.address, 'is', l1UserBalance.toString(10))
       const l1GatewayBalance = await l1Provider.send('eth_getBalance', [OVM_L1ETHGateway.address])
       console.log('L1 balance of l1 gateway ', OVM_L1ETHGateway.address, 'is', l1GatewayBalance.toString())
       const l2Balance = await OVM_L2ETHGateway.balanceOf(l2Wallet.address)
       console.log('L2 balance of l2 wallet ', l2Wallet.address, 'is', l2Balance.toString())
     console.log('~'.repeat(description.length) + '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
   }


   await logBalances('initial:')
   
  // console.log('here is code')
  // console.log(await l1Provider.send('eth_getCode', [OVM_L1ETHGateway.address]))

  console.log('here is the OVM_L1ETHGateway l2 erc20:')
  console.log(await OVM_L1ETHGateway.l2ERC20Gateway())
  // console.log('here is OVM_L1ETHGateway the messenger:')
  // console.log(await OVM_L1ETHGateway.messenger())

  const depositTx = await OVM_L1ETHGateway.deposit({value: 10, gasLimit: '0x100000'})
  await depositTx.wait()

  const [l1ToL2msgHash] = await watcher.getMessageHashesFromL1Tx(depositTx.hash)
	console.log('got L1->L2 message hash', l1ToL2msgHash)
	const l2Receipt = await watcher.getL2TransactionReceipt(l1ToL2msgHash)
  console.log('completed Deposit! L2 tx hash:', l2Receipt.transactionHash)
  
  await logBalances('Post-deposit:')

  // Withdraw
  console.log('Withdrawing from L1 deposit contract...')
  const withdrawalTx = await OVM_L2ETHGateway.withdraw(1, {gasLimit: 5000000})
  await withdrawalTx.wait()
  console.log('Withdrawal tx hash:' + withdrawalTx.hash) 

  await logBalances()
 
  const [l2ToL1msgHash] = await watcher.getMessageHashesFromL2Tx(withdrawalTx.hash)
  console.log('got L2->L1 message hash', l2ToL1msgHash)
  const l1Receipt = await watcher.getL1TransactionReceipt(l2ToL1msgHash)
  console.log('completed Withdrawal! L1 tx hash:', l1Receipt.transactionHash)
  await logBalances()


  // // Approve
  // console.log('Approving L1 deposit contract...')
  // const approveTx = await L1_ERC20.approve(OVM_L1ERC20Gateway.address, 1)
  // console.log('Approved: https://kovan.etherscan.io/tx/' + approveTx.hash)
  // await approveTx.wait()

  // // Deposit
  // console.log('Depositing into L1 deposit contract...')
  // const depositTx = await OVM_L1ERC20Gateway.deposit(1, {gasLimit: 1000000})
  // console.log('Deposited: https://kovan.etherscan.io/tx/' + depositTx.hash) 
  // await depositTx.wait()
  
  // await logBalances()

  // const [l1ToL2msgHash] = await watcher.getMessageHashesFromL1Tx(depositTx.hash)
	// console.log('got L1->L2 message hash', l1ToL2msgHash)
	// const l2Receipt = await watcher.getL2TransactionReceipt(l1ToL2msgHash)
  // console.log('completed Deposit! L2 tx hash:', l2Receipt.transactionHash)
  
  // await logBalances()

  // // Withdraw
  // console.log('Withdrawing from L1 deposit contract...')
  // const withdrawalTx = await OVM_L2ERC20Gateway.withdraw(1, {gasLimit: 5000000})
  // await withdrawalTx.wait()
  // console.log('Withdrawal tx hash:' + withdrawalTx.hash) 

  // await logBalances()
 
  // const [l2ToL1msgHash] = await watcher.getMessageHashesFromL2Tx(withdrawalTx.hash)
  // console.log('got L2->L1 message hash', l2ToL1msgHash)
  // const l1Receipt = await watcher.getL1TransactionReceipt(l2ToL1msgHash)
  // console.log('completed Withdrawal! L1 tx hash:', l1Receipt.transactionHash)
  // await logBalances()
}

main()
