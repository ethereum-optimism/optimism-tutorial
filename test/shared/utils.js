const {
  getContractFactory,
  getContractInterface,
} = require('@eth-optimism/contracts')
const { Watcher } = require('@eth-optimism/core-utils')
const { constants, providers } = require('ethers')
const { waitForXDomainTransaction } = require('./watcher-utils')

const GWEI = ethers.BigNumber.from(1e9)

// The hardhat instance
const l1HttpPort = 9545
const l1Provider = new providers.JsonRpcProvider(
  `http://localhost:${l1HttpPort}`
)
l1Provider.pollingInterval = 10

const httpPort = 8545
const l2Provider = new providers.JsonRpcProvider(
  `http://localhost:${httpPort}`
)
l2Provider.pollingInterval = 10

// The sequencer private key which is funded on L1
const l1Wallet = new ethers.Wallet(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  l1Provider
)

// A random private key which should always be funded with deposits from L1 -> L2
// if it's using non-0 gas price
const l2Wallet = l1Wallet.connect(l2Provider)

// Predeploys
const PROXY_SEQUENCER_ENTRYPOINT_ADDRESS =
  '0x4200000000000000000000000000000000000004'
const OVM_ETH_ADDRESS = '0x4200000000000000000000000000000000000006'

// The address manager is always at the same address in testnet deployments
const addressManagerAddress =
  '0x5FbDB2315678afecb367f032d93F642f64180aa3'

const getAddressManager = (provider) => {
  return getContractFactory('Lib_AddressManager')
    .connect(provider)
    .attach(addressManagerAddress)
}

// Gets the gateway using the proxy if available
const getGateway = async (wallet, AddressManager) => {
  const l1GatewayInterface = getContractInterface('OVM_L1ETHGateway')
  const ProxyGatewayAddress = await AddressManager.getAddress(
    'Proxy__OVM_L1ETHGateway'
  )
  const addressToUse =
    ProxyGatewayAddress !== constants.AddressZero
      ? ProxyGatewayAddress
      : await AddressManager.getAddress('OVM_L1ETHGateway')

  const OVM_L1ETHGateway = new Contract(
    addressToUse,
    l1GatewayInterface,
    wallet
  )

  return OVM_L1ETHGateway
}

const getOvmEth = (wallet) => {
  const OVM_ETH = new Contract(
    OVM_ETH_ADDRESS,
    getContractInterface('OVM_ETH'),
    wallet
  )

  return OVM_ETH
}

const fundUser = async (watcher, gateway, amount, recipient) => {
  const value = BigNumber.from(amount)
  const tx = recipient
    ? gateway.depositTo(recipient, { value })
    : gateway.deposit({ value })
  await waitForXDomainTransaction(watcher, tx, 0)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

module.exports = {
  GWEI,
  l1Provider,
  l2Provider,
  l1Wallet,
  l2Wallet,
  PROXY_SEQUENCER_ENTRYPOINT_ADDRESS,
  OVM_ETH_ADDRESS,
  addressManagerAddress,
  getAddressManager,
  getGateway,
  getOvmEth,
  fundUser,
  sleep
}