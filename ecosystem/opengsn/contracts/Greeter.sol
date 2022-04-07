//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract Greeter is BaseRelayRecipient {
  string greeting;
  address lastGreeter;
  address immutable trustedForwarderAddr;

  event LogEntry(address indexed _soliditySender, 
                 address _gsnSender,
                 address _trustedForwarder,
                 address _lastGreeter,
                 bytes _data);


  constructor(string memory _greeting, address _trustedForwarderAddr) {
    greeting = _greeting;
    trustedForwarderAddr = /* 0x39A2431c3256028a07198D2D27FD120a1f81ecae;*/ _trustedForwarderAddr;
    lastGreeter = _msgSender();
  }

  function versionRecipient() external virtual view override returns (string memory) {
    return "v. 1.0.0";
  }

  function trustedForwarder() public view override returns (address) {
    return trustedForwarderAddr;
  }
/*
    if (block.chainid == 10) {    // Optimism
      return 0x67097a676FCb14dc0Ff337D0D1F564649aD94715;
    }
    if (block.chainid == 69) {   // Optimistic Kovan
      return 0x39A2431c3256028a07198D2D27FD120a1f81ecae;
    }

    revert("unknown chain");
    */

  function greet() public view returns (string memory) {
    return greeting;
  }

  function lastGreeterAddr() public view returns (address) {
    return lastGreeter;
  }

  function setGreeting(string memory _greeting) public {

  emit LogEntry(msg.sender, 
                 _msgSender(),
                 trustedForwarder(),
                 lastGreeter,
                msg.data );
    
    greeting = _greeting;
    lastGreeter = _msgSender();
  }



}
