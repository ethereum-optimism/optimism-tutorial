#! /usr/local/bin/node


import dotenv from "dotenv"
dotenv.config()

import ethers from "ethers"
import fs from "fs"


const endpointUrl = process.env.ALCHEMY_API_KEY ? 
  `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` :
  process.env.OPTIMISM_GOERLI_URL


const provider = new ethers.providers.JsonRpcProvider(endpointUrl)
const ATST_JSON = JSON.parse(fs.readFileSync("AttestationStation.json"))       

const attestationStation = new ethers.Contract(
  '0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77', ATST_JSON.abi, provider)


const event2key = e => `${e.args.key}-${e.args.creator}`  
const update2Latest = (history, event) => {
  const key = event2key(event)
  if ((history[key] == null) || (history[key].blockNumber < event.blockNumber)) {
     history[key] = event
     return history   // including this event
  }
  return history      // without this event
}


const main = async () => {
  console.log("All AttestationCreated events about 60A7")

  const goatAddr = '0x00000000000000000000000000000000000060A7'
  const goatFilter = attestationStation.filters.AttestationCreated(null,goatAddr,null,null)
  const goatEvents = await attestationStation.queryFilter(goatFilter)
  console.log(goatEvents.map(
    entry => `${entry.args.creator}: ${entry.args.key} -> ${entry.args.val}`
  ))

  console.log(`\n Only relevant events (attestations not overwritten)`)

  const attestedHistory = goatEvents.reduce(update2Latest, {})
  const relevantEvents = Object.keys(attestedHistory).map(key => attestedHistory[key])
  console.log(relevantEvents.map(
    entry => `${entry.args.creator}: ${entry.args.key} -> ${entry.args.val}`
  ))

  console.log(`\nTotal events: ${goatEvents.length}`)
  console.log(`\Relevant events: ${relevantEvents.length}`)
}   // main


main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

