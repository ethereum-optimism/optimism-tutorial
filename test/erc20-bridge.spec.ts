import { expect } from './setup'
import { Contract, Signer } from 'ethers'
import { ethers, l2ethers } from 'hardhat'

describe('L1 -> L2', () => {
  let account: Signer
  before(async () => {
    ;[account] = await ethers.getSigners()
  })

  const name = 'Some Really Cool Token Name'
  const initialSupply = 10_000_000
  const bridgeGasLimit = 4_000_000

  let ERC20: Contract
  let ERC20Adapter: Contract
  let Layer2ERC20: Contract
  beforeEach(async () => {
    ERC20 = await (await ethers.getContractFactory('ERC20'))
      .connect(account)
      .deploy(initialSupply, name)

    ERC20Adapter = await (await ethers.getContractFactory('ERC20Adapter'))
      .connect(account)
      .deploy(ERC20.address)

    Layer2ERC20 = await (await l2ethers.getContractFactory('Layer2ERC20'))
      .connect(account)
      .deploy(initialSupply, name)

    await ERC20Adapter.createBridge(
      Layer2ERC20.address,
      l2ethers.layer1BridgeRouter,
      bridgeGasLimit
    )

    await Layer2ERC20.createBridge(
      ERC20Adapter.address,
      l2ethers.layer2BridgeRouter,
      bridgeGasLimit
    )
  })

  describe('the basics', () => {
    it('should be able to deposit on L1 and appear on L2', async () => {
      const amount = 4_200_000
      console.log(await Layer2ERC20.balanceOf(await account.getAddress()))

      // Start by approving an amount for the Layer 1 ERC20Adapter to send over to Layer 2.
      await ERC20.approve(ERC20Adapter.address, amount)

      // Now actually trigger the transfer to Layer 2 via the deposit function.
      const receipt1 = await ERC20Adapter.deposit(amount)

      // Our balance on Layer 1 should decreased.
      expect(await ERC20.balanceOf(await account.getAddress())).to.equal(
        initialSupply - amount
      )

      console.log(await Layer2ERC20.balanceOf(await account.getAddress()))
      // Wait for the deposit to be relayed across the bridge.
      await l2ethers.waitForBridgeRelay(receipt1)

      // Our deposit should be processed and our balance should be updated on Layer 2!
      console.log(await Layer2ERC20.balanceOf(await account.getAddress()))
      expect(await Layer2ERC20.balanceOf(await account.getAddress())).to.equal(
        initialSupply + amount
      )

      // Now we're going to move our balance back over to Layer 1 by calling the withdraw function.
      const receipt2 = await Layer2ERC20.withdraw(amount)

      // Our balance should be back to normal on Layer 2.
      expect(await Layer2ERC20.balanceOf(await account.getAddress())).to.equal(
        initialSupply
      )

      // Wait for the withdrawal to be relayed across the bridge.
      await l2ethers.waitForBridgeRelay(receipt2)

      // Our balance should also be back to normal on Layer 1!
      expect(await ERC20.balanceOf(await account.getAddress())).to.equal(
        initialSupply
      )
    })
  })
})
