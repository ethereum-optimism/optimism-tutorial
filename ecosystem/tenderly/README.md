# Using Tenderly to Trace Transactions
[![Discord](https://img.shields.io/discord/667044843901681675.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](https://discord-gateway.optimism.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/optimismFND.svg?label=optimismFND&style=social)](https://twitter.com/optimismFND)

Optimism transactions sometimes fail.
In this tutorial you learn how to use [Tenderly](https://tenderly.co/) to see what happened, what is the cause of the failure.

## Configuration

The contract we'll use as a sample for debugging is [Fail.sol](contracts/Fail.sol).

We will trace two transactions using this contract:

- [A successful transaction](https://goerli-optimism.etherscan.io/tx/0x519c7c7b3438668c37201800b15e01721ded2f44d6963cb69c392e32ffba9a5a)
- [A failed transaction](https://goerli-optimism.etherscan.io/tx/0xe77b6fffa9725e98aa6c58c25f2d017fb025a65fc5deae4ae84ace4c2e8822e8)

## Tenderly

Get a [Tenderly account](https://dashboard.tenderly.co/register?utm_source=homepage) if you don't have an account already.
The free tier is sufficient for what we do in this tutorial.

## Tracing a transaction

1. Search for the transaction hash.
   If Tenderly has that transaction, it will find it and tell you on what network it happened.
   For the purpose of this tutorial, search first for the successful transaction (`0xe77b6fffa9725e98aa6c58c25f2d017fb025a65fc5deae4ae84ace4c2e8822e8`).

   If the source code isn't in Tenderly, it can download it from Etherscan:

   1. Click the **Debugger** on the left sidebar.

   1. Click in the function trace on a contract where you don't have the source code yet.

   1. Click **Fetch the contract from public explorer**.
      Note that sometimes it takes a few minutes to fetch the source code.

1. In the overview you can see the stack trace.
   The different icons stand for different contract addresses (all implementing the same `Fail` contract in this case).

   ![stack trace](assets/stack-trace.png)

1. Below that you can see the function trace, including where exactly in the source the failure was and what happened before that.

   ![function trace](assets/func-trace.png)

   Because of the way we called `cheapFail` when it reverts it causes the entire transaction to revert.
   There is a way to call subcontracts without propagating revert, [see here for directions](https://stackoverflow.com/questions/72102722/can-transaction-fail-but-the-calling-contract-will-think-it-was-successful).
