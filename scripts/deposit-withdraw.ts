import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet, ContractFactory, Contract } from 'ethers'
import * as L2ERC20 from '../artifacts/contracts/L2ERC20.sol/L2ERC20.ovm.json'
import * as ERC20 from '../artifacts/contracts/ERC20.sol/ERC20.json'
import * as L1ERC20Deposit from '../artifacts/contracts/L1ERC20Deposit.sol/L1ERC20Deposit.json'
import { Watcher } from '@eth-optimism/watcher'
import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/../.env' });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



const main = async () => {
  const l1Provider = new JsonRpcProvider(process.env.L1_WEB3_URL)
  const l2Provider = new JsonRpcProvider(process.env.L2_WEB3_URL)
  const l1Wallet = new Wallet(process.env.USER_PRIVATE_KEY, l1Provider)
  const l2Wallet = new Wallet(process.env.USER_PRIVATE_KEY, l2Provider)

  //L2 ERC20 Config
  // const initialAmount = 1000
  const decimals = 18
  const l2Name = 'OWETH'
  const l1Name = 'WETH'
  const l1InitialSupply = 10000
  const l2WETHAddress = process.env.L2_WETH_ADDRESS
  const l2MessengerAddress = '0x4200000000000000000000000000000000000007'
  let L2_WETH

  //L1 Deposit Contract Config
  let l1WETHAddress = process.env.L1_WETH_ADDRESS
  const l1WETHDepositAddress = process.env.L1_WETH_DEPOSIT_ADDRESS
  const l1MessengerAddress = process.env.L1_MESSENGER_ADDRESS
  let L1_WETHDeposit
  let L1_WETH

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

  const logBalances = async () => {
    console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    if(L1_WETH) {
      const l1Balance = await L1_WETH.balanceOf(l1Wallet.address)
      console.log('L1 balance of', l1Wallet.address, 'is', l1Balance.toString())
    }
    if(L2_WETH) {
      const l2Balance = await L2_WETH.balanceOf(l2Wallet.address)
      console.log('L2 balance of', l2Wallet.address, 'is', l2Balance.toString())
    }
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
  }

  // Connect to L1 WETH
  if (!l1WETHAddress) {
    console.log('No L1 WETH address specified in .env - Deploying L1 WETH contract...')
    const L1ERC20Factory = new ContractFactory(ERC20.abi, ERC20.bytecode, l1Wallet)
    L1_WETH = await L1ERC20Factory.deploy(l1InitialSupply, l1Name, decimals)
    console.log('L1_WETH deployed to:', L1_WETH.address)
    l1WETHAddress = L1_WETH.address
  } else {
    console.log('Connecting to existing L1_WETH at:', l1WETHAddress)
    const L1_WETH = new Contract(l1WETHAddress, ERC20.abi, l1Wallet)
  }

  await logBalances()

  // deploy L2 ERC20
  if (l2WETHAddress) {
    L2_WETH = new Contract(l2WETHAddress, L2ERC20.abi, l2Wallet)
    console.log('Connected to existing L2_WETH at:', L2_WETH.address)
  } else {
    const L2ERC20Factory = new ContractFactory(L2ERC20.abi, L2ERC20.bytecode, l2Wallet)
    L2_WETH = await L2ERC20Factory.deploy(l2Name, decimals)
    console.log('L2_WETH deployed to:', L2_WETH.address)
  }
  await logBalances()
  
  // deploy L1 ERC20 Deposit
  if (l1WETHDepositAddress) {
    L1_WETHDeposit = new Contract(l1WETHDepositAddress, L1ERC20Deposit.abi, l1Wallet)
    console.log('Connected to existing L1_WETHDeposit at:', L1_WETHDeposit.address)
  } else {
    const L1_WETHDepositFactory = new ContractFactory(L1ERC20Deposit.abi, L1ERC20Deposit.bytecode, l1Wallet)
    L1_WETHDeposit = await L1_WETHDepositFactory.deploy(
      l1WETHAddress,
      L2_WETH.address,
      l1MessengerAddress
    )
    console.log('L1_WETHDeposit deployed to:', L1_WETHDeposit.address)
    await L1_WETHDeposit.deployTransaction.wait()
  }

  // Init L2 ERC20
  console.log('Connecting L2 WETH with L1 Deposit contract...')
  const initTx = await L2_WETH.init(l2MessengerAddress, L1_WETHDeposit.address)
  await initTx.wait()

  // Approve
  console.log('Approving L1 deposit contract...')
  const approveTx = await L1_WETH.approve(L1_WETHDeposit.address, 1)
  console.log('Approved: https://kovan.etherscan.io/tx/' + approveTx.hash)
  await approveTx.wait()

  // Deposit
  console.log('Depositing into L1 deposit contract...')
  const depositTx = await L1_WETHDeposit.deposit(1, {gasLimit: 1000000})
  console.log('Deposited: https://kovan.etherscan.io/tx/' + depositTx.hash) 
  await depositTx.wait()
  
  await logBalances()

  const [l1ToL2msgHash] = await watcher.getMessageHashesFromL1Tx(depositTx.hash)
	console.log('got L1->L2 message hash', l1ToL2msgHash)
	const l2Receipt = await watcher.getL2TransactionReceipt(l1ToL2msgHash)
  console.log('completed Deposit! L2 tx hash:', l2Receipt.transactionHash)
  
  await logBalances()

  // Withdraw
  console.log('Withdrawing from L1 deposit contract...')
  const withdrawalTx = await L2_WETH.withdraw(1, {gasLimit: 5000000})
  await withdrawalTx.wait()
  console.log('Withdrawal tx hash:' + withdrawalTx.hash) 

  await logBalances()
 
  const [l2ToL1msgHash] = await watcher.getMessageHashesFromL2Tx(withdrawalTx.hash)
  console.log('got L2->L1 message hash', l2ToL1msgHash)
  const l1Receipt = await watcher.getL1TransactionReceipt(l2ToL1msgHash)
  console.log('completed Withdrawal! L1 tx hash:', l1Receipt.transactionHash)
  await logBalances()
  process.exit(0)
}

main()
