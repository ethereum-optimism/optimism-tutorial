//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";


interface ICommitReveal {
  function getCommit(address _ofAddr) external view returns (uint);
  function getReveal(address _ofAddr) external view returns (uint);
  function resetAddr(address _addr) external;
  function getMyCommit() external view returns (uint);
  function getMyReveal() external view returns (uint);  
  function commit(uint _val) external;
  function reveal(uint _val) external;
  function commit3rdParty(uint _val, address _addr) external;
  function reveal3rdParty(uint _val, address _addr) external;  
}


contract Random is Ownable {
    // Pairs of addresses that want to generate random numbers together
    mapping(address => address) pairs;

    // Proposed pairings
    mapping(address => address) proposals;

    // Our CommitReveal
    ICommitReveal commitReveal;


    event GotRandom(address indexed _addr1, address indexed _addr2, uint _value);

    constructor(address _commitReveal) {
        commitReveal = ICommitReveal(_commitReveal);
    }


    // Various conditions
    function _isInCommitStatus(address _a) view internal {
        require (commitReveal.getCommit(_a) != 0, "Must have committed value");
        require (commitReveal.getReveal(_a) == 0, "But not revealed value");        
    }

    function _isInRevealStatus(address _a) view internal {
        require (commitReveal.getReveal(_a) != 0, "Must have revealed value");        
    }


    function _isNotInProposal(address _a) view internal {
        require (proposals[_a] == address(0),  "Already in a proposal");
    }


    function _isNotInPair(address _a) view internal {
        require (pairs[_a] == address(0), "Already in a pair");
    }


    function _createPair(address _a1, address _a2) internal {
        _isInCommitStatus(_a1);
        _isInCommitStatus(_a2);
        _isNotInPair(_a1);
        _isNotInPair(_a2);              
        pairs[_a1] = _a2;
        pairs[_a2] = _a1;
    }

    function _createProposal(address _a1, address _a2) internal {
        _isInCommitStatus(_a1);
        _isInCommitStatus(_a2);
        _isNotInProposal(_a1);
        _isNotInProposal(_a2);        
        _isNotInPair(_a1);           
        _isNotInPair(_a2);                   
        proposals[_a1] = _a2;
        proposals[_a2] = _a1;
    }


    function _deletePair(address _a1, address _a2) internal {
        require(pairs[_a1] == _a2 && pairs[_a2] == _a1, 
            "Can't delete pair that doesn't exist");
        pairs[_a1] = address(0);
        pairs[_a2] = address(0);
    }

    function _deleteProposal(address _a1, address _a2) internal {
        require(proposals[_a1] == _a2 && proposals[_a2] == _a1, 
            "Can't delete proposal that doesn't exist");        
        proposals[_a1] = address(0);
        proposals[_a2] = address(0);
    }


    function proposePairing(address _withAddr) external {
        _createProposal(msg.sender, _withAddr);
    }


    function proposeAndCommit(address _withAddr, uint _val) external {
        commitReveal.commit3rdParty(_val, msg.sender);
        _createProposal(msg.sender, _withAddr);
    }    


    function rejectProposal(address _withAddr) external {
        _deleteProposal(msg.sender, _withAddr);
    }

    function acceptProposal(address _withAddr) external {
        _deleteProposal(msg.sender, _withAddr);
        _createPair(msg.sender, _withAddr);        
    }

    function acceptAndCommit(address _withAddr, uint _val) external {
        commitReveal.commit3rdParty(_val, msg.sender);
        _deleteProposal(msg.sender, _withAddr);        
        _createPair(msg.sender, _withAddr);        
    }


    function getRandom(address _withAddr) external returns (uint) {
        _isInRevealStatus(msg.sender);
        _isInRevealStatus(_withAddr);        

        // Either we don't need the pair anymore, or this will revert
        // and it won't matter
        _deletePair(msg.sender, _withAddr);

        uint rand = commitReveal.getReveal(msg.sender) ^ 
                    commitReveal.getReveal(_withAddr);

        // Delete associated commitments
        commitReveal.resetAddr(msg.sender);
        commitReveal.resetAddr(_withAddr);

        emit GotRandom(msg.sender, _withAddr, rand);

        return rand;
    }


    function getCommitReveal() external view returns (address) {
        return address(commitReveal);
    }
}