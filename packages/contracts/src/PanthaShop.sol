//// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPanthaOrchestrator.sol";
import "./interfaces/IERC20PermitToken.sol";

contract PanthaShop {
    IERC20PermitToken public immutable token;
    IPanthaOrchestrator public immutable orchestrator;

    event ItemPurchased(
        address indexed buyer,
        bytes32 indexed purchaseId,
        uint256 amount
    );

    constructor() {
        orchestrator = IPanthaOrchestrator(msg.sender); // the orchestrator deploys  shop
        token = IERC20PermitToken(orchestrator.panthaToken());
    }

    function buyWithPermit(
        address owner,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes32 purchaseId
    ) external {
        token.permit(owner, address(this), value, deadline, v, r, s);
        token.transferFrom(owner, orchestrator.treasury(), value);

        emit ItemPurchased(owner, purchaseId, value);
    }
}
