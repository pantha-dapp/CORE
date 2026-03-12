// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title PanthaCertificationAuthority Error Definitions
/// @notice Custom error definitions for PanthaCertificationAuthority contract

/// @notice Thrown when caller is not the orchestrator
error OnlyOrchestrator();

/// @notice Thrown when caller is not the server
error OnlyServer();

/// @notice Thrown when a user address is zero
error InvalidUser();

/// @notice Thrown when there is no action chain root for the user
error NoActionChainRoot();

/// @notice Thrown when action chain root has already been used
error ActionChainRootAlreadyUsed();

/// @notice Thrown when action chain root is invalid (all zeros)
error InvalidActionChainRoot();
