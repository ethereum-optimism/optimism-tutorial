#! /usr/local/bin/node

// Estimate the costs of an Optimistic (L2) transaction

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
const fs = require("fs")
require('dotenv').config()

const greeterJSON = JSON.parse(fs.readFileSync("Greeter.json"))

const greeterAddrs = {
  // Optimism
  "10":  "0x5825fA9cD0986F52A8Dda506564E99d24a8684D1",

  // Optimism Goerli
  "420": "0x106941459A8768f5A92b770e280555FAF817576f"
}


// Utilities
const displayWei = x => x.toString().padStart(20, " ")                        
const displayGas = x => x.toString().padStart(10, " ")
const sleep = ms => new Promise(resp => setTimeout(resp, ms));

// Get an L2 signer
const getSigner = async () => {
  const optimismGoerliUrl = 
  process.env.ALCHEMY_API_KEY ? 
    `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` :
    process.env.OPTIMISM_GOERLI_URL

    const l2RpcProvider = optimismSDK.asL2Provider(
      new ethers.providers.JsonRpcProvider(optimismGoerliUrl)
    )
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).
      connect(l2RpcProvider)

    return wallet
}   // getSigner


// Get estimates from the SDK
const getEstimates = async (provider, tx) => {
  return {
    totalCost: await provider.estimateTotalGasCost(tx),
    l1Cost: await provider.estimateL1GasCost(tx),
    l2Cost: await provider.estimateL2GasCost(tx),
    l1Gas: await provider.estimateL1Gas(tx)
  }
}    // getEstimates



const displayResults = (estimated, real) => {
  console.log(`Estimates:`)
  console.log(`   Total gas cost: ${displayWei(estimated.totalCost)} wei`)
  console.log(`      L1 gas cost: ${displayWei(estimated.l1Cost)} wei`)
  console.log(`      L2 gas cost: ${displayWei(estimated.l2Cost)} wei`)

  console.log(`\nReal values:`)    
  console.log(`   Total gas cost: ${displayWei(real.totalCost)} wei`)
  console.log(`      L1 gas cost: ${displayWei(real.l1Cost)} wei`)
  console.log(`      L2 gas cost: ${displayWei(real.l2Cost)} wei`)

  console.log(`\nL1 Gas:`)
  console.log(`      Estimate: ${displayGas(estimated.l1Gas)}`)
  console.log(`          Real: ${displayGas(real.l1Gas)}`)  
  console.log(`    Difference: ${displayGas(real.l1Gas-estimated.l1Gas)}`)
  
  console.log(`\nL2 Gas:`)
  console.log(`      Estimate: ${displayGas(estimated.l2Gas)}`)
  console.log(`          Real: ${displayGas(real.l2Gas)}`)  
  console.log(`    Difference: ${displayGas(real.l2Gas-estimated.l2Gas)}`)
}   // displayResults



const main = async () => {    
    
    const signer = await getSigner()
    const chainId = (await signer.provider._networkPromise).chainId

    if(!greeterAddrs[chainId]) {
      console.log(`I don't know the Greeter address on chainId: ${chainId}`)
      process.exit(-1)  
    }

    const Greeter = new ethers.ContractFactory(greeterJSON.abi, greeterJSON.bytecode, signer)
    const greeter = Greeter.attach(greeterAddrs[chainId])

    const greeting = "Hello!"

    let real = {}

    const fakeTxReq = await greeter.populateTransaction.setGreeting(greeting)
    const fakeTx = await signer.populateTransaction(fakeTxReq)
    console.log("About to get estimates")
    let estimated = await getEstimates(signer.provider, fakeTx)
    estimated.l2Gas = await greeter.estimateGas.setGreeting(greeting)

    let realTx, realTxResp
    const weiB4 = await signer.getBalance()

    // If the transaction fails, error out with additional information
    try {
      console.log("About to create the transaction")
      realTx = await greeter.setGreeting(greeting)
      console.log("Transaction created, submitting it")
      realTxResp = await realTx.wait()
      console.log("Transaction processed")
    } catch (err) {
      console.log(`Error: ${err}`)
      console.log(`Coming from address: ${await signer.getAddress()} on Optimistic ${network}`)
      console.log(`            balance: ${displayWei(await signer.getBalance())} wei`)
      process.exit(-1)
    }

    // If the balance hasn't been updated yet, wait 0.1 sec
    real.totalCost = 0
    while (real.totalCost === 0) {
        const weiAfter = await signer.getBalance()
        real.totalCost= weiB4-weiAfter
        await sleep(100)
    }

    // Get the real information (cost, etc.) from the transaction response
    real.l1Gas = realTxResp.l1GasUsed
    real.l2Gas = realTxResp.gasUsed
    real.l1Cost = realTxResp.l1Fee 
    real.l2Cost = real.totalCost - real.l1Cost

    displayResults(estimated, real)
        
}  // main


main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

