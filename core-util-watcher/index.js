#! /usr/local/bin/node --trace-warnings

// For the package whose source code is at
// https://github.com/ethereum-optimism/optimism/blob/develop/packages/core-utils/src/watcher.ts

const Watcher = require('@eth-optimism/core-utils').Watcher
const JsonRpcProvider = require('@ethersproject/providers').JsonRpcProvider

const yargs = require('yargs');
const argv = yargs

    .alias('n', 'network')
    .describe('n', 'Network to use')
    .choices('n', ['kovan', 'mainnet'])
    .default('n', 'mainnet')

    .alias('l', 'layer')
    .describe('l', "Origin layer of the transaction")
    .choices('l', [1, 2])
    .default('l', 1)

    .alias('i', 'infuraID')
    .demand('i')
    .describe('i', "Infura ID")
    .string('i')
    .coerce('i', arg => {
      if ( arg.length != 32 || 
          !(arg.match(/^[0-9a-f]+$/)))
          throw(new Error('infuraID should be 32 hex digits'))
      return arg
    })    


    .describe('hash', "Hash of origin transaction")
    .demand('hash')
    .string('hash')
    .coerce('hash', arg => {
      if ( arg.length != 66 || 
          !(arg.match(/^0x[0-9a-f]+$/)))
          throw(new Error('hash should be "0x" followed by 64 hex digits'))
      return arg
    })
    .help('help')
    .argv 


const infuraID = argv.infuraID
let watcher

switch (argv.network) {
  case "kovan":
    console.log("Using the Kovan network")
    watcher = new Watcher({
      l1: {
        provider: new JsonRpcProvider(`https://kovan.infura.io/v3/${infuraID}`),
        messengerAddress: '0x4361d0F75A0186C05f971c566dC6bEa5957483fD'
      },
      l2: {
        provider: new JsonRpcProvider(`https://optimism-kovan.infura.io/v3/${infuraID}`),
        messengerAddress: '0x4200000000000000000000000000000000000007'
      }
    })
    break

  case "mainnet":
    console.log("Using the production network")
    watcher = new Watcher({
      l1: {
        provider: new JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraID}`),
        messengerAddress: '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1'
      },
      l2: {
        provider: new JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${infuraID}`),
        messengerAddress: '0x4200000000000000000000000000000000000007'
      }
    })  
    break
}   // switch(argv.network)



const lookupL1toL2 = async (hash) => {
  console.log("L1 to L2 message")
  console.log(`L1 TX hash: ${hash}`)
  const [msgHash] = await watcher.getMessageHashesFromL1Tx(hash)
  console.log(`Message hash: ${msgHash}`)
  const L2Receipt = await watcher.getL2TransactionReceipt(msgHash)
  console.log(`L2 TX hash: ${L2Receipt.transactionHash}`)
}   // lookupL1toL2


const lookupL2toL1 = async (hash) => {
  console.log("L2 to L1 message")
  console.log(`L2 TX hash: ${hash}`)  
  const [msgHash] = await watcher.getMessageHashesFromL2Tx(hash)
  console.log(`Message hash: ${msgHash}`)
  const L1Receipt = await watcher.getL1TransactionReceipt(msgHash)
  console.log(`L1 TX hash: ${L1Receipt.transactionHash}`)
}     // lookupL2toL1

if (argv.layer == 1) 
  lookupL1toL2(argv.hash)
else
  lookupL2toL1(argv.hash)