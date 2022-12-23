//SPDX-License-Identifier: Unlicense
// This contracts runs on L1, and controls a Greeter on L2.
// The addresses are specific to Optimistic Goerli.
pragma solidity ^0.8.0;

import { ICrossDomainMessenger } from 
    "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
    
contract Bedrock_FromL1_ControlL2Greeter {
    address crossDomainMessengerAddr = 0x3e654CBd61711dC9D114b61813846b6401695f07;

    address greeterL2Addr = 0xa81CD040903A7431d1c7AF269f039574eab5B7D8;

    function setGreeting(string calldata _greeting) public {
        bytes memory message;
            
        message = abi.encodeWithSignature("setGreeting(string)", 
            _greeting);

        ICrossDomainMessenger(crossDomainMessengerAddr).sendMessage(
            greeterL2Addr,
            message,
            1000000   // within the free gas limit amount
        );
    }      // function setGreeting 

}          // contract Bedrock_FromL1_ControlL2Greeter
