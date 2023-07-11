# Interacting with other OP Stack Chains
The SDK has built-in support for some OP Stack chains, [currently Base and Zora](https://github.com/ethereum-optimism/optimism/blob/180d33ee139c37fd2608717f3783be97ef9208df/packages/sdk/src/interfaces/types.ts#L25).

To use these chains, pass the correct chainId and JSON-RPC prvoider when constructing `CrossChainMessenger`. 
```javascript
 crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: optimismSDK.L1ChainID.GOERLI,
      l2ChainId: optimismSDK.L1ChainID.BASE_GOERLI,
      l1SignerOrProvider: l1Signer,
      l2SignerOrProvider: l2Signer,
  })
```

If you want to interact with an OP Stack chain that is not already supported, you can pass an argument for `contracts` to the `CrossChainMessenger` constructor and specify [L1 and L2 contracts](https://github.com/ethereum-optimism/optimism/blob/180d33ee139c37fd2608717f3783be97ef9208df/packages/sdk/src/interfaces/types.ts#L40-L76). Though the L2 contracts are precompiled and should be the same across chains. 