//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "forge-std/console.sol";

contract Fail {

  function revert() public {
    require(false, "false is false! Amazin!");
  }
}   // contract Greeter
