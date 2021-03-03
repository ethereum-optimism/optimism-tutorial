// SPDX-License-Identifier: MIT
pragma solidity >0.5.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Contract Imports */
import { MyERC20 } from "./MyERC20.sol";

/* Library Imports */
import { Abs_L2DepositedToken } from "@eth-optimism/contracts/build/contracts/OVM/bridge/tokens/Abs_L2DepositedToken.sol";

/**
 * @title MyL2DepositedERC20
 * @dev An L2 Deposited ERC20 is an ERC20 implementation which represents L1 assets deposited into L2, minting and burning on
 * deposits and withdrawals.
 * 
 * `MyL2DepositedERC20` uses the Abs_L2DepositedToken class provided by optimism to link into a standard L1 deposit contract
 * while using the `MyERC20`implementation I as a developer want to use.
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract MyL2DepositedERC20 is Abs_L2DepositedToken, MyERC20 {

    constructor(
        address _l2CrossDomainMessenger,
        uint8 _decimals,
        string memory _name,
        string memory _symbol
    )
        Abs_L2DepositedToken(_l2CrossDomainMessenger)
        MyERC20(_decimals, _name, _symbol, 0)
    {}

    function _handleInitiateWithdrawal(
        address _to,
        uint _amount
    )
        internal
        override
    {
        _burn(msg.sender, _amount);
    }

    function _handleFinalizeDeposit(
        address _to,
        uint _amount
    )
        internal
        override
    {
        _mint(_to, _amount);
    }
}
