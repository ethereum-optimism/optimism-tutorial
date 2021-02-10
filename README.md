# Deposit Withdrawal example

Clone the repo
Add a .env  in the root. Here is mine: 
```
# LOCAL
USER_PRIVATE_KEY=0x...
L1_MESSENGER_ADDRESS=0x6418E5Da52A3d7543d393ADD3Fa98B0795d27736
L1_WEB3_URL=http://127.0.0.1:9545
L2_WEB3_URL=http://127.0.0.1:8545
```
3. Spin up a local network. You can do this by cloning https://github.com/ethereum-optimism/optimism-integration, running `docker-compose pull` then `./up.sh`
4. run `yarn compile`
5. run `yarn deposit-withdraw`  to deploy some L1 and L2 contracts, do a deposit, and then do a withdrawal against the local network



## Prerequisite Software
We make use of some external software throughout this tutorial.
Please make sure you've installed the following before continuing:

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js](https://nodejs.org/en/download/)

