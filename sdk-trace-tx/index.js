#! /usr/local/bin/node

// Trace transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")

const optimismSDK = require("@eth-optimism/sdk")

const network = "mainnet"    // "kovan" or "mainnet"

const l2Url = "https://opt-mainnet.g.alchemy.com/v2/EHUzqY2-7spMMmNp7am0vKmnhb5YCZ9x" // `https://${network}.optimism.io`
const l1Url = "https://eth-mainnet.alchemyapi.io/v2/CLpekP96ZEbnzo0PoQZWr4pZMvwoz1_m"


// Global variable because we need them almost everywhere
let crossChainMessenger


const setup = async() => {
  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: network === "kovan" ? 42 : 1,    
      l1SignerOrProvider: new ethers.providers.JsonRpcProvider(l1Url),
      l2SignerOrProvider: new ethers.providers.JsonRpcProvider(l2Url)
  })
}    // setup




// Describe a cross domain transaction, either deposit or withdrawal
const describeTx = async tx => {
  console.log(`tx:${tx.transactionHash}`)
  // Assume all tokens have decimals = 18
  console.log(`\tAmount: ${tx.amount/1e18} of ${tx.l1Token}`)
  console.log(`\tRelayed: ${await crossChainMessenger.getMessageStatus(tx.transactionHash)  
                              == optimismSDK.MessageStatus.RELAYED}`)
  console.log(`\n`)
}  // describeTx


const main = async () => {    
    await setup()

    // The address we trace
    const addr = "0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F"

    const deposits = await crossChainMessenger.getDepositsByAddress(addr)
    console.log(`Deposits by address ${addr}`)
    for (var i=0; i<deposits.length; i++)
      describeTx(deposits[i])

    const withdrawals = await crossChainMessenger.getWithdrawalsByAddress(addr)
    console.log(`\n\n\nWithdrawals by address ${addr}`)
    for (var i=0; i<withdrawals.length; i++)
      describeTx(withdrawals[i])

    // Some extra fields compared to the get<verb>ByAddress results
//    const l1toL2msg = (await crossChainMessenger.getMessagesByTransaction(depositHash))[0]
//    const l2toL1msg = (await crossChainMessenger.getMessagesByTransaction(withdrawalHash))[0]

    // Get the status to see if the messages are fully processed
//    const depositStatus = await crossChainMessenger.getMessageStatus(depositHash)
//    console.log(`Relayed? ${depositStatus == optimismSDK.MessageStatus.RELAYED}`)
}  // main



main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })