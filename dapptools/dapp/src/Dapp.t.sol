// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.6;

import "ds-test/test.sol";

import "./Dapp.sol";

contract DappTest is DSTest {
    Dapp dapptutorial;

    function setUp() public {
        dapptutorial = new Dapp();
    }

    function test_withdraw() public {
        payable(address(dapptutorial)).transfer(1 ether);
        uint preBalance = address(this).balance;
        dapptutorial.withdraw(42);
        uint postBalance = address(this).balance;
        assertEq(preBalance + 1 ether, postBalance);
    }

    function testFail_withdraw_wrong_pass() public {
        payable(address(dapptutorial)).transfer(1 ether);
        uint preBalance = address(this).balance;
        dapptutorial.withdraw(1);
        uint postBalance = address(this).balance;
        assertEq(preBalance + 1 ether, postBalance);
    }

    receive() external payable {
    }
}
