#! /usr/local/bin/node

// View transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
require('dotenv').config()

// Global variable because we need them almost everywhere
let crossChainMessenger


const setup = async() => {

  l1SignerOrProvider = new ethers.providers.JsonRpcProvider(process.env.L1URL)
  l2SignerOrProvider = new ethers.providers.JsonRpcProvider(process.env.L2URL)

  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: (await l1SignerOrProvider._networkPromise).chainId,
      l2ChainId: (await l2SignerOrProvider._networkPromise).chainId,      
      l1SignerOrProvider: l1SignerOrProvider,
      l2SignerOrProvider: l2SignerOrProvider
  })
}    // setup


// Only the part of the ABI we need to get the symbol
const ERC20ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
        {
            "name": "",
            "type": "string"
        }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
]     // ERC20ABI



const getSymbol = async l1Addr => {
  if (l1Addr == '0x0000000000000000000000000000000000000000')
    return "ETH"
  const l1Contract = new ethers.Contract(l1Addr, ERC20ABI, crossChainMessenger.l1SignerOrProvider)
  return await l1Contract.symbol()  
}   // getSymbol

// Describe a cross domain transaction, either deposit or withdrawal
const describeTx = async tx => {
  console.log(`tx:${tx.transactionHash}`)
  // Assume all tokens have decimals = 18
  console.log(`\tAmount: ${tx.amount/1e18} ${await getSymbol(tx.l1Token)}`)
  console.log(`\tRelayed: ${await crossChainMessenger.getMessageStatus(tx.transactionHash)  
                              == optimismSDK.MessageStatus.RELAYED}`)
}  // describeTx


const main = async () => {    
    await setup()

    // The address we trace
    const addr = "0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F"

    const deposits = await crossChainMessenger.getDepositsByAddress(addr)
    console.log(`Deposits by address ${addr}`)
    for (var i=0; i<deposits.length; i++)
      await describeTx(deposits[i])

    const withdrawals = await crossChainMessenger.getWithdrawalsByAddress(addr)
    console.log(`\n\n\nWithdrawals by address ${addr}`)
    for (var i=0; i<withdrawals.length; i++)
      await describeTx(withdrawals[i])
      
}  // main



main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })