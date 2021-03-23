/* External Imports */
import 'hardhat-deploy-ethers'
import { ethers } from 'hardhat'
import { Contract, Signer, ContractFactory } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Watcher } from '@eth-optimism/watcher'

/* Internal Imports */
import { expect } from './setup'
import deploymentsInfoL1 from '../deployments/l1/ERC20.json'
import deploymentsInfoL2 from '../deployments/l2/ERC20.json'

describe('ERC20', () => {
  // Contracts
  let ERC20_L1: any,
    ERC20_L2: any,
    // Providers
    providerL1: JsonRpcProvider,
    providerL2: JsonRpcProvider,
    // Deployers
    walletL1: Signer,
    walletL2: Signer,
    // Additional wallets/signers
    walletL1_2: Signer,
    walletL1_3: Signer,
    walletL2_2: Signer,
    walletL2_3: Signer,
    // L1 <> L2 communication
    watcher: any


  const name = 'Some Really Cool Token Name'
  const initialSupplyL1 = ethers.BigNumber.from('10000000') // For L1 contract
  const initialSupplyL2 = ethers.BigNumber.from('10000000') // For L2 contract

  before('set up providers and wallets', () => {
    providerL1 = new ethers.providers.JsonRpcProvider(process.env.L1_WEB3_URL)
    providerL2 = new ethers.providers.JsonRpcProvider(process.env.L2_WEB3_URL)

    walletL1 = new ethers.Wallet(process.env.USER_PRIVATE_KEY, providerL1)
    walletL2 = new ethers.Wallet(process.env.USER_PRIVATE_KEY, providerL2)

    const privateKey3 = ethers.Wallet.createRandom().privateKey
    const privateKey4 = ethers.Wallet.createRandom().privateKey

    walletL1_2 = new ethers.Wallet(privateKey3, providerL1)
    walletL1_3 = new ethers.Wallet(privateKey4, providerL1)

    walletL2_2 = new ethers.Wallet(privateKey3, providerL2)
    walletL2_3 = new ethers.Wallet(privateKey4, providerL2)
  })

  /** 
   * @dev Should we remove Watcher? (NOTE: this copied from the 
   * `deposit-withdrawal` branch of the `optimism-tutorial`.)
   */
  // before('set up watchers', async () => {
  //   const response: any = await fetch('http://localhost:8080/addresses.json')
  //   const addresses = response.data

  //   watcher = new Watcher({
  //     l1: {
  //       provider: providerL1,
  //       messengerAddress: addresses['Proxy_OVM_L1CrossDomainMessenger'],
  //     },
  //     l2: {
  //       provider: providerL2,
  //       messengerAddress: '0x4200000000000000000000000000000000000007',
  //     }
  //   })
  // })

  describe('when instances have been deployed to local L1 and L2 chains', () => {
    before('connect to contracts', async () => {
      const l1ABI = deploymentsInfoL1.abi
      const l2ABI = deploymentsInfoL2.abi
      const l1Bytecode = deploymentsInfoL1.bytecode
      const l2Bytecode = deploymentsInfoL2.bytecode

      const ERC20_L1_Factory = new ContractFactory(l1ABI, l1Bytecode, walletL1)
      const ERC20_L2_Factory = new ContractFactory(l2ABI, l2Bytecode, walletL2)

      ERC20_L1 = await ERC20_L1_Factory
        .connect(walletL1)
        .deploy(initialSupplyL1, name)
      ERC20_L2 = await ERC20_L2_Factory
        .connect(walletL2)
        .deploy(initialSupplyL2, name)

      await ERC20_L1.deployTransaction.wait()
      await ERC20_L2.deployTransaction.wait()
    })

    describe('on L1', () => {
      it('should should have a name', async () => {
        expect(await ERC20_L1.name()).to.equal(name)
      })

      it('should have a total supply equal to the initial supply', async () => {
        expect(await ERC20_L1.totalSupply()).to.equal(initialSupplyL1)
      })

      it("should give the initial supply to the creator's address", async () => {
        expect(await ERC20_L1.balanceOf(await walletL1.getAddress())).to.equal(
          initialSupplyL1
        )
      })
    })

    describe('on L2', () => {
      it('should should have a name', async () => {
        expect(await ERC20_L2.name()).to.equal(name)
      })

      it('should have a total supply equal to the initial supply', async () => {
        expect(await ERC20_L2.totalSupply()).to.equal(initialSupplyL2)
      })

      it("should give the initial supply to the creator's address", async () => {
        expect(await ERC20_L2.balanceOf(await walletL2.getAddress())).to.equal(
          initialSupplyL2
        )
      })
    })

    describe('`transfer()` on L1', () => {
      it('should revert when the sender does not have enough balance', async () => {
        const sender = walletL1
        const recipient = walletL1_2
        const amount = initialSupplyL1.add(ethers.BigNumber.from('2500000'))

        await expect(
          ERC20_L1.connect(sender).transfer(await recipient.getAddress(), amount)
        ).to.be.revertedWith(
          "You don't have enough balance to make this transfer!"
        )
      })

      it('should succeed when the sender has enough balance', async () => {
        const sender = walletL1
        const recipient = walletL1_2
        const amount = ethers.BigNumber.from('2500000')

        await ERC20_L1.connect(sender).transfer(await recipient.getAddress(), amount)

        expect(await ERC20_L1.balanceOf(await walletL1.getAddress())).to.equal(
          initialSupplyL1.sub(amount)
        )

        expect(await ERC20_L1.balanceOf(await walletL1_2.getAddress())).to.equal(
          amount
        )
      })
    })

    describe('`transfer()` on L2', () => {
      it('should revert when the sender does not have enough balance', async () => {
        const sender = walletL2
        const recipient = walletL2_2
        const amount = initialSupplyL2.add(ethers.BigNumber.from('2500000'))

        await expect(
          ERC20_L2.connect(sender).transfer(await recipient.getAddress(), amount)
        ).to.be.revertedWith(
          "You don't have enough balance to make this transfer!"
        )
      })

      it('should succeed when the sender has enough balance', async () => {
        const sender = walletL2
        const recipient = walletL2_2
        const amount = ethers.BigNumber.from('2500000')

        await ERC20_L2.connect(sender).transfer(await recipient.getAddress(), amount)

        expect(await ERC20_L2.balanceOf(await walletL2.getAddress())).to.equal(
          initialSupplyL2.sub(amount)
        )

        expect(await ERC20_L2.balanceOf(await walletL2_2.getAddress())).to.equal(
          amount
        )
      })
    })
  })

  /** 
   * @dev Some of these tests will not work out-of-the-box since they are for
   * unit tests. Remove or refactor them to work for integration tests
   */
  // describe('`transferFrom()` on L1', () => {
  //   it('should revert when the owner account does not have enough balance', async () => {
  //     const sender = walletL1
  //     const owner = walletL1_2
  //     const recipient = walletL1_3
  //     const amount = 2500000

  //     await expect(
  //       ERC20_L1.connect(sender).transferFrom(
  //         await owner.getAddress(),
  //         await recipient.getAddress(),
  //         amount
  //       )
  //     ).to.be.revertedWith(
  //       "Can't transfer from the desired account because it doesn't have enough balance."
  //     )
  //   })

  //   it('should revert when the sender does not have enough of an allowance', async () => {
  //     const sender = walletL1_2
  //     const owner = walletL1
  //     const recipient = walletL1_3
  //     const amount = 2500000

  //     await expect(
  //       ERC20_L1.connect(sender).transferFrom(
  //         await owner.getAddress(),
  //         await recipient.getAddress(),
  //         amount
  //       )
  //     ).to.be.revertedWith(
  //       "Can't transfer from the desired account because you don't have enough of an allowance."
  //     )
  //   })

  //   it('should succeed when the owner has enough balance and the sender has a large enough allowance', async () => {
  //     const sender = walletL1_2
  //     const owner = walletL1
  //     const recipient = walletL1_3
  //     const amount = ethers.BigNumber.from('2500000')

  //     await ERC20_L1.connect(owner).approve(await sender.getAddress(), amount)

  //     await ERC20_L1.connect(sender).transferFrom(
  //       await owner.getAddress(),
  //       await recipient.getAddress(),
  //       amount
  //     )

  //     expect(await ERC20_L1.balanceOf(await owner.getAddress())).to.equal(
  //       initialSupplyL1.sub(amount)
  //     )

  //     expect(await ERC20_L1.balanceOf(await recipient.getAddress())).to.equal(
  //       amount
  //     )
  //   })
  // })
})
