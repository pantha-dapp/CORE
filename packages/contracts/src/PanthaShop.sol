//// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPanthaOrchestrator.sol";

contract PanthaShop {
    IERC20PermitToken public immutable token;
    IPanthaOrchestrator public immutable orchestrator;

    constructor() {
        orchestrator = IPanthaOrchestrator(msg.sender); // the orchestrator deploys  shop
        token = orchestrator.panthaToken();
    }

    function buyWithPermit(
        address owner,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes32 itemId // or uint256
    ) external {
        // 1. Approve via signature
        token.permit(owner, address(this), value, deadline, v, r, s);

        // 2. Transfer tokens
        token.transferFrom(owner, treasury, value);

        // 3. Execute logic
        _deliverItem(owner, itemId, value);
    }
}
