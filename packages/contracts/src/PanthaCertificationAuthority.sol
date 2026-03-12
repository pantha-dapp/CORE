// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPanthaOrchestrator.sol";
import "./errors/EPanthaCertificationAuthority.sol";

contract PanthaCertificationAuthority {
    IPanthaOrchestrator public immutable orchestrator;

    mapping(address => bytes32) public actionChainMerkleRoots;
    mapping(bytes32 => bool) public usedActionChainRoots;

    constructor() {
        orchestrator = IPanthaOrchestrator(msg.sender); // expect orcestaror to be the deployer
    }

    modifier onlyOrchestrator() {
        if (msg.sender != address(orchestrator)) revert OnlyOrchestrator();
        _;
    }

    modifier onlyServer() {
        if (msg.sender != address(orchestrator.server())) revert OnlyServer();
        _;
    }

    function certify(address user_) external onlyOrchestrator {
        if (user_ == address(0)) revert InvalidUser();

        bytes32 actionChainRoot = actionChainMerkleRoots[user_];
        if (actionChainRoot == bytes32(0)) revert NoActionChainRoot();
        if (usedActionChainRoots[actionChainRoot])
            revert ActionChainRootAlreadyUsed();

        usedActionChainRoots[actionChainRoot] = true;
    }

    function commitActionChainRoot(
        address user_,
        bytes32 actionChainRoot_
    ) external onlyOrchestrator {
        require(user_ != address(0), "Invalid user");
        require(actionChainRoot_ != bytes32(0), "Invalid action chain root");

        if (user_ == address(0)) revert InvalidUser();
        if (actionChainRoot_ == bytes32(0)) revert InvalidActionChainRoot();

        actionChainMerkleRoots[user_] = actionChainRoot_;
    }
}
