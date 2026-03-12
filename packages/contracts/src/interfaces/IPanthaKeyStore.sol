// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Auto-generated from src/PanthaKeyStore.sol — DO NOT EDIT (regenerate with the script only)

interface IPanthaKeyStore {
    struct KeygenData {
        bytes32 seedSalt;
        bytes20 challengeSalt;
        bytes32 publicKey;
    }

    function orchestrator() external view returns (address);
    function isRegistered(address key) external view returns (bool);
    function keygenData(address key) external view returns (KeygenData memory);
    event KeygenDataRegistered();
    function registerKeygenData(bytes32 seedSalt_, bytes20 challengeSalt_, bytes32 publicKey_, bytes calldata signature_) external;
    function validateKeygenDataRegistrationSignature(bytes32 seedSalt_, bytes20 challengeSalt_, bytes32 publicKey_, bytes calldata signature_, address walletAddress_) external view returns (bool);
}
