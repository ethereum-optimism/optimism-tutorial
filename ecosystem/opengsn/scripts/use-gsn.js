#! /usr/local/bin/node


const ethers = require("ethers")
const { RelayProvider } = require('@opengsn/provider')
const Web3HttpProvider = require( 'web3-providers-http')
// const Web3Contract = require( 'web3-eth-contract')

const greeterAddr = "0xA76F74361971b28bc57d0519a010a56e6D334c33"
// "0x4f8D981EA47c6712fD0016Ad79F8cd7A4E8DE79e"

const relayConfig = {
    paymasterAddress: "0xCc6dA63d001017AC34BFfd35cD24F795014f6a6c",
    // "0x00B7B352C117Cd283Ce4A6Fc0Ba1F3D95Ea2036E",
    auditorsCount: 0
}     // relayConfig


const greeterArtifact = 
{
  "_format": "hh-sol-artifact-1",
  "contractName": "Greeter",
  "sourceName": "contracts/Greeter.sol",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_greeting",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "_trustedForwarderAddr",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "_soliditySender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "_gsnSender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "_trustedForwarder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "_lastGreeter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "_data",
          "type": "bytes"
        }
      ],
      "name": "LogEntry",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "greet",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "forwarder",
          "type": "address"
        }
      ],
      "name": "isTrustedForwarder",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "lastGreeterAddr",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_greeting",
          "type": "string"
        }
      ],
      "name": "setGreeting",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "trustedForwarder",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "versionRecipient",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "bytecode": "0x60a06040523480156200001157600080fd5b5060405162000dd338038062000dd3833981810160405281019062000037919062000429565b81600190805190602001906200004f92919062000177565b508073ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff168152505062000094620000dc60201b60201c565b600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050620004f4565b6000601460003690501015801562000101575062000100336200011e60201b60201c565b5b156200011757601436033560601c90506200011b565b3390505b90565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16149050919050565b8280546200018590620004be565b90600052602060002090601f016020900481019282620001a95760008555620001f5565b82601f10620001c457805160ff1916838001178555620001f5565b82800160010185558215620001f5579182015b82811115620001f4578251825591602001919060010190620001d7565b5b50905062000204919062000208565b5090565b5b808211156200022357600081600090555060010162000209565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620002908262000245565b810181811067ffffffffffffffff82111715620002b257620002b162000256565b5b80604052505050565b6000620002c762000227565b9050620002d5828262000285565b919050565b600067ffffffffffffffff821115620002f857620002f762000256565b5b620003038262000245565b9050602081019050919050565b60005b838110156200033057808201518184015260208101905062000313565b8381111562000340576000848401525b50505050565b60006200035d6200035784620002da565b620002bb565b9050828152602081018484840111156200037c576200037b62000240565b5b6200038984828562000310565b509392505050565b600082601f830112620003a957620003a86200023b565b5b8151620003bb84826020860162000346565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620003f182620003c4565b9050919050565b6200040381620003e4565b81146200040f57600080fd5b50565b6000815190506200042381620003f8565b92915050565b6000806040838503121562000443576200044262000231565b5b600083015167ffffffffffffffff81111562000464576200046362000236565b5b620004728582860162000391565b9250506020620004858582860162000412565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680620004d757607f821691505b60208210811415620004ee57620004ed6200048f565b5b50919050565b6080516108c36200051060003960006101c501526108c36000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c8063486ff0cd14610067578063572b6c05146100855780637da0a877146100b5578063a4136862146100d3578063cfae3217146100ef578063e4877c111461010d575b600080fd5b61006f61012b565b60405161007c9190610501565b60405180910390f35b61009f600480360381019061009a9190610595565b610168565b6040516100ac91906105dd565b60405180910390f35b6100bd6101c1565b6040516100ca9190610607565b60405180910390f35b6100ed60048036038101906100e89190610757565b6101e9565b005b6100f76102d2565b6040516101049190610501565b60405180910390f35b610115610364565b6040516101229190610607565b60405180910390f35b60606040518060400160405280600881526020017f762e20312e302e30000000000000000000000000000000000000000000000000815250905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16149050919050565b60007f0000000000000000000000000000000000000000000000000000000000000000905090565b3373ffffffffffffffffffffffffffffffffffffffff167ff6b7395357b987ba481d3ea200f98b4a43308cfd1be4d8ba54f043e78d98305f61022961038e565b6102316101c1565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff166000366040516102689594939291906107de565b60405180910390a280600190805190602001906102869291906103c5565b5061028f61038e565b600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6060600180546102e19061085b565b80601f016020809104026020016040519081016040528092919081815260200182805461030d9061085b565b801561035a5780601f1061032f5761010080835404028352916020019161035a565b820191906000526020600020905b81548152906001019060200180831161033d57829003601f168201915b5050505050905090565b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600060146000369050101580156103aa57506103a933610168565b5b156103be57601436033560601c90506103c2565b3390505b90565b8280546103d19061085b565b90600052602060002090601f0160209004810192826103f3576000855561043a565b82601f1061040c57805160ff191683800117855561043a565b8280016001018555821561043a579182015b8281111561043957825182559160200191906001019061041e565b5b509050610447919061044b565b5090565b5b8082111561046457600081600090555060010161044c565b5090565b600081519050919050565b600082825260208201905092915050565b60005b838110156104a2578082015181840152602081019050610487565b838111156104b1576000848401525b50505050565b6000601f19601f8301169050919050565b60006104d382610468565b6104dd8185610473565b93506104ed818560208601610484565b6104f6816104b7565b840191505092915050565b6000602082019050818103600083015261051b81846104c8565b905092915050565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061056282610537565b9050919050565b61057281610557565b811461057d57600080fd5b50565b60008135905061058f81610569565b92915050565b6000602082840312156105ab576105aa61052d565b5b60006105b984828501610580565b91505092915050565b60008115159050919050565b6105d7816105c2565b82525050565b60006020820190506105f260008301846105ce565b92915050565b61060181610557565b82525050565b600060208201905061061c60008301846105f8565b92915050565b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610664826104b7565b810181811067ffffffffffffffff821117156106835761068261062c565b5b80604052505050565b6000610696610523565b90506106a2828261065b565b919050565b600067ffffffffffffffff8211156106c2576106c161062c565b5b6106cb826104b7565b9050602081019050919050565b82818337600083830152505050565b60006106fa6106f5846106a7565b61068c565b90508281526020810184848401111561071657610715610627565b5b6107218482856106d8565b509392505050565b600082601f83011261073e5761073d610622565b5b813561074e8482602086016106e7565b91505092915050565b60006020828403121561076d5761076c61052d565b5b600082013567ffffffffffffffff81111561078b5761078a610532565b5b61079784828501610729565b91505092915050565b600082825260208201905092915050565b60006107bd83856107a0565b93506107ca8385846106d8565b6107d3836104b7565b840190509392505050565b60006080820190506107f360008301886105f8565b61080060208301876105f8565b61080d60408301866105f8565b81810360608301526108208184866107b1565b90509695505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061087357607f821691505b602082108114156108875761088661082c565b5b5091905056fea264697066735822122048ef7ef9a72ec079510190fd13bc9ec9fb9279280d770c693f06691d3270b9b564736f6c63430008090033",
  "deployedBytecode": "0x608060405234801561001057600080fd5b50600436106100625760003560e01c8063486ff0cd14610067578063572b6c05146100855780637da0a877146100b5578063a4136862146100d3578063cfae3217146100ef578063e4877c111461010d575b600080fd5b61006f61012b565b60405161007c9190610501565b60405180910390f35b61009f600480360381019061009a9190610595565b610168565b6040516100ac91906105dd565b60405180910390f35b6100bd6101c1565b6040516100ca9190610607565b60405180910390f35b6100ed60048036038101906100e89190610757565b6101e9565b005b6100f76102d2565b6040516101049190610501565b60405180910390f35b610115610364565b6040516101229190610607565b60405180910390f35b60606040518060400160405280600881526020017f762e20312e302e30000000000000000000000000000000000000000000000000815250905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16149050919050565b60007f0000000000000000000000000000000000000000000000000000000000000000905090565b3373ffffffffffffffffffffffffffffffffffffffff167ff6b7395357b987ba481d3ea200f98b4a43308cfd1be4d8ba54f043e78d98305f61022961038e565b6102316101c1565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff166000366040516102689594939291906107de565b60405180910390a280600190805190602001906102869291906103c5565b5061028f61038e565b600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6060600180546102e19061085b565b80601f016020809104026020016040519081016040528092919081815260200182805461030d9061085b565b801561035a5780601f1061032f5761010080835404028352916020019161035a565b820191906000526020600020905b81548152906001019060200180831161033d57829003601f168201915b5050505050905090565b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600060146000369050101580156103aa57506103a933610168565b5b156103be57601436033560601c90506103c2565b3390505b90565b8280546103d19061085b565b90600052602060002090601f0160209004810192826103f3576000855561043a565b82601f1061040c57805160ff191683800117855561043a565b8280016001018555821561043a579182015b8281111561043957825182559160200191906001019061041e565b5b509050610447919061044b565b5090565b5b8082111561046457600081600090555060010161044c565b5090565b600081519050919050565b600082825260208201905092915050565b60005b838110156104a2578082015181840152602081019050610487565b838111156104b1576000848401525b50505050565b6000601f19601f8301169050919050565b60006104d382610468565b6104dd8185610473565b93506104ed818560208601610484565b6104f6816104b7565b840191505092915050565b6000602082019050818103600083015261051b81846104c8565b905092915050565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061056282610537565b9050919050565b61057281610557565b811461057d57600080fd5b50565b60008135905061058f81610569565b92915050565b6000602082840312156105ab576105aa61052d565b5b60006105b984828501610580565b91505092915050565b60008115159050919050565b6105d7816105c2565b82525050565b60006020820190506105f260008301846105ce565b92915050565b61060181610557565b82525050565b600060208201905061061c60008301846105f8565b92915050565b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610664826104b7565b810181811067ffffffffffffffff821117156106835761068261062c565b5b80604052505050565b6000610696610523565b90506106a2828261065b565b919050565b600067ffffffffffffffff8211156106c2576106c161062c565b5b6106cb826104b7565b9050602081019050919050565b82818337600083830152505050565b60006106fa6106f5846106a7565b61068c565b90508281526020810184848401111561071657610715610627565b5b6107218482856106d8565b509392505050565b600082601f83011261073e5761073d610622565b5b813561074e8482602086016106e7565b91505092915050565b60006020828403121561076d5761076c61052d565b5b600082013567ffffffffffffffff81111561078b5761078a610532565b5b61079784828501610729565b91505092915050565b600082825260208201905092915050565b60006107bd83856107a0565b93506107ca8385846106d8565b6107d3836104b7565b840190509392505050565b60006080820190506107f360008301886105f8565b61080060208301876105f8565b61080d60408301866105f8565b81810360608301526108208184866107b1565b90509695505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061087357607f821691505b602082108114156108875761088661082c565b5b5091905056fea264697066735822122048ef7ef9a72ec079510190fd13bc9ec9fb9279280d770c693f06691d3270b9b564736f6c63430008090033",
  "linkReferences": {},
  "deployedLinkReferences": {}
}


const main = async () => {

  let wallet = (ethers.Wallet.createRandom())
  
  const web3provider = new Web3HttpProvider('https://kovan.optimism.io')
  const gsnProvider = RelayProvider.newProvider({ provider: web3provider, config: relayConfig })
  await gsnProvider.init()
  gsnProvider.addAccount(wallet.privateKey)
  const ethersProvider = new ethers.providers.Web3Provider(gsnProvider)
  const signer = ethersProvider.getSigner(wallet.address)
  const greeter = new ethers.Contract(greeterAddr, greeterArtifact.abi, signer)

  console.log(`New greeter: ${wallet.address}`)

  tx = await greeter.setGreeting(`Hello from ${wallet.address}`)
  rcpt = await tx.wait()
}   // main


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });