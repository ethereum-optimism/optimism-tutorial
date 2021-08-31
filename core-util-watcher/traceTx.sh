#! /bin/sh

echo Infura ID?
read infuraID

echo The hashes in this script are old, and may be beyond the 10k block limit. Look in
echo Etherscan to find newer transactions

# mainnet L1 -> L2 message
#
# To find a recent example, go to https://optimistic.etherscan.io/ and click 
# an L1 transaction in the Latest L1->L2 Transactions column
node index.js -l 1 -n mainnet -i $infuraID --hash 0x7853d2a95e622c56308791ed9d4b3df71e0ef14c337e6ccd5a090c08b8c806bd
echo ------------------------


# mainnet L2 -> L1 message
#
# To find a recent example:
# 1. Look at recent messages to the gateway on L1: 
#    https://etherscan.io/txs?a=0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1
#    Those are recently finalized messages
# 2. Get one of the sources of those messages (for example, 
#    0xf736f9e4a1d266a625b1685a774486843b060723)
# 3. Look for transactions going in Optimistic Ethereum from that address to the
#    Optimism Bridge (0x42....10)
# 4. Use the hash of such a transaction, when it is a bit over 7 days old
#
# Note, this has to be a FINALIZED transaction, so it has to be over seven days old
node index.js -l 2 -n mainnet -i $infuraID --hash 0x106b3e060c62ba672fd71cffceeb9a05d806f970d39db93f7a41138cf6148e59
echo ----------------------



# kovan L1 -> L2
#
# To find a recent example, go to https://kovan-optimistic.etherscan.io/ and click 
# an L1 transaction in the Latest L1->L2 Transactions column
node index.js -n kovan -i $infuraID --hash 0x2c0f7f87f2a2595f8d2aa706f5c8d6bb0cd1feeb37383c5605ec8f499bc9ee15

echo -----------------------
# kovan L2 -> L1
# To find a recent example:
# 1. Look at recent messages to the gateway on L1: 
#    https://kovan.etherscan.io/txs?a=0x4361d0F75A0186C05f971c566dC6bEa5957483fD
# 2. Get one of the sources of those messages
# 3. Look for transactions going in Optimistic Kovan from that address to the
#    Optimism Bridge (0x42....10)
# 4. Use the hash of such a transaction (can be recent, since the proof time on Kovan is a 
#    minute)

node index.js -l 2 -n kovan -i $infuraID --hash 0xa79905a3c18c9001e00b6b66d07204762d525c3515147a28d952468772eada64
