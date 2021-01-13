// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import { ERC20 } from "./ERC20.sol";
import { Layer2Bridged } from "./Layer2Bridged.sol";

contract ERC20Adapter is Layer2Bridged {
    ERC20 erc20;

    constructor(
        ERC20 _erc20
    )
        public
    {
        erc20 = _erc20;
    }

    function deposit(
        address _depositor,
        uint256 _amount
    )
        public
    {
        // 1. Transfer the amount from the depositor to this contract.
        erc20.transferFrom(
            _depositor,
            address(this),
            _amount
        );

        // 2. Generate a contract call to be executed on Layer 2.
        bytes memory message = abi.encodeWithSignature(
            "mint(address,uint256)",
            _depositor,
            _amount
        );

        // 3. Send the message to our partner contract.
        sendMessageViaBridge(
            message,
            8000000
        );
    }

    function withdraw(
        address _withdrawer,
        uint256 _amount
    )
        public
        onlyViaBridge
    {
        erc20.transfer(
            _withdrawer,
            _amount
        );
    }
}
