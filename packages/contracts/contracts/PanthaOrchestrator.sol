// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PXP.sol";

contract PanthaOrchestrator {
    IERC20 public pxp;
    address public server;

    event RewardsDistributed(
        address indexed recipient,
        uint256 amount,
        bytes8 reason,
        bytes8 reasonResourceIdentifier
    );

    modifier onlyServer() {
        require(msg.sender == server, "Only server can call this function");
        _;
    }

    constructor() {
        pxp = new PXP();
        server = msg.sender;
    }

    function distributeRewards(
        address recipient,
        uint256 amount,
        bytes8 reason
    ) external onlyServer {
        PXP(address(pxp)).mint(recipient, amount);
        emit RewardsDistributed(recipient, amount, reason);
    }
}
