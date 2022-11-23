#! /usr/local/bin/node

// View transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
require('dotenv').config()
const yargs = require("yargs")

argv = yargs
  .option('address', {
    description: "Address to trace",
    default: "0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F",
    type: 'string'
  })
  .help()
  .alias('help', 'h').argv;



// Global variable because we need it almost everywhere
let crossChainMessenger


const setup = async() => {
  l1provider = new ethers.providers.JsonRpcProvider(process.env.L1URL)
  l2provider = new ethers.providers.JsonRpcProvider(process.env.L2URL)

  l1chainId = (await l1provider._networkPromise).chainId
  l2chainId = (await l2provider._networkPromise).chainId  

  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: l1chainId,
      l2ChainId: l2chainId,
      l1SignerOrProvider: l1provider,
      l2SignerOrProvider: l2provider,
      bedrock: l2chainId > 420
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

    const deposits = await crossChainMessenger.getDepositsByAddress(argv.address)
    console.log(`${deposits.length} deposits by address ${argv.address}`)
    for (var i=0; i<deposits.length; i++)
      await describeTx(deposits[i])

    const withdrawals = await crossChainMessenger.getWithdrawalsByAddress(argv.address)
    console.log(`\n\n\n${withdrawals.length} withdrawals by address ${argv.address}`)
    for (var i=0; i<withdrawals.length; i++)
      await describeTx(withdrawals[i])
      
}  // main



main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
