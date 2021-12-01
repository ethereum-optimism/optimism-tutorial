# Using Optimistic Ethereum with the Dapptools Development Environment

[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord.com/channels/667044843901681675)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismPBC.svg?label=optimismPBC&style=social)](https://twitter.com/optimismPBC)

This tutorial aims to help you get started with developing decentralized applications on [Optimistic Ethereum](https://optimism.io/) using [Dapptools](https://dapp.tools/). Applications running on top of Optimistic Ethereum are about as secure as those running on the underlying Ethereum mainnet itself, but are
[significantly cheaper](https://archive.optimism.io/gas-comparison).

## Build an Optimistic Ethereum Node

The fastest way to test and debug apps on Optimistic Ethereum is to run a local Optimistic Ethereum node, so we'll build one. The directions in this section are for an Ubuntu 20.04 VM running on GCP with a 20 GB disk (the default, 10 GB, is not enough) and 16 GB RAM but they should be similar for other Linux versions and other platforms.

### Install Prerequisite Software

1. Install [Docker](https://www.docker.com/). If you prefer not to use the convenience script shown below, [there are other installation methods](https://docs.docker.com/engine/install/ubuntu).

   ```sh
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. Configure Docker settings.

   ```sh
   sudo usermod -a -G docker `whoami`
   ```
   
3. Install [Docker Compose](https://docs.docker.com/compose/install/).
  
   ```sh
   sudo apt install -y docker-compose
   ```

4. Install [Node.js](https://nodejs.org/en/). The version in the OS repository is out of date, so we'll get the package from a different source. 
  
   ```sh
   curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
   sudo bash nodesource_setup.sh
   sudo apt install -y nodejs
   ```
   
5. Install Nix if you haven't already:

   ```sh   
   # user must be in sudoers
   curl -L https://nixos.org/nix/install | sh

   # Run this or login again to use Nix
   . "$HOME/.nix-profile/etc/profile.d/nix.sh"
   ```

6. Then install dapptools:

   ```sh
   curl https://dapp.tools/install | sh
   ```
   This configures the dapphub binary cache and installs the `dapp`, `solc`, `seth` and `hevm` executables. For more information on Dapptools [click here](https://github.com/dapphub/dapptools).
   
7. If you haven't already, log out and log back in to complete the Docker installation.


### Start an Optimistic Ethereum Node

This process downloads and starts an Optimistic Ethereum network of one node.

1. Clone the [Optimism monorepo](https://github.com/ethereum-optimism/optimism).

   ```sh
   git clone https://github.com/ethereum-optimism/optimism.git
   ```

1. Start the Optimistic Ethereum node. This process downloads the images from [the Docker hub](https://hub.docker.com/u/ethereumoptimism), and depending on the hardware it can take up to ten minutes.

   ```sh
   cd optimism/ops
   docker-compose -f docker-compose-nobuild.yml up -t 3600
   ``` 

   You might get a timeout at first. If that is the case, just run the `docker-compose` command again.

> :information_source: It takes a few minutes for all the processes to start and communicate with each other. If at first you see `curl` failure to connect errors wait a few minutes.


## Migrate a Dapp to Optimistic Ethereum

Now that we have Optimistic Ethereum running, it is time to run a decentralized application (dapp) on it.

> :information_source: If you don't need the explanations and just want to see running code, [click here](https://github.com/ethereum-optimism/optimism-tutorial/). The `dapptools/dapp` directory only requires these steps to run:
> 1. `dapp update`
> 1. `export ETH_RPC_URL=http://127.0.0.1:8545`
> 1. `dapp test --rpc`


### Get a Sample Application

The easiest way is to start with a sample application. 

1. Open a second command line terminal

1. If necessary, configure your identity in git.
   ```sh
   git config --global user.email "email@goes.here.com"
   git config --global user.name "Your Name"
   ```

1. Run `dapptools`, the development environment we use in this tutorial. The `dapp init` command creates two contracts, `Dapp.sol` and `Dapp.t.sol` in the `src` subdirectory and installs our testing library ds-test in the lib subdirectory.

   ```sh
   mkdir dapp
   cd dapp
   dapp init
   ```

1. For the sake of this tutorial, let's change `src/Dapp.sol` to a simple vault with an eth bounty that can be accessed by giving the password 42:

   ```sh
   // SPDX-License-Identifier: GPL-3.0-or-later
   pragma solidity ^0.8.6;

   contract Dapp {
       receive() external payable {
       }

       function withdraw(uint password) public {
           require(password == 42, "Access denied!");
           payable(msg.sender).transfer(address(this).balance);
       }
   }
   ```

1. Compile the contract by running `dapp build`, you should simply see:
   ```sh

   + dapp clean
   + rm -rf out
   ```

1. Change `src/Dapp.t.sol` to the following.

   ```sh
   // SPDX-License-Identifier: GPL-3.0-or-later
   pragma solidity ^0.8.6;

   import "ds-test/test.sol";

   import "./Dapp.sol";

   contract DappTest is DSTest {
       Dapp dapptutorial;

       function setUp() public {
           dapptutorial = new Dapp();
       }

       function test_withdraw() public {
           payable(address(dapptutorial)).transfer(1 ether);
           uint preBalance = address(this).balance;
           dapptutorial.withdraw(42);
           uint postBalance = address(this).balance;
           assertEq(preBalance + 1 ether, postBalance);
       }

       function testFail_withdraw_wrong_pass() public {
           payable(address(dapptutorial)).transfer(1 ether);
           uint preBalance = address(this).balance;
           dapptutorial.withdraw(1);
           uint postBalance = address(this).balance;
           assertEq(preBalance + 1 ether, postBalance);
       }

       receive() external payable {
       }
   }
   ```

1. Test the contract by running `dapp test`

### Migrate the Sample App to Optimistic Ethereum

Now that we have a running Optimistic Ethereum node and a dapp to run on it, we can deploy to Optimistic Ethereum.

1. Edit `ETH_RPC_URL` to the Optimistic Ethereum dev node we are running.

   ```sh
   export ETH_RPC_URL=http://127.0.0.1:8545
   ```    

1. Test the contract on Optimistic Ethereum. 

   ```sh
   dapp test --rpc
   ```


## Deploying to a Real Network

To deploy to a real network (Optimistic Ethereum or Optimistic Kovan), edit `ETH_RPC_URL` and `ETH_FROM`. We assume `ETH_FROM` is an address you own and is part of your keystore. If not, use `ethsign import` to import your private key.

```sh
ethsign import
```

Enter your private key in 64 hexadecimal digits, make sure it **doesn't** start with the `0x` prefix, and create a passphrase for it. You should see: 

```sh
Private key as 64 hexadecimal digits (not echoed):
Choose a passphrase (not echoed):
<your address>
```

Edit `ETH_RPC_URL` and `ETH_FROM` and then deploy.

```sh
export ETH_RPC_URL=https://kovan.optimism.io
export ETH_FROM=<your address>
dapp create Dapp --rpc
```    

## Best Practices for Running Tests

As you may have noticed, in this tutorial we ran all the tests first on the HEVM and only then on Optimistic Ethereum. This is important, because it lets you isolate contract problems from problems that are the result of using Optimistic Ethereum rather than vanilla Ethereum.


## Conclusion

This tutorial has only touched the most basic points of Optimistic Ethereum development. For more information, you can [check out the full integration guide](https://community.optimism.io/docs/developers/tutorials.html) on the Optimism community hub. Go read it, and then write a dapp that will amaze us.
