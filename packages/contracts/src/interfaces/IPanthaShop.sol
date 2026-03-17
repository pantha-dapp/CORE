// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Auto-generated from src/PanthaShop.sol — DO NOT EDIT (regenerate with the script only)

interface IPanthaShop {
    function orchestrator() external view returns (address);
    event ItemPurchased();
    function buyWithPermit(address owner, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s, bytes8 itemId) external;
}
