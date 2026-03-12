// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Auto-generated from src/PanthaCertificate.sol — DO NOT EDIT (regenerate with the script only)

interface IPanthaCertificate {
    function nextTokenId() external view returns (uint256);
    function authority() external view returns (address);
    function mint(address to, string memory metadataURI) external;
}
