//SPDX-License-Identifier: Unlicense
// This contracts runs on L1, and controls a Greeter on L2.
// The addresses are specific to Optimistic Goerli.
pragma solidity ^0.8.0;

import { ICrossDomainMessenger } from 
    "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
    
contract Bedrock_FromL1_ControlL2Greeter {
    // Taken from https://oplabs.notion.site/Contract-Addresses-8669ef7d6f124accb0220a5e0f24be0d
    address crossDomainMessengerAddr = 0x838a6DC4E37CA45D4Ef05bb776bf05eEf50798De ;

    address greeterL2Addr = 0xf1918D0752270E0c0c7c845d2691FeFd764C72d2;

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
