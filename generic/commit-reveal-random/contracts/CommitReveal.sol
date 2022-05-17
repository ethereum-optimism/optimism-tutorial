//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";




contract CommitReveal is Ownable {
  mapping(address => uint) commitVal;
  mapping(address => uint) revealVal;  


  function getCommit(address _ofAddr) public view returns (uint) {
    return commitVal[_ofAddr];
  }

  function getReveal(address _ofAddr) public view returns (uint) {
    return revealVal[_ofAddr];
  }

  function resetAddr(address _addr) public onlyOwner {
    commitVal[_addr] = 0;
    revealVal[_addr] = 0;    
  }

  // Helper functions so users won't have to specify their own
  // addresses, saving on gas. In Optimistic rollups the major
  // expense is calldata (which is L1 gas), so these functions are
  // useful.
  function getMyCommit() public view returns (uint) {
    return getCommit(msg.sender);
  }

  function getMyReveal() public view returns (uint) {
    return getReveal(msg.sender);
  }  


  // Functions for users to commit/reveal their own values
  function commit(uint256 _val) external {
    _commit(_val, msg.sender);
  }

  function reveal(uint256 _val) external {
    _reveal(_val, msg.sender);
  }

  // The owner can do commits and reveals for other users, so users
  // don't have to sign multiple transactions. The owner will be a 
  // smart contract, which limits opportunities for abusing this.
  function commit3rdParty(uint _val, address _addr) external onlyOwner {
    _commit(_val, _addr);
  }

  function reveal3rdParty(uint _val, address _addr) external onlyOwner {
    _reveal(_val, _addr);
  }  


  // Internal functions that do the actual work
  function _commit(uint256 _val, address _addr) internal {
    require(commitVal[_addr] == 0 || commitVal[_addr] == _val, "Can't commit twice");
    require(revealVal[_addr] == 0, "Can't overwrite commitment after a reveal");
    require(_val != 0, "Zero is a special value");

    commitVal[msg.sender] = _val;
  }

  function _reveal(uint _val, address _addr) internal {
    require(commitVal[_addr] != 0, "Commit before reveal");
    require(_val != 0, "Zero is a special value");
    require(uint256(keccak256(abi.encode(_val))) == commitVal[_addr], 
      "Reveal must match commit");
    // It's OK to reveal twice, since it'll be the same value anyway
    
    revealVal[_addr] = _val;
  }
}