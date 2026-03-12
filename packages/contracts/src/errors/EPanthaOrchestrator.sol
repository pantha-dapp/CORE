// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title PanthaOrchestrator Error Definitions
/// @notice Custom error definitions for PanthaOrchestrator contract

/// @notice Thrown when provided server address is invalid (zero address)
error InvalidServer();

/// @notice Thrown when no XP has been minted
error NoXpMinted();

/// @notice Thrown when recipient address is invalid (zero address)
error InvalidRecipient();

/// @notice Thrown when amount is zero
error ZeroXp();
