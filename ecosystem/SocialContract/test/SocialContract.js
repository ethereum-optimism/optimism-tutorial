const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat")
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert } = require("chai");

describe("SocialContract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySocialContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [account0, account1] = await ethers.getSigners();

    const SocialContract = await ethers.getContractFactory("SocialContract");
    const socialContract = await SocialContract.deploy();

    let about = "0x48d9DabE939Ac1d129C12b627fb694f6CDA1d5B0"
    let key = ethers.utils.formatBytes32String("education")
    let val = ethers.utils.toUtf8Bytes("world")
    
    const attestation0 = {
      about: about,  // address
      key: key, // bytes32
      val: val // bytes
    }

    about = await account1.getAddress()
    key = ethers.utils.formatBytes32String("another")
    val = ethers.utils.toUtf8Bytes("attestation")

    const attestation1 = {
      about: about,  // address
      key: key, // bytes32
      val: val // bytes
    }

    return { account0, account1, socialContract, attestation0, attestation1 };
  }

  describe("Attestations", function () {
    it("Should emit an AttestationCreated event", async function () {
      const { socialContract, attestation0 } = await loadFixture(deploySocialContractFixture);
      const attestationArray = [attestation0]
      await expect(socialContract.attest(attestationArray))
        .to.emit(socialContract, 'AttestationCreated')
    });

    it("Should emit the correct arguments [creator, about, key, val]", async () => {
      const { socialContract, attestation0, account0 } = await loadFixture(deploySocialContractFixture);
      const creator = await account0.getAddress()
      const attestationArray = [attestation0]

      await expect(socialContract.attest(attestationArray))
        .to.emit(socialContract, "AttestationCreated")
        .withArgs(creator, attestation0.about, attestation0.key, attestation0.val)
    })

    it("Should emit two attestations with correct arguments[creator, about, key, val]", async () => {
      const { socialContract, attestation0, attestation1, account0 } = await loadFixture(deploySocialContractFixture);
      const creator = await account0.getAddress()
      const attestationArray = [attestation0, attestation1]

      await expect(socialContract.attest(attestationArray))
        .to.emit(socialContract, "AttestationCreated")
        .withArgs(creator, attestation0.about, attestation0.key, attestation0.val)
        .and.to.emit(socialContract, "AttestationCreated")
        .withArgs(creator, attestation1.about, attestation1.key, attestation1.val)
    })

    it("Should read attestations", async () => {
      const { socialContract, attestation0, attestation1, account0 } = await loadFixture(deploySocialContractFixture);
      const creator = await account0.getAddress()
      const attestationArray = [attestation0, attestation1]
      socialContract.attest(attestationArray)

      console.log("reading attestations mapping parametesr")
      console.log(creator)
      console.log(typeof creator)
      console.log(attestation0.about)
      console.log(typeof attestation0.about)
      console.log(attestation0.key)
      console.log(typeof attestation0.key)
      const returnedAttestationVal = await socialContract.attestations(
        creator, 
        attestation0.about,
        attestation0.key
      )
      console.log(typeof returnedAttestationVal)
      console.log(returnedAttestationVal)
      const returnedAttestationValArrified = ethers.utils.arrayify(returnedAttestationVal)
      
      console.log(ethers.utils.toUtf8String(returnedAttestationVal))
      console.log(returnedAttestationValArrified)
      console.log(attestation0.val)

      assert.deepEqual(attestation0.val, returnedAttestationValArrified)

    })
  });

});
