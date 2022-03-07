
// Estimate the costs of an Optimistic (L2) transaction

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
const fs = require("fs")

const greeterJSON = JSON.parse(fs.readFileSync("Greeter.json"))

const network = "kovan"    // "kovan" or "mainnet"

const mnemonic = "test test test test test test test test test test test junk"

const l2Url = `https://${network}.optimism.io`
const greeterAddr = network === "kovan" ? 
                        "0xE0A5fe4Fd70B6ea4217122e85d213D70766d6c2c" :
                        "0x5825fA9cD0986F52A8Dda506564E99d24a8684D1"


// Utilities
const displayWei = x => x.toString().padStart(20, " ")                        
const displayGas = x => x.toString().padStart(10, " ")
const sleep = ms => new Promise(resp => setTimeout(resp, ms));

// Get an L2 signer
const getSigner = async () => {
    const l2RpcProvider = optimismSDK.asL2Provider(new ethers.providers.JsonRpcProvider(l2Url))
    const privateKey = ethers.utils.HDNode.fromMnemonic(mnemonic).privateKey
    const wallet = new ethers.Wallet(privateKey, l2RpcProvider)

    return wallet
}   // getSigner


// Get estimates from the SDK
const getEstimates = async (provider, tx) => {
  let retVal = {}
  retVal.totalCost = await provider.estimateTotalGasCost(tx)
  retVal.l1Cost    = await provider.estimateL1GasCost(tx)
  retVal.l2Cost    = await provider.estimateL2GasCost(tx)
  retVal.l1Gas     = await provider.estimateL1Gas(tx)
  return retVal
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

    const Greeter = new ethers.ContractFactory(greeterJSON.abi, greeterJSON.bytecode, signer)
    const greeter = Greeter.attach(greeterAddr)

    const greeting = "Hello!"

    let real = {}

    const fakeTxReq = await greeter.populateTransaction.setGreeting(greeting)
    const fakeTx = await signer.populateTransaction(fakeTxReq)
    delete fakeTx.from
    delete fakeTx.chainId

    let estimated = await getEstimates(signer.provider, fakeTx)
    estimated.l2Gas = await greeter.estimateGas.setGreeting(greeting)

    // If the transaction fails, error out with additional information
    let realTx, realTxResp
    const weiB4 = await signer.getBalance()
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
        sleep(100)
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

