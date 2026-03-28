// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPanthaOrchestrator.sol";
import "./errors/EPanthaCertificationAuthority.sol";
import "./PanthaCertificate.sol";

contract PanthaCertificationAuthority {
    IPanthaOrchestrator public immutable orchestrator;
    PanthaCertificate public immutable certificate;

    mapping(address => bytes32) public actionChainMerkleRoots;
    mapping(bytes32 => bool) public usedActionChainRoots;

    event ActionChainRootCommitted(
        address indexed user,
        bytes32 indexed actionChainRoot
    );
    event UserCertified(address indexed user, string metadataURI);

    constructor() {
        orchestrator = IPanthaOrchestrator(msg.sender); // expect orcestaror to be the deployer

        certificate = new PanthaCertificate();
    }

    modifier onlyOrchestrator() {
        if (msg.sender != address(orchestrator)) revert OnlyOrchestrator();
        _;
    }

    modifier onlyServer() {
        if (msg.sender != address(orchestrator.server())) revert OnlyServer();
        _;
    }

    function certify(
        address user_,
        string calldata metadataURI_
    ) external onlyOrchestrator {
        if (user_ == address(0)) revert InvalidUser();

        bytes32 actionChainRoot = actionChainMerkleRoots[user_];
        if (actionChainRoot == bytes32(0)) revert NoActionChainRoot();
        if (usedActionChainRoots[actionChainRoot])
            revert ActionChainRootAlreadyUsed();

        usedActionChainRoots[actionChainRoot] = true;

        certificate.mint(user_, metadataURI_);

        emit UserCertified(user_, metadataURI_);
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

        emit ActionChainRootCommitted(user_, actionChainRoot_);
    }
}
