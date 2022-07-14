// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "src/Greeter.sol";
import "forge-std/console.sol";

contract GreeterTest is Test {
    Greeter greeter;

    event SetGreeting(
        address sender,     // msg.sender
        address origin,     // tx.origin
        address xorigin);   // cross domain origin, if any    

    function setUp() public {
        greeter = new Greeter("hello");
    }     // setUp
  
    function testGreeting() public {
        string memory greeting;

        greeting = greeter.greet();
        assertEq(greeting, "hello");
    }     // testGreeting

    function testSetGreeting() public {
        string memory greeting;

        vm.expectEmit(true, true, true, false);
        emit SetGreeting(
            address(0xb4c79daB8f259C7Aee6E5b2Aa729821864227e84), 
            address(0x00a329c0648769A73afAc7F9381E08FB43dBEA72), 
            address(0)
        );
        greeter.setGreeting("New Greeting");
        greeting = greeter.greet();
        assertEq(greeting, "New Greeting");
    }     // testSetGreeting
}   // contract GreeterTest
