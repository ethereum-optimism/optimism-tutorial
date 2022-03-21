//SPDX-License-Identifier: Unlicense
// This contracts runs on L2, and controls a Greeter on L1.
pragma solidity ^0.8.0;

import { ICrossDomainMessenger } from 
    "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
    
contract ControlL1Greeter {
    address crossDomainMessengerAddr = 0x4200000000000000000000000000000000000007;

    address greeterL1Addr = 0x11fB328D5Bd8E27917535b6d40b881d35BC39Be0;

    function setGreeting(string calldata _greeting) public {
        bytes memory message;
            
        message = abi.encodeWithSignature("setGreeting(string)", 
            _greeting);

        ICrossDomainMessenger(crossDomainMessengerAddr).sendMessage(
            greeterL1Addr,
            message,
            1000000   // irrelevant here
        );
    }      // function setGreeting 

}          // contract ControlL1Greeter
