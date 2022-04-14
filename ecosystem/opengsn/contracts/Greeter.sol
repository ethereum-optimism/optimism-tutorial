//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract Greeter is BaseRelayRecipient {
  string greeting;
  address lastGreeter;

  event LogEntry(address indexed _soliditySender, 
                 address _gsnSender,
                 address _trustedForwarder,
                 address _lastGreeter,
                 bytes _data);


  constructor(string memory _greeting, address _trustedForwarderAddr) {
    greeting = _greeting;
    _setTrustedForwarder(_trustedForwarderAddr);
    lastGreeter = _msgSender();
  }

  function versionRecipient() external virtual view override returns (string memory) {
    return "v. 1.0.0";
  }

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
