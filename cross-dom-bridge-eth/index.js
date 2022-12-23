#! /usr/local/bin/node

// Transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
require('dotenv').config()
const yargs = require("yargs")


const argv = yargs
  .option('network', {
    // All of those choices are Optimism:
    // goerli - Optimism Goerli, the main test network
    // bedrock - Bedrock version of Optimism Bedrock, our next release
    choices: ["goerli", "bedrock"],
    description: 'Optimistm network to use'
  })
  .help()
  .alias('help', 'h').argv;

const mnemonic = process.env.MNEMONIC

const words = process.env.MNEMONIC.match(/[a-zA-Z]+/g).length
validLength = [12, 15, 18, 24]
if (!validLength.includes(words)) {
   console.log(`The mnemonic (${process.env.MNEMONIC}) is the wrong number of words`)
   process.exit(-1)
}

const l1Url = `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_ALCHEMY_KEY}`

let l2Url

switch(argv.network) {
  case "goerli":
    l2Url = `https://opt-goerli.g.alchemy.com/v2/${process.env.OPTIMISM_GOERLI_ALCHEMY_KEY}`
    break
  case "bedrock":
    l2Url = 'https://bedrock-beta-1-replica-0.optimism.io'
    break
}


// Global variable because we need them almost everywhere
let crossChainMessenger
let addr    // Our address

const getSigners = async () => {
    const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)
    const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic)
    const privateKey = hdNode.derivePath(ethers.utils.defaultPath).privateKey
    const l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider)
    const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider)

    return [l1Wallet, l2Wallet]
}   // getSigners


const setup = async() => {
  const [l1Signer, l2Signer] = await getSigners()
  addr = l1Signer.address
  crossChainMessengerOpts = {
    l1ChainId: 5,    // Goerli value, 1 for mainnet
    l2ChainId: argv.network == "goerli" ? 420 : 902,  // 10 for mainnet
    l1SignerOrProvider: l1Signer,
    l2SignerOrProvider: l2Signer,
    bedrock: argv.network == "bedrock"
  }
  if (crossChainMessengerOpts.bedrock) {
    crossChainMessengerOpts.contracts = {
      l1: {
        "StateCommitmentChain": "0xAc92cEc51dFA387F37590Bc1DC049F50AB99D8eC",
        "L1CrossDomainMessenger": "0x3e654CBd61711dC9D114b61813846b6401695f07",
        "L1StandardBridge": "0x3F0135534453CEC0eA94187C62bF80EF21dc9C91",
        "CanonicalTransactionChain": "0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001",
        "OptimismPortal": "0xf91795564662DcC9a17de67463ec5BA9C6DC207b",
        "L2OutputOracle": "0xAc92cEc51dFA387F37590Bc1DC049F50AB99D8eC",

        // No longer needed, but a value is required
        "AddressManager": "0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001",
        "BondManager": "0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001"
      }
    }
    crossChainMessengerOpts.bridges = 
    {
      ETH: {
        l1Bridge: "0x3F0135534453CEC0eA94187C62bF80EF21dc9C91",
        l2Bridge: "0x4200000000000000000000000000000000000010"
      }
    } 
  }

  console.log(crossChainMessengerOpts)
  crossChainMessenger = new optimismSDK.CrossChainMessenger(crossChainMessengerOpts)
}    // setup



const gwei = BigInt(1e9)
const eth = gwei * gwei   // 10^18
const centieth = eth/100n


const reportBalances = async () => {
  const l1Balance = (await crossChainMessenger.l1Signer.getBalance()).toString().slice(0,-9)
  const l2Balance = (await crossChainMessenger.l2Signer.getBalance()).toString().slice(0,-9)

  console.log(`On L1:${l1Balance} Gwei    On L2:${l2Balance} Gwei`)
}    // reportBalances


const depositETH = async () => {

  console.log("Deposit ETH")
  await reportBalances()
  const start = new Date()

  console.log(crossChainMessenger)

  const response = await crossChainMessenger.depositETH(gwei)
  console.log(`Transaction hash (on L1): ${response.hash}`)
  await response.wait()
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)
  await crossChainMessenger.waitForMessageStatus(response.hash,
                                                  optimismSDK.MessageStatus.RELAYED)

  await reportBalances()
  console.log(`depositETH took ${(new Date()-start)/1000} seconds\n\n`)
}     // depositETH()





const withdrawETH = async () => { 
  
  console.log("Withdraw ETH")
  const start = new Date()  
  await reportBalances()

  const response = await crossChainMessenger.withdrawETH(centieth)
  console.log(`Transaction hash (on L2): ${response.hash}`)
  await response.wait()

  console.log("Waiting for status to change to IN_CHALLENGE_PERIOD")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response.hash, 
    optimismSDK.MessageStatus.IN_CHALLENGE_PERIOD)
  console.log("In the challenge period, waiting for status READY_FOR_RELAY") 
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response.hash, 
                                                optimismSDK.MessageStatus.READY_FOR_RELAY) 
  console.log("Ready for relay, finalizing message now")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.finalizeMessage(response)
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)  
  await crossChainMessenger.waitForMessageStatus(response, 
    optimismSDK.MessageStatus.RELAYED)
  await reportBalances()   
  console.log(`withdrawETH took ${(new Date()-start)/1000} seconds\n\n\n`)  
}     // withdrawETH()


const main = async () => {
    await setup()
    await depositETH()
    await withdrawETH()
}  // main



main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })





