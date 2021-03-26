/* External Imports */
import { ethers } from 'hardhat'
import { Signer, ContractFactory, BigNumber } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'

/* Internal Imports */
import { expect } from './setup'
import deploymentsInfo from '../deployments/l1/ERC20.json'
import { ERC20 } from '../typechain/ERC20'

describe('ERC20', () => {
  let ERC20: ERC20,
    provider: JsonRpcProvider,
    account1: Signer,
    account2: Signer,
    account3: Signer

  const name: string = 'Some Really Cool Token Name'
  const initialSupply: number = 10_000_000
  const useL2: boolean = (process.env.TARGET === 'ovm')

  // // For the Optimistic test file
  // const privateKey1: string = ethers.Wallet.createRandom().privateKey
  // const privateKey2: string = ethers.Wallet.createRandom().privateKey
  // const privateKey3: string = ethers.Wallet.createRandom().privateKey

  // Set network provider
  if (useL2 == true) {
    provider = new ethers.providers.JsonRpcProvider(process.env.L2_WEB3_URL)
  } else {
    provider = new ethers.providers.JsonRpcProvider(process.env.L1_WEB3_URL)
  }

  before('connect to contracts', async () => {
    // Signers
    ;[account1, account2, account3] = await ethers.getSigners()

    const ERC20_Factory: ContractFactory = new ContractFactory(
      deploymentsInfo.abi,
      deploymentsInfo.bytecode,
      account1
    )

    ERC20 = await ERC20_Factory
      .connect(account1)
      .deploy(initialSupply, name) as ERC20

    await ERC20.deployTransaction.wait()
  })

  describe('when contract instance have been deployed to local L1 chain', () => {
    describe('on L2', () => {
      it('should have a name', async () => {
        const tokenName = await ERC20.name()
        expect(tokenName).to.equal(name)
      })

      it('should have a total supply equal to the initial supply', async () => {
        const tokenSupply = await ERC20.totalSupply()
        expect(tokenSupply).to.equal(initialSupply)
      })

      it("should give the initial supply to the creator's address", async () => {
        const balance = await ERC20.balanceOf(await account1.getAddress())
        expect(balance).to.equal(initialSupply)
      })
    })

    describe('transfer() on L1', () => {
      let senderBalanceBefore: BigNumber,
        recipientBalanceBefore: BigNumber

      before('with initial state', async () => {
        const account1Address: string = await account1.getAddress()
        const account2Address: string = await account2.getAddress()

        senderBalanceBefore = await ERC20.balanceOf(account1Address)
        recipientBalanceBefore = await ERC20.balanceOf(account2Address)
      })

      it('should revert when the sender does not have enough balance', async () => {
        const sender: string = await account1.getAddress()
        const recipient: string = await account2.getAddress()

        const senderSigner: Signer = account1
        const amount: number = initialSupply + 2_500_000

        const tx = ERC20.connect(senderSigner).transfer(recipient, amount)

        await expect(tx).to.be.revertedWith(
          "You don't have enough balance to make this transfer!",
        )
      })

      it('should succeed when the sender has enough balance', async () => {
        const sender: string = await account1.getAddress()
        const recipient: string = await account2.getAddress()

        const senderSigner: Signer = account1
        const amount: number = 2_500_000

        const tx = await ERC20.connect(senderSigner).transfer(recipient, amount)
        await tx.wait()

        const senderBalanceAfter: BigNumber = await ERC20.balanceOf(sender)
        const recipientBalanceAfter: BigNumber = await ERC20.balanceOf(recipient)

        expect(senderBalanceAfter.toString()).to.equal(
          (initialSupply - amount).toString()
        )
        expect(recipientBalanceAfter.toString()).to.equal(amount.toString())
      })
    })

    describe('transferFrom() on L1', () => {
      let account1BalanceBefore: BigNumber,
        account2BalanceBefore: BigNumber,
        account3BalanceBefore: BigNumber

      before('with initial state', async () => {
        const account1Address: string = await account1.getAddress()
        const account2Address: string = await account2.getAddress()
        const account3Address: string = await account3.getAddress()

        account1BalanceBefore = await ERC20.balanceOf(account1Address)
        account2BalanceBefore = await ERC20.balanceOf(account2Address)
        account3BalanceBefore = await ERC20.balanceOf(account3Address)
      })

      it('should revert when the owner account does not have enough balance', async () => {
        const sender: string = await account1.getAddress()
        const owner: string = await account2.getAddress()
        const recipient: string = await account3.getAddress()

        const senderSigner: Signer = account1
        const amount: number = 2_500_000

        const tx = ERC20
          .connect(senderSigner)
          .transferFrom(owner, recipient, amount)

        await expect(tx).to.be.revertedWith(
          "Can't transfer from the desired account because you don't have enough of an allowance."
        )
      })

      it('should revert when the sender does not have enough of an allowance', async () => {
        const sender: string = await account2.getAddress()
        const owner: string = await account1.getAddress()
        const recipient: string = await account3.getAddress()

        const senderSigner: Signer = account2
        const amount: number = 2_500_000

        const tx = ERC20
          .connect(senderSigner)
          .transferFrom(owner, recipient, amount)

        await expect(tx).to.be.revertedWith(
          "Can't transfer from the desired account because you don't have enough of an allowance."
        )
      })

      it('should succeed when the owner has enough balance and the sender has a large enough allowance', async () => {
        const sender: string = await account2.getAddress()
        const owner: string = await account1.getAddress()
        const recipient: string = await account3.getAddress()

        const senderSigner: Signer = account2
        const ownerSigner: Signer = account1
        const amount: number = 2_500_000

        const tx1 = await ERC20.connect(ownerSigner).approve(sender, amount)
        const tx2 = await ERC20
          .connect(senderSigner)
          .transferFrom(owner, recipient, amount)

        await tx1.wait() // Call 1
        await tx2.wait() // Call 2

        const ownerBalanceAfter: BigNumber = await ERC20.balanceOf(owner)
        const recipientBalanceAfter: BigNumber = await ERC20.balanceOf(recipient)

        expect(recipientBalanceAfter.toString()).to.equal(amount.toString())
        expect(ownerBalanceAfter.toString()).to.equal(
          (account1BalanceBefore.sub(amount)).toString()
        )
      })
    })
  })
})