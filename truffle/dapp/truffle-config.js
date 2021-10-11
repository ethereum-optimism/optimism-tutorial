   var Provider = require('@truffle/hdwallet-provider')
   var mnemonic = 'test test test test test test test test test test test junk'
   var localUrl = 'http://127.0.0.1:8545'


module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 5000000
    },
    optimistic: {
      provider: () => new Provider(mnemonic, localUrl),
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  }
};
