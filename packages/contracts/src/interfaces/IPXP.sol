// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Auto-generated from src/PXP.sol — DO NOT EDIT (regenerate with the script only)

interface IPXP {
    function mint(address to, uint256 amount) external;
    function decimals() external pure returns (uint8);
    function transfer(address, uint256) external pure returns (bool);
    function transferFrom(address, address, uint256) external pure returns (bool);
    function approve(address, uint256) external pure returns (bool);
}
