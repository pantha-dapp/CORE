// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Auto-generated from src/PanthaCertificationAuthority.sol — DO NOT EDIT (regenerate with the script only)

interface IPanthaCertificationAuthority {
    function orchestrator() external view returns (address);
    function certificate() external view returns (address);
    function actionChainMerkleRoots(address key) external view returns (bytes32);
    function usedActionChainRoots(bytes32 key) external view returns (bool);
    event ActionChainRootCommitted();
    event UserCertified();
    function certify(address user_, string calldata metadataURI_) external;
    function commitActionChainRoot(address user_, bytes32 actionChainRoot_) external;
}
