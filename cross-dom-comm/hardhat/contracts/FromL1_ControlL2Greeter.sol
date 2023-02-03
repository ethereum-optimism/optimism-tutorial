//SPDX-License-Identifier: Unlicense
// This contracts runs on L1, and controls a Greeter on L2.
// The addresses are specific to Optimistic Goerli.
pragma solidity ^0.8.0;

import { ICrossDomainMessenger } from 
    "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
    
contract FromL1_ControlL2Greeter {
    // Taken from https://community.optimism.io/docs/useful-tools/networks/#optimism-goerli

    address crossDomainMessengerAddr = 0x5086d1eEF304eb5284A0f6720f79403b4e9bE294;

    address greeterL2Addr = 0xE8B462EEF7Cbd4C855Ea4B65De65a5c5Bab650A9;

    function setGreeting(string calldata _greeting) public {
        bytes memory message;
            
        message = abi.encodeWithSignature("setGreeting(string,address)", 
            _greeting, msg.sender);

        ICrossDomainMessenger(crossDomainMessengerAddr).sendMessage(
            greeterL2Addr,
            message,
            1000000   // within the free gas limit amount
        );
    }      // function setGreeting 

}          // contract FromL1_ControlL2Greeter
