// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Fail in various interesting ways to demonstrate how to use tenderly
// to identify failures.
contract Fail {
    uint counter = 0;
    uint uselessData = 0;

    Fail next;

    constructor(Fail nextFail) {
        next = nextFail;    
    }

    function useless() private {
        for(uint i=0; i<10; i++)
            uselessData += i;
    }

    function alsoUseless() private {
        for(uint i=0; i<10; i++)
            uselessData += i;
    }    

    function success() public returns (uint) {
        useless();
        counter++;
        if (address(next) != address(0x00)) {
            next.success();        
            alsoUseless();
        }
        
        return counter;
    }

    function cheapFail() public returns (uint) {
        useless();
        counter++;    
        if (address(next) != address(0x00)) {
            next.cheapFail();
            alsoUseless();
        }

        require(false, "Failure, but a cheap one");

        return counter;
    }

    function expensiveFail() public returns (uint) {
        useless();
        counter++;
        if (address(next) != address(0x00)) {
            next.expensiveFail();   
            alsoUseless();
        }

        require(false, "Failure, costing all of your gas");

        return counter;
    }

    function complex() public {
        useless();
        next.success();
        alsoUseless();
        next.cheapFail();
        alsoUseless();
    }  // function complex
}    // contract Fail
