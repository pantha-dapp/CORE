// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IPanthaOrchestrator.sol";
import "./errors/EPanthaKeyStore.sol";
import "./errors/EPanthaCertificationAuthority.sol";

contract PanthaKeyStore is EIP712 {
    using ECDSA for bytes32;

    struct KeygenData {
        bytes32 seedSalt;
        bytes20 challengeSalt;
        bytes32 publicKey;
    }

    IPanthaOrchestrator public immutable orchestrator;

    mapping(address => bool) public isRegistered;
    mapping(address => KeygenData) public keygenData;

    event KeygenDataRegistered(address indexed user);

    modifier onlyServer() {
        if (msg.sender != address(orchestrator.server())) revert OnlyServer();
        _;
    }

    constructor() EIP712("FSKeyRegistry", "1") {
        orchestrator = IPanthaOrchestrator(msg.sender); // expect orcestaror to be the deployer
    }

    bytes32 private constant REGISTER_KEYGEN_DATA_TYPEHASH =
        keccak256(
            "RegisterKeygenData(bytes32 seedSalt,bytes20 challengeSalt,bytes32 publicKey,bytes calldata signature,address walletAddress)"
        );

    function registerKeygenData(
        bytes32 seedSalt_,
        bytes20 challengeSalt_,
        bytes32 publicKey_,
        bytes calldata signature_
    ) external onlyServer {
        if (seedSalt_ == bytes32(0)) revert InvalidSeedSalt();
        if (challengeSalt_ == bytes20(0)) revert InvalidChallengeSalt();
        if (publicKey_ == bytes32(0)) revert InvalidPublicKey();
        if (isRegistered[msg.sender]) revert DataAlreadyRegistered();

        if (
            !validateKeygenDataRegistrationSignature(
                seedSalt_,
                challengeSalt_,
                publicKey_,
                signature_,
                msg.sender
            )
        ) revert InvalidSignature();

        keygenData[msg.sender] = KeygenData({
            seedSalt: seedSalt_,
            challengeSalt: challengeSalt_,
            publicKey: publicKey_
        });

        emit KeygenDataRegistered(msg.sender);
    }

    function validateKeygenDataRegistrationSignature(
        bytes32 seedSalt_,
        bytes20 challengeSalt_,
        bytes32 publicKey_,
        bytes calldata signature_,
        address walletAddress_
    ) public view returns (bool) {
        bytes32 structHash = keccak256(
            abi.encode(
                REGISTER_KEYGEN_DATA_TYPEHASH,
                seedSalt_,
                challengeSalt_,
                publicKey_
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature_);
        return recovered == walletAddress_;
    }
}
