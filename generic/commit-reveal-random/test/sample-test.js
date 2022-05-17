const chai = require("chai")
const expect = chai.expect
chai.use(require('chai-as-promised'))


describe("CommitReveal", function () {
  const value = "0x" + "60A7".padStart(64, "0")
  const hash = ethers.utils.keccak256(value)

  it("should return zero if nothing has been done yet", async function () {
    const CommitReveal = await ethers.getContractFactory("CommitReveal")
    const commitReveal = await CommitReveal.deploy()
    await commitReveal.deployed()
    
    const myAddr = (await ethers.getSigner()).address

    expect(await commitReveal.getCommit(myAddr)).to.equal(0)
    expect(await commitReveal.getReveal(myAddr)).to.equal(0)    
    expect(await commitReveal.getMyCommit()).to.equal(0)
    expect(await commitReveal.getMyReveal()).to.equal(0)        

  })   // it("should return zero...")

  it("should allow you to commit a value", async function () {
    const CommitReveal = await ethers.getContractFactory("CommitReveal")
    const commitReveal = await CommitReveal.deploy()
    await commitReveal.deployed()
    
    const myAddr = (await ethers.getSigner()).address
  
    const commitTx = await commitReveal.commit(hash)
    await commitTx.wait()

    expect(await commitReveal.getCommit(myAddr)).to.equal(hash)
    expect(await commitReveal.getReveal(myAddr)).to.equal(0)    
    expect(await commitReveal.getMyCommit()).to.equal(hash)
    expect(await commitReveal.getMyReveal()).to.equal(0)        
  })   // it("should allow you to commit a value...")

  it("should allow you to reveal the value", async function () {
    const CommitReveal = await ethers.getContractFactory("CommitReveal")
    const commitReveal = await CommitReveal.deploy()
    await commitReveal.deployed()
    
    const myAddr = (await ethers.getSigner()).address
    
    const commitTx = await commitReveal.commit(hash)
    await commitTx.wait()

    const revealTx = await commitReveal.reveal(value)
    await revealTx.wait()

    expect(await commitReveal.getCommit(myAddr)).to.equal(hash)
    expect(await commitReveal.getReveal(myAddr)).to.equal(value)    
    expect(await commitReveal.getMyCommit()).to.equal(hash)
    expect(await commitReveal.getMyReveal()).to.equal(value)        
  })   // it("should allow you to reveal a value...")


  it("should fail on a wrong reveal", async function () {
    const CommitReveal = await ethers.getContractFactory("CommitReveal")
    const commitReveal = await CommitReveal.deploy()
    await commitReveal.deployed()
    
    const myAddr = (await ethers.getSigner()).address
    
    const commitTx = await commitReveal.commit(hash)
    await commitTx.wait()

    const badValue = "0x0BAD"
    await expect(commitReveal.reveal(badValue)).to.be
      .revertedWith("VM Exception while processing transaction: reverted with reason string 'Reveal must match commit'")
    
    expect(await commitReveal.getCommit(myAddr)).to.equal(hash)
    expect(await commitReveal.getReveal(myAddr)).to.equal(0)    
    expect(await commitReveal.getMyCommit()).to.equal(hash)
    expect(await commitReveal.getMyReveal()).to.equal(0)        
  })   // it("should fail on a wrong reveal")  

  it("should fail on a second commit", async function () {
    const CommitReveal = await ethers.getContractFactory("CommitReveal")
    const commitReveal = await CommitReveal.deploy()
    await commitReveal.deployed()
    
    const myAddr = (await ethers.getSigner()).address
    
    const commitTx = await commitReveal.commit(hash)
    await commitTx.wait()

    const badValue = "0x0BAD"
    await expect(commitReveal.commit(badValue)).to.be
      .revertedWith("VM Exception while processing transaction: reverted with reason string 'Can't commit twice'")
    
    expect(await commitReveal.getCommit(myAddr)).to.equal(hash)
    expect(await commitReveal.getReveal(myAddr)).to.equal(0)    
    expect(await commitReveal.getMyCommit()).to.equal(hash)
    expect(await commitReveal.getMyReveal()).to.equal(0)        
  })   // it("should fail on a second commit")    

})     // describe("CommitReveal")



describe("Random", function () {
  const val1 = "0x" + "60A7".padStart(64, "0")
  const hash1 = ethers.utils.keccak256(val1)
  

  const setupRandom = async () => {
    const CommitReveal = await ethers.getContractFactory("CommitReveal")
    const commitReveal = await CommitReveal.deploy()
    await commitReveal.deployed()
    const Random = await ethers.getContractFactory("Random")
    const random = await Random.deploy(commitReveal.address)
    await (await commitReveal.transferOwnership(random.address)).wait()

    return random
  }   // setupRandom


  it("shouldn't let you propose a pairing without a committed value", async function () {
    const addrs = (await ethers.getSigners()).map(x => x.address)
    const random = await setupRandom()

    await expect(random.proposePairing(addrs[1])).to.be
    .revertedWith("VM Exception while processing transaction: reverted with reason string 'Must have committed value'")  
  })   // it("shouldn't let you propose a pairing without a committed value")


  it("should let you propose a pairing with a committed value", async function () {
    const addrs = (await ethers.getSigners()).map(x => x.address)
    const random = await setupRandom()
    const CommitReveal = await ethers.getContractFactory("CommitReveal")    
    const commitReveal = await CommitReveal.attach(await random.getCommitReveal())

    commitTx = await commitReveal.commit(hash1)
    await commitTx.wait()

    console.log(expect(random.proposePairing(addrs[1])).to.be.successful())

//    await expect(random.proposePairing(addrs[1])).to.be.fulfilled()
  })   // it("should let you propose a pairing with a committed value")


}) // describe