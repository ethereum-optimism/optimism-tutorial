import { expect } from './setup'

import { l2ethers as ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'

describe('Optimistic ERC20', () => {
  let account1: Signer
  let account2: Signer
  let account3: Signer
  before(async () => {
    ;[account1, account2, account3] = await ethers.getSigners()
  })

  const name = 'Some Really Cool Token Name'
  const initialSupply = 10000000

  let ERC20: Contract
  beforeEach(async () => {
    ERC20 = await (await ethers.getContractFactory('ERC20'))
      .connect(account1)
      .deploy(initialSupply, name)
  })

  describe('the basics', () => {
    it('should have a name', async () => {
      expect(await ERC20.name()).to.equal(name)
    })

    it('should have a total supply equal to the initial supply', async () => {
      expect(await ERC20.totalSupply()).to.equal(initialSupply)
    })

    it("should give the initial supply to the creator's address", async () => {
      expect(await ERC20.balanceOf(await account1.getAddress())).to.equal(
        initialSupply
      )
    })
  })

  describe('transfer', () => {
    it('should revert when the sender does not have enough balance', async () => {
      const sender = account1
      const recipient = account2
      const amount = initialSupply + 2500000

      await expect(
        ERC20.connect(sender).transfer(await recipient.getAddress(), amount)
      ).to.be.revertedWith(
        "You don't have enough balance to make this transfer!"
      )
    })

    it('should succeed when the sender has enough balance', async () => {
      const sender = account1
      const recipient = account2
      const amount = 2500000

      await ERC20.connect(sender).transfer(await recipient.getAddress(), amount)

      expect(await ERC20.balanceOf(await account1.getAddress())).to.equal(
        initialSupply - amount
      )

      expect(await ERC20.balanceOf(await account2.getAddress())).to.equal(
        amount
      )
    })
  })

  describe('transferFrom', () => {
    it('should revert when the owner account does not have enough balance', async () => {
      const sender = account1
      const owner = account2
      const recipient = account3
      const amount = 2500000

      await expect(
        ERC20.connect(sender).transferFrom(
          await owner.getAddress(),
          await recipient.getAddress(),
          amount
        )
      ).to.be.revertedWith(
        "Can't transfer from the desired account because it doesn't have enough balance."
      )
    })

    it('should revert when the sender does not have enough of an allowance', async () => {
      const sender = account2
      const owner = account1
      const recipient = account3
      const amount = 2500000

      await expect(
        ERC20.connect(sender).transferFrom(
          await owner.getAddress(),
          await recipient.getAddress(),
          amount
        )
      ).to.be.revertedWith(
        "Can't transfer from the desired account because you don't have enough of an allowance."
      )
    })

    it('should succeed when the owner has enough balance and the sender has a large enough allowance', async () => {
      const sender = account2
      const owner = account1
      const recipient = account3
      const amount = 2500000

      await ERC20.connect(owner).approve(await sender.getAddress(), amount)

      await ERC20.connect(sender).transferFrom(
        await owner.getAddress(),
        await recipient.getAddress(),
        amount
      )

      expect(await ERC20.balanceOf(await owner.getAddress())).to.equal(
        initialSupply - amount
      )

      expect(await ERC20.balanceOf(await recipient.getAddress())).to.equal(
        amount
      )
    })
  })
})
