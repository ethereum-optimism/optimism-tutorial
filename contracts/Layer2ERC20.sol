// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import { ERC20 } from "./ERC20.sol";
import { Layer2Bridged } from "./Layer2Bridged.sol";

contract Layer2ERC20 is ERC20, Layer2Bridged {

    /**
     * @param _initialSupply Initial maximum token supply.
     * @param _name A name for our ERC20 (technically optional, but it's fun ok jeez).
     */
    constructor(
        uint256 _initialSupply,
        string memory _name
    )
        public
        ERC20(_initialSupply, _name)
    {}

    function mint(
        address _recipient,
        uint256 _amount
    )
        public
        onlyViaBridge
    {
        balances[_recipient] += _amount;
        totalSupply += _amount;
    }

    function withdraw(
        uint256 _amount
    )
        public
    {
        require(
            balances[msg.sender] >= _amount,
            "You don't have enough balance!"
        );

        balances[msg.sender] -= _amount;
        totalSupply -= _amount;

        bytes memory message = abi.encodeWithSignature(
            "withdraw(address,uint256)",
            msg.sender,
            _amount
        );

        sendMessageViaBridge(
            message,
            8000000
        );
    }
}
