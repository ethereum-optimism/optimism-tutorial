#! /bin/sh

echo Infura ID?
read infuraID


echo The hashes in this script are old, and may be beyond the 10k block limit. Look in
echo Etherscan to find newer transactions

# mainnet L1 -> L2 message
node index.js -l 1 -n mainnet -i $infuraID --hash 0x122abee5d2f41da16a40e7edd0c5460d8f50683a46e1765fee2a8a8eb8b01cc2

echo ------------------------
# mainnet L2 -> L1 message
node index.js -l 2 -n mainnet -i $infuraID --hash 0x0c3357cb993d26b5aa54a883bbd1918b08a3054f68cb0b69af7971e0ae49f9f1

echo ----------------------
# kovan L1 -> L2
node index.js -n kovan -i $infuraID --hash 0x65d50ed9d1edd7f20e97229667b5fc892fb23b128c8baca960c47c74fde9d4ed

echo -----------------------
# kovan L2 -> L1
node index.js -l 2 -n kovan -i $infuraID --hash 0xa018b12df969c0f65aec3c3d08c94332525a309cdec38206eef74319c1d1dd30
