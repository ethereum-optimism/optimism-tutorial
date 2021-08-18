#! /usr/local/bin/node --trace-warnings

// For the package whose source code is at
// https://github.com/ethereum-optimism/optimism/blob/develop/packages/core-utils/src/watcher.ts

const Watcher = require('@eth-optimism/watcher').Watcher
const JsonRpcProvider = require('@ethersproject/providers').JsonRpcProvider

const infuraID = "063d984ab22c4deb9984c46335a848c0"

const l1ToL2_L1TxHash_kovan = '0x65d50ed9d1edd7f20e97229667b5fc892fb23b128c8baca960c47c74fde9d4ed'
const l2ToL1_L2TxHash_kovan = '0xa018b12df969c0f65aec3c3d08c94332525a309cdec38206eef74319c1d1dd30'
const l1ToL2_L1TxHash_mainnnet = '0x122abee5d2f41da16a40e7edd0c5460d8f50683a46e1765fee2a8a8eb8b01cc2'
const l2ToL1_L2TxHash_mainnet = '0x0c3357cb993d26b5aa54a883bbd1918b08a3054f68cb0b69af7971e0ae49f9f1'



const kovanWatcher = new Watcher({
    l1: {
      provider: new JsonRpcProvider(`https://kovan.infura.io/v3/${infuraID}`),
      messengerAddress: '0x4361d0F75A0186C05f971c566dC6bEa5957483fD'
    },
    l2: {
      provider: new JsonRpcProvider(`https://kovan.optimism.io`),
      messengerAddress: '0x4200000000000000000000000000000000000007'
    }
  })


  const mainnetWatcher = new Watcher({
    l1: {
      provider: new JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraID}`),
      messengerAddress: '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1'
    },
    l2: {
      provider: new JsonRpcProvider(`https://mainnet.optimism.io`),
      messengerAddress: '0x4200000000000000000000000000000000000007'
    }
  })  

const useMainnet = false

// Declare variables here so they won't be local
let watcher, l1ToL2_L1TxHash, l2ToL1_L2TxHash

if (useMainnet) {
  console.log("Using mainnet")
  watcher = mainnetWatcher
  l1ToL2_L1TxHash = l1ToL2_L1TxHash_mainnnet
  l2ToL1_L2TxHash = l2ToL1_L2TxHash_mainnet
} else {
  console.log("Using kovan")
  watcher = kovanWatcher
  l1ToL2_L1TxHash = l1ToL2_L1TxHash_kovan
  l2ToL1_L2TxHash = l2ToL1_L2TxHash_kovan  
}



const lookupL1toL2 = async () => {
    console.log(`L1ToL2 L1 TX hash: ${l1ToL2_L1TxHash}`)
    const [l1ToL2_Hash] = await watcher.getMessageHashesFromL1Tx(l1ToL2_L1TxHash)
    console.log(`L1ToL2 hash: ${l1ToL2_Hash}`)
    const l1ToL2_L2Receipt = await watcher.getL2TransactionReceipt(l1ToL2_Hash)
    console.log(`L1ToL2 L2 TX hash: ${l1ToL2_L2Receipt.transactionHash}`)
}


const lookupL2toL1 = async () => {
    console.log(`L2ToL1 L2 TX hash: ${l2ToL1_L2TxHash}`)  
    const [l2ToL1_Hash] = await watcher.getMessageHashesFromL2Tx(l2ToL1_L2TxHash)
    console.log(`L2ToL1 hash: ${l2ToL1_Hash}`)
    const l2ToL1_L1Receipt = await watcher.getL1TransactionReceipt(l2ToL1_Hash)
    console.log(`L2ToL1 L1 TX hash: ${l2ToL1_L1Receipt.transactionHash}`)
}

lookupL1toL2()
lookupL2toL1()