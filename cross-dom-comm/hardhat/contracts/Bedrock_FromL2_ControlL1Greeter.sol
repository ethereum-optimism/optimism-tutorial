//SPDX-License-Identifier: Unlicense
// This contracts runs on L2, and controls a Greeter on L1.
// The greeter address is specific to Goerli.
pragma solidity ^0.8.0;

import { ICrossDomainMessenger } from 
    "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
    
contract Bedrock_FromL2_ControlL1Greeter {
    // Taken from https://github.com/ethereum-optimism/optimism/tree/develop/packages/contracts/deployments/goerli#layer-2-contracts
    // Should be the same on all Optimism networks
    address crossDomainMessengerAddr = 0x4200000000000000000000000000000000000007;

    address greeterL1Addr = 0x3D97905442D4265E648AB7Bf3E05Fa85393CF615;

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

}          // contract Bedrock_FromL2_ControlL1Greeter
