//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract Greeter is BaseRelayRecipient {
  string greeting;
  address lastGreeter;


  constructor(string memory _greeting) {
//    console.log("Deploying a Greeter with greeting:", _greeting);
    greeting = _greeting;
    lastGreeter = _msgSender();
  }

  function versionRecipient() external virtual view override returns (string memory) {
    return "v. 1.0.0";
  }

  function trustedForwarder() public view override returns (address) {
    if (block.chainid == 10) {    // Optimism
      return 0x67097a676FCb14dc0Ff337D0D1F564649aD94715;
    }
    if (block.chainid == 69) {   // Optimistic Kovan
      return  0x39A2431c3256028a07198D2D27FD120a1f81ecae;
    }

    revert("unknown chain");
  }

  function greet() public view returns (string memory) {
    return greeting;
  }

  function lastGreeterAddr() public view returns (address) {
    return lastGreeter;
  }

  function setGreeting(string memory _greeting) public {
//    console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
    greeting = _greeting;
    lastGreeter = _msgSender();
  }



}
