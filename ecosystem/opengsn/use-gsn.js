#! /usr/local/bin/node


const ethers = require("ethers")
const { RelayProvider } = require('@opengsn/provider')
const Web3HttpProvider = require( 'web3-providers-http')

const relayConfig = {
    // Accept everything paymaster
    // Address from https://docs.opengsn.org/networks/addresses.html#testnet-kovan
    paymasterAddress: "0x6B43C92C4661c8555D5D060144457D9bF0fD0D34",
    auditorsCount: 0
}     // relayConfig


const main = async () => {
  const web3provider = new Web3HttpProvider('https://kovan.optimism.io')
  const gsnProvider = RelayProvider.newProvider({ provider: web3provider, relayConfig })
  await gsnProvider.init()

  process.exit(0)

  const wallet = ethers.Wallet.createRandom()

  console.log(wallet)

  const ethersProvider = new ethers.providers.Web3Provider(gsnProvider)

  console.log(ethersProvider)

}   // main


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });