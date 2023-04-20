#! /usr/local/bin/node


import dotenv from "dotenv"
dotenv.config()

import ethers from "ethers"
import fs from "fs"


const words = process.env.MNEMONIC.match(/[a-zA-Z]+/g).length
const validLength = [12, 15, 18, 24]
if (!validLength.includes(words)) {
   console.log(`The mnemonic (${process.env.MNEMONIC}) is the wrong number of words`)
   process.exit(-1)
}

const endpointUrl = process.env.ALCHEMY_API_KEY ? 
  `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` :
  process.env.OPTIMISM_GOERLI_URL


const provider = new ethers.providers.JsonRpcProvider(endpointUrl)
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).
      connect(provider)

const ATST_JSON = JSON.parse(fs.readFileSync("AttestationStation.json"))       

const AttestationStation = new ethers.ContractFactory(ATST_JSON.abi, ATST_JSON.bytecode, wallet)
const attestationStation = AttestationStation.attach('0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77')


const encodeRawKey = rawKey => {
   if (rawKey.length<32)
      return ethers.utils.formatBytes32String(rawKey)

   const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(rawKey))
   return hash.slice(0,64)+'ff'
}


const main = async () => {

    console.log("Write an attestation")

    const goatAddr = '0x00000000000000000000000000000000000060A7'
    const attendedKey = encodeRawKey("animalfarm.school.attended")
    const attestation = {
        about: goatAddr,
        key: attendedKey,
        val: 1   // for true
    }

    const attestTx = await attestationStation.functions['attest(address,bytes32,bytes)'](
        attestation.about, 
        attestation.key, 
        attestation.val)
    console.log("Transaction sent")
    const attestRcpt = await attestTx.wait()

    console.log(`Attestation transaction: https://goerli-explorer.optimism.io/tx/${attestRcpt.transactionHash}`)

    console.log("\nReading the attestation")
    const myAddr = wallet.address
    console.log(`Key: ${await attestationStation.attestations(myAddr, goatAddr, attendedKey)}`)

    console.log("\nReading another attestation (that isn't there)")
    const notGoatAddr = '0x000000000000000000000000000000000000BEEF'
    console.log(`Key: ${await attestationStation.attestations(myAddr, notGoatAddr, attendedKey)}`)

    console.log("\nReading an ASCII attestation")
    const historyKey = encodeRawKey("animal-farm.school.grades.history")
    const hex = await attestationStation.attestations('0xBCf86Fd70a0183433763ab0c14E7a760194f3a9F', 
        goatAddr, historyKey)
    console.log(`Goat's grade in history: ${ethers.utils.toUtf8String(hex)}`)
    

}   // main


main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

