//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@opengsn/contracts/src/BasePaymaster.sol";

/**
 * a paymaster for a single recipient contract.
 * - reject requests if destination is not the target contract.
 * - reject any request if the target contract reverts.
 */
contract SingleRecipientPaymaster is BasePaymaster {

    address public target;

    event TargetChanged(address oldTarget, address newTarget);

    constructor(address _target) {
        target=_target;
    }

    function versionPaymaster() external view override virtual returns (string memory){
        return "2.2.0+opengsn.recipient.ipaymaster";
    }

    function setTarget(address _target) external onlyOwner {
        emit TargetChanged(target, _target);
        target=_target;
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
    external
    override
    virtual
    returns (bytes memory context, bool revertOnRecipientRevert) {
        (relayRequest, signature, approvalData, maxPossibleGas);
        require(relayRequest.request.to==target, "wrong target");
	//returning "true" means this paymaster accepts all requests that
	// are not rejected by the recipient contract.
        return ("", true);
    }

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external override virtual {
        (context, success, gasUseWithoutPost, relayData);
    }
}
