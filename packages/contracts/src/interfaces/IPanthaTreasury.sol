// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Auto-generated from src/PanthaTreasury.sol — DO NOT EDIT (regenerate with the script only)

interface IPanthaTreasury {
    function token() external view returns (address);
    function withdraw(address to, uint256 amount) external;
}
