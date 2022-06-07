// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract MockContract {
  event One(uint indexed arg);

  function doEmitOne() public {
    emit One(1);
  }

  function doRevert() public pure {
    revert('Revert cause');
  }
}
