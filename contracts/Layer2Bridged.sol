// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import { iOVM_BaseCrossDomainMessenger } from "@eth-optimism/contracts/build/contracts/iOVM/bridge/iOVM_BaseCrossDomainMessenger.sol";

contract Layer2Bridged {
    address internal owner;
    address internal partner;
    address internal bridge;

    constructor()
        public
    {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Layer2Bridged: Function can only be called by the contract owner."
        );
        _;
    }

    modifier onlyViaBridge() {
        require(
            msg.sender == bridge,
            "Layer2Bridged: Function can only be called by the bridge contract."
        );

        require(
            iOVM_BaseCrossDomainMessenger(
                bridge
            ).xDomainMessageSender() == partner,
            "Layer2Bridged: Function can only be triggered by the partner contract."
        );

        _;
    }

    function createBridge(
        address _partner,
        address _bridge
    )
        public
        onlyOwner
    {
        partner = _partner;
        bridge = _bridge;
    }

    function sendMessageViaBridge(
        bytes memory _message,
        uint32 _gasLimit
    )
        internal
    {   
        iOVM_BaseCrossDomainMessenger(
            bridge
        ).sendMessage(
            partner,
            _message,
            _gasLimit
        );
    }
}
