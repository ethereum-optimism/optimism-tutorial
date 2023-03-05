// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

// Copied from FlipsideCrypto's
// https://github.com/FlipsideCrypto/user_metrics/blob/main/apps/optimism/attestation_contracts/contracts/FlipsideAttestation.sol
// with small changes.


// To verify signatures
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// The owner is the signer
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";


interface IAttestationStation {
    struct AttestationData {
        address about;
        bytes32 key;
        bytes val;
    }

    event AttestationCreated(
        address indexed creator,
        address indexed about,
        bytes32 indexed key,
        bytes val
    );

    function attest(AttestationData[] memory _attestations) external;
}


contract AttestationProxy is Ownable {
    using ECDSA for bytes32;

    /// @dev The interface for OP's Attestation Station.
    IAttestationStation public attestationStation;

    constructor(
        address _attestationStation
    ) {
        attestationStation = IAttestationStation(_attestationStation);
    }

    /**
     * @notice Allows the owner to change the AttestationStation implementation.
     * @param _attestationStation The address of the new AttestationStation implementation.
     * 
     * Requirements:
     * - The caller must be the current owner.
     */
    function setAttestationStation(address _attestationStation) public 
    onlyOwner    
    {
        attestationStation = IAttestationStation(_attestationStation);
    }

    /**
     * @notice Attest data
     * @param _about The address of the account to be attested.
     * @param _key The key of the attestation.
     * @param _val The value of the attestation.
     * @param _signature The signature of the attestation.
     */
    function attest(
          address _about
        , bytes32 _key
        , bytes memory _val
        , bytes memory _signature
    ) 
        public
    {
        _verifySignature(
              _about
            , _key
            , _val
            , _signature
        );

        // Send the attestation to the Attestation Station.
        IAttestationStation.AttestationData[] memory attestations = new IAttestationStation.AttestationData[](1);
        attestations[0] = IAttestationStation.AttestationData({
              about: _about
            , key: _key
            , val: _val
        });
        attestationStation.attest(attestations);
    }

    /**
     * @notice Verifies the attestation data before calling the OP AttestationStation attest.
     * @param _about The address of the account to be attested.
     * @param _key The key of the attestation.
     * @param _val The value of the attestation.
     * @param _signature The signer's signed message of the attestation.
     * 
     * Requirements:
     * - The signature must resolve to the signer.
     */
    function _verifySignature(
          address _about
        , bytes32 _key
        , bytes memory _val
        , bytes memory _signature
    )
        internal
        view
    {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                  _about
                , _key
                , _val
            )
        );

        require(messageHash.toEthSignedMessageHash().recover(_signature) == owner(), 
            "AttestationProxy: Invalid signature");
    }
}
