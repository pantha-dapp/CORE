// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPanthaOrchestrator.sol";

contract PanthaCertificationAuthority {
    IPanthaOrchestrator public immutable orchestrator;

    mapping(address => bytes32) public actionChainMerkleRoots;
    mapping(bytes32 => bool) public usedActionChainRoots;

    constructor() {
        orchestrator = IPanthaOrchestrator(msg.sender); // expect orcestaror to be the deployer
    }

    modifier onlyOrchestrator() {
        require(msg.sender == address(orchestrator), "Only orchestrator");
        _;
    }

    modifier onlyServer() {
        require(msg.sender == address(orchestrator.server()), "Only server");
        _;
    }

    function certify(address user_) external onlyOrchestrator {
        require(user_ != address(0), "Invalid user");

        bytes32 actionChainRoot = actionChainMerkleRoots[user_];
        require(actionChainRoot != bytes32(0), "No action chain root for user");
        require(
            !usedActionChainRoots[actionChainRoot],
            "Action chain root already used"
        );

        usedActionChainRoots[actionChainRoot] = true;
    }

    function commitActionChainRoot(
        address user_,
        bytes32 actionChainRoot_
    ) external onlyOrchestrator {
        require(user_ != address(0), "Invalid user");
        require(actionChainRoot_ != bytes32(0), "Invalid action chain root");

        actionChainMerkleRoots[user_] = actionChainRoot_;
    }
}
