const { getContractFactory } = require('@eth-optimism/contracts')
const { Watcher } = require('@eth-optimism/core-utils')
const { utils } = require('ethers')
const {
  getAddressManager,
  l1Provider,
  l2Provider,
  l1Wallet,
  l2Wallet,
  fundUser,
  getOvmEth,
  getGateway,
} = require('./utils')
const {
  initWatcher,
  CrossDomainMessagePair,
  Direction,
  waitForXDomainTransaction,
} = require('./watcher-utils')

class OptimismEnv {
  // L1 Contracts
  addressManager
  gateway
  l1Messenger
  ctc
  // L2 Contracts
  ovmEth
  l2Messenger
  // The L1 <> L2 State watcher
  watcher
  // The wallets
  l1Wallet
  l2Wallet

  constructor (args) {
    this.addressManager = args.addressManager
    this.gateway = args.gateway
    this.l1Messenger = args.l1Messenger
    this.ovmEth = args.ovmEth
    this.l2Messenger = args.l2Messenger
    this.watcher = args.watcher
    this.l1Wallet = args.l1Wallet
    this.l2Wallet = args.l2Wallet
    this.ctc = args.ctc
  }

  static async new () {
    const addressManager = getAddressManager(l1Wallet)
    const watcher = await initWatcher(l1Provider, l2Provider, addressManager)
    const gateway = await getGateway(l1Wallet, addressManager)

    // fund the user if needed
    const balance = await l2Wallet.getBalance()
    if (balance.isZero()) {
      await fundUser(watcher, gateway, utils.parseEther('10'))
    }

    const ovmEth = getOvmEth(l2Wallet)
    const l1Messenger = getContractFactory('iOVM_L1CrossDomainMessenger')
      .connect(l1Wallet)
      .attach(watcher.l1.messengerAddress)
    const l2Messenger = getContractFactory('iOVM_L2CrossDomainMessenger')
      .connect(l2Wallet)
      .attach(watcher.l2.messengerAddress)

    const ctcAddress = await addressManager.getAddress(
      'OVM_CanonicalTransactionChain'
    )
    const ctc = getContractFactory('OVM_CanonicalTransactionChain')
      .connect(l1Wallet)
      .attach(ctcAddress)

    return new OptimismEnv({
      addressManager,
      gateway,
      ctc,
      l1Messenger,
      ovmEth,
      l2Messenger,
      watcher,
      l1Wallet,
      l2Wallet,
    })
  }

  async waitForXDomainTransaction (tx, direction) {
    return waitForXDomainTransaction(this.watcher, tx, direction)
  }
}

module.exports = { OptimismEnv }