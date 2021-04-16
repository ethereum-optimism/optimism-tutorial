/* External Imports */
const { ethers, network } = require('hardhat')
const chai = require('chai')
const { solidity } = require('ethereum-waffle')
const chaiAsPromised = require('chai-as-promised')
const { expect } = chai

/* Internal Imports */
const { OptimismEnv } = require('./shared/env')

chai.use(chaiAsPromised)
chai.use(solidity)

describe(`ERC20`, () => {
  const INITIAL_SUPPLY = 1000000
  const TOKEN_NAME = 'An Optimistic ERC20'

  let account1
  let account2
  let Factory__ERC20
  let ERC20

  before(`load accounts`, async () => {
    let optimismEnv = new OptimismEnv()
    console.log('Optimism Environment: ', optimismEnv)
    const env = await optimismEnv.newEnvironment()

    console.log('Address Manager from environment: ', env.addressManager)
    console.log('Optimism Env Instance: ', env)
    account1 = env.l2Wallet
    account2 = ethers.Wallet.createRandom().connect(ethers.provider)
    Factory__ERC20 = await ethers.getContractFactory('ERC20', account1)
  })

  beforeEach(`deploy ERC20 contract`, async () => {
    ERC20 = Factory__ERC20.deploy(
      INITIAL_SUPPLY,
      TOKEN_NAME
    )

    await ERC20.deployTransaction.wait()
  })

  it(`should have a name`, async () => {
    const tokenName = await ERC20.name()
    expect(tokenName).to.equal(TOKEN_NAME)
  })

  it(`should have a total supply equal to the initial supply`, async () => {
    const tokenSupply = await ERC20.totalSupply()
    expect(tokenSupply).to.equal(INITIAL_SUPPLY)
  })

  it(`should give the initial supply to the creator's address`, async () => {
    const balance = await ERC20.balanceOf(await account1.getAddress())
    expect(balance).to.equal(INITIAL_SUPPLY)
  })

  describe(`transfer(...)`, () => {
    it(`should revert when the sender does not have enough balance`, async () => {
      const tx = ERC20.connect(account1).transfer(
        await account2.getAddress(),
        INITIAL_SUPPLY + 1
      )

      // Temporarily necessary, should be fixed soon.
      if (network.ovm) {
        await expect(
          (await tx).wait()
        ).to.be.rejected
      } else {
        await expect(
          tx
        ).to.be.rejected
      }
    })

    it(`should succeed when the sender has enough balance`, async () => {
      const tx = await ERC20.connect(account1).transfer(
        await account2.getAddress(),
        INITIAL_SUPPLY
      )
      await tx.wait()

      expect(
        (await ERC20.balanceOf(
          await account1.getAddress()
        )).toNumber()
      ).to.equal(0)
      expect(
        (await ERC20.balanceOf(
          await account2.getAddress()
        )).toNumber()
      ).to.equal(INITIAL_SUPPLY)
    })
  })

  describe(`transferFrom(...)`, () => {
    it(`should revert when the sender does not have enough of an allowance`, async () => {
      const tx = ERC20.connect(account2).transferFrom(
        await account1.getAddress(),
        await account2.getAddress(),
        INITIAL_SUPPLY
      )

      // Temporarily necessary, should be fixed soon.
      if (network.ovm) {
        await expect(
          (await tx).wait()
        ).to.be.rejected
      } else {
        await expect(
          tx
        ).to.be.rejected
      }
    })

    it(`should succeed when the owner has enough balance and the sender has a large enough allowance`, async () => {
      const tx1 = await ERC20.connect(account1).approve(
        await account2.getAddress(),
        INITIAL_SUPPLY
      )
      await tx1.wait()

      const tx2 = await ERC20.connect(account2).transferFrom(
        await account1.getAddress(),
        await account2.getAddress(),
        INITIAL_SUPPLY
      )
      await tx2.wait()

      expect(
        (await ERC20.balanceOf(
          await account1.getAddress()
        )).toNumber()
      ).to.equal(0)
      expect(
        (await ERC20.balanceOf(
          await account2.getAddress()
        )).toNumber()
      ).to.equal(INITIAL_SUPPLY)
    })
  })
})
