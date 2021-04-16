const { Watcher } = require('@eth-optimism/core-utils')

const initWatcher = async (l1Provider, l2Provider, AddressManager) => {
  const l1MessengerAddress = await AddressManager.getAddress(
    'Proxy__OVM_L1CrossDomainMessenger'
  )
  const l2MessengerAddress = await AddressManager.getAddress(
    'OVM_L2CrossDomainMessenger'
  )
  return new Watcher({
    l1: {
      provider: l1Provider,
      messengerAddress: l1MessengerAddress,
    },
    l2: {
      provider: l2Provider,
      messengerAddress: l2MessengerAddress,
    },
  })
}

const waitForXDomainTransaction = async (watcher, tx, direction) => {
  const { src, dest } =
    direction === Direction.L1ToL2
      ? { src: watcher.l1, dest: watcher.l2 }
      : { src: watcher.l2, dest: watcher.l1 }

  // await it if needed
  tx = await tx
  // get the receipt and the full transaction
  const receipt = await tx.wait()
  const fullTx = await src.provider.getTransaction(tx.hash)

  // get the message hash which was created on the SentMessage
  const [ xDomainMsgHash ] = await watcher.getMessageHashesFromTx(src, tx.hash)
  // Get the transaction and receipt on the remote layer
  const remoteReceipt = await watcher.getTransactionReceipt(
    dest,
    xDomainMsgHash
  )
  const remoteTx = await dest.provider.getTransaction(
    remoteReceipt.transactionHash
  )

  return {
    tx: fullTx,
    receipt,
    remoteTx,
    remoteReceipt,
  }
}

module.exports = { initWatcher, waitForXDomainTransaction }