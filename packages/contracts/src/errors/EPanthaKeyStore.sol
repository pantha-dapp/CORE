// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title PanthaKeyStore Error Definitions
/// @notice Custom error definitions for PanthaKeyStore contract

/// @notice Thrown when seed salt is invalid (all zeros)
error InvalidSeedSalt();

/// @notice Thrown when challenge salt is invalid (all zeros)
error InvalidChallengeSalt();

/// @notice Thrown when public key is invalid (all zeros)
error InvalidPublicKey();

/// @notice Thrown when keygen data is already registered for the caller
error DataAlreadyRegistered();

/// @notice Thrown when signature validation fails
error InvalidSignature();
