//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// For cross domain messages' origin
import { ICrossDomainMessenger } from 
    "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";

contract Greeter {
  string greeting;

  event SetGreeting(
    address sender,     // msg.sender
    address origin,     // tx.origin
    address xorigin);   // cross domain origin, if any

  constructor(string memory _greeting) {
    greeting = _greeting;
  }

  function greet() public view returns (string memory) {
    return greeting;
  }

  function setGreeting(string memory _greeting) public {
    greeting = _greeting;
    emit SetGreeting(msg.sender, tx.origin, getXorig());
  }


  // Get the cross domain origin, if any
  function getXorig() private view returns (address) {
    // Get the cross domain messenger's address each time.
    // This is less resource intensive than writing to storage.
    address cdmAddr = address(0);    

    // Mainnet
    if (block.chainid == 1)
      cdmAddr = 0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1;

    // Goerli
    if (block.chainid == 5)
      cdmAddr = 0x5086d1eEF304eb5284A0f6720f79403b4e9bE294;

    // L2 (same address on every network)
    if (block.chainid == 10 || block.chainid == 420 || block.chainid == 902)
      cdmAddr = 0x4200000000000000000000000000000000000007;

    // If this isn't a cross domain message
    // Deal with the fact there are two cross domain messengers on Goerli
    // (one for the beta bedrock network)
    if (msg.sender != cdmAddr && msg.sender != 0x3e654CBd61711dC9D114b61813846b6401695f07)
      return address(0);

    // If it is a cross domain message, find out where it is from
    return ICrossDomainMessenger(cdmAddr).xDomainMessageSender();
  }    // getXorig()
}   // contract Greeter
