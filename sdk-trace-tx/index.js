#! /usr/local/bin/node

// Trace transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")

const optimismSDK = require("@eth-optimism/sdk")

const network = "mainnet"    // "kovan" or "mainnet"

const l2Url = "https://opt-mainnet.g.alchemy.com/v2/EHUzqY2-7spMMmNp7am0vKmnhb5YCZ9x" // `https://${network}.optimism.io`
const l1Url = "https://eth-mainnet.alchemyapi.io/v2/CLpekP96ZEbnzo0PoQZWr4pZMvwoz1_m"


// Global variable because we need them almost everywhere
let crossChainMessenger

const getProviders = async () => {
    let l1Provider

    if (l1Url) {
      l1Provider = new ethers.providers.JsonRpcProvider(l1Url)    
    } else  {
      l1Provider = new ethers.providers.getDefaultProvider(network)
    }


    const l2Provider = new ethers.providers.JsonRpcProvider(l2Url)

    return [l1Provider, l2Provider]
}   // getProviders


const setup = async() => {
  const [l1Provider, l2Provider] = await getProviders()
  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: network === "kovan" ? 42 : 1,    
      l1SignerOrProvider: l1Provider,
      l2SignerOrProvider: l2Provider
  })
}





const main = async () => {    
    await setup()

    // The address we trace
    const addr = "0x5030a9280a75cB91cc70d0Bf3B02c14d3b01d327"

    const deposits = await crossChainMessenger.getDepositsByAddress(addr)
    const depositHash = deposits[0].transactionHash
    console.log(`${deposits.length}  ${depositHash}`)
    console.log(deposits[0])


    const withdrawals = await crossChainMessenger.getWithdrawalsByAddress(addr, /*
      {
          fromBlock: 15000,
          toBlock: 24000
      } */ )
    const withdrawalHash = withdrawals[0].transactionHash      
    console.log(`${withdrawals.length} ${withdrawalHash}`)   
    
    const L1toL2msgs = await crossChainMessenger.getMessagesByTransaction(depositHash)
    console.log(L1toL2msgs)    

    const L2toL1msgs = await crossChainMessenger.getMessagesByTransaction(withdrawalHash)
    console.log(L2toL1msgs)     
}  // main



main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })