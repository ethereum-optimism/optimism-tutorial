const { ethers } = require("ethers");
const SocialContractABI = require("../artifacts/contracts/SocialContract.sol/SocialContract.json").abi

async function main() {
    let txResponse, txReceipt;

    const url = "http://127.0.0.1:8545";
    const provider = new ethers.providers.JsonRpcProvider(url);

    const account0Public = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const account0Private = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const signer = new ethers.Wallet(account0Private, provider);
    
    // NOTICE: idk if these contract addresses are deterministic, I just hardcoded them when I was testing one evening.
    const socialContractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"; 
    const socialContract = new ethers.Contract(socialContractAddress, SocialContractABI, signer);
    
    // Format into an object that conforms to the `AttestationData` struct.
    const attestation = {
        about: "0x48d9DabE939Ac1d129C12b627fb694f6CDA1d5B0", 
        key: ethers.utils.formatBytes32String("education"),
        val: ethers.utils.toUtf8Bytes("taught me how to make an attestation")
    };

    // The attest function takes an array of AttestationData
    const attestationArray = [attestation]

    // write attestation to the Social Contract
    txResponse = await socialContract.attest(attestationArray);
    
    console.log(`txResponse: ${txResponse}`)
    console.log(txResponse)
    txReceipt = await txResponse.wait(1)
    console.log(`txReceipt: ${txReceipt}`)
    console.log(txReceipt)
}

// This pattern enables async/await everywhere and
// properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
