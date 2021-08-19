# Tracing Multilayer Transactions

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

Optimistic Ethereum lets you send messages between L1 and L2, in either direction. There are always two transactions involved - one on each layer.
For example when sending a token balance from L1 to L2 there is a transaction which locks the token balance in the bridge on L1 and a 
second which mints the equivalent token amount on L2. For withdrawals the opposite occurs, again in two steps, the token 
amount is burned on L2, then the equivalent amount (previously locked) is transferred out of the bridge to the user on L1.


## Tracing a transaction

The code that finds this match is at [index.js](index.js) in this directory. You run it
with these command line arguments:

* `-n` / `--network`: The network to use, either **mainnet** (the default) or **kovan**.
* `-l` / `--layer`: The network layer from which the message originates, either **1** or **2**
* `-i` / `--infuraID`: Your infura ID for the layer 1 connection
* `--hash`: The hash of the transaction on the source layer


      --version   Show version number                                  [boolean]
  -n, --network   Network to use
                              [choices: "kovan", "mainnet"] [default: "mainnet"]
  -l, --layer     Origin layer of the transaction   [choices: 1, 2] [default: 1]
  -i, --infuraID  Infura ID                                  [string] [required]
      --hash      Hash of origin transaction                 [string] [required]
      --help      Show help    

## How does it work?

First you create a `Watcher` object. This watcher needs:

1. A [`Provider`](https://docs.ethers.io/v5/api/providers/) to connect to the
   underlying L1 network
1. The address of the L1 messenger contract, 
   [`OVM_L1CrossDomainMessenger`](https://community.optimism.io/docs/protocol/protocol.html#ovm-l1crossdomainmessenger). This address varies between
   different networks, [you can get it 
   here](https://github.com/ethereum-optimism/optimism/tree/develop/packages/contracts/deployments).
1. Another `Provider` to connect to the Optimistic network
1. The address of the L2 messenger contract, 
   [`OVM_L2CrossDomainMessenger`](https://community.optimism.io/docs/protocol/protocol.html#ovm-l2crossdomainmessenger). This address is always the same,
   `0x4200000000000000000000000000000000000007`.

Then, given a transaction hash at the origin layer, you call:

```javascript
await watcher.getMessageHashesFromL<either 1 or 2>Tx(<origin transaction hash>)
```

This gives you a list of message hashes. In most cases a transaction will result
in just one message, but it could send multiple messages. With the message hash
you call:

```javascript
await watcher.getL<either 1 or 2>TransactionReceipt(<message hash>)
```

And get back the receipt for the destination layer transaction.


## Limitations

1. A transaction can call [`CTC.enqueue`](https://github.com/ethereum-optimism/optimism/blob/796dbda597bf249cf31dfe4feb026c9968e26aaf/packages/contracts/contracts/optimistic-ethereum/OVM/chain/OVM_CanonicalTransactionChain.sol#L252)
   directly and bypass the messenger contracts. In that case the messenger
   contracts won't be able to trace that message.
2. If the message hasn't been relayed yet, the `Promise` to get the transaction
   receipt won't be fulfilled until it is. That is not a problem for L1->L2
   messages, which are relayed in a few minutes, but L2->L1 messages require 
   a week for the challenge period and then they need to be finalized on L1.
   That could take a long time.
