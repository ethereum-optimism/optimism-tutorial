const { ethers } = require('ethers')
const { CrossChainMessenger } = require('@eth-optimism/sdk')

const main = async () => {
  const l1Provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
  const l2Provider = new ethers.providers.JsonRpcProvider('http://localhost:9545')
  const l1Signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', l1Provider)
  const l2Signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', l2Provider)

  const messenger = new CrossChainMessenger({
    l1SignerOrProvider: l1Signer,
    l2SignerOrProvider: l2Signer,
    l1ChainId: (await l1Provider.getNetwork()).chainId,
    l2ChainId: (await l2Provider.getNetwork()).chainId,
    bedrock: true,
  })

  const recipient = `0x${'11'.repeat(20)}`

  console.log('sending deposit...')
  const bn = 172
  if (bn) {
    const blk = await messenger.l2Provider.getBlockWithTransactions(bn)
    const tx = blk.transactions[1]
    const r = await messenger.l2Provider.getTransactionReceipt(tx.hash)
    console.log(r, tx)
  }
  console.log(messenger.contracts.l2.L2StandardBridge.address)
  console.log(await messenger.contracts.l2.L2CrossDomainMessenger.l1CrossDomainMessenger())
  console.log(messenger.contracts.l1.L1CrossDomainMessenger.functions)
  await messenger.waitForMessageReceipt(
    await messenger.depositETH(ethers.utils.parseEther('0.1'), {
      recipient: recipient
    })
  )

  // console.log(await messenger.contracts.l1.L1CrossDomainMessenger.portal())
  // console.log(messenger.contracts.l1.OptimismPortal.address)

  // await messenger.contracts.l1.L1CrossDomainMessenger.connect(l1Signer).sendMessage(
  //   recipient,
  //   '0x',
  //   100_000,
  //   {
  //     value: ethers.utils.parseEther('0.1'),
  //   }
  // )

  console.log(
    await l2Provider.getBalance(recipient)
  )
}

main()
