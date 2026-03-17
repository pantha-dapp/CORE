//// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPanthaOrchestrator.sol";

interface IERC20PermitToken is IERC20, IERC20Permit {}

contract PanthaShop {
    IPanthaOrchestrator public immutable orchestrator;

    event ItemPurchased(
        address indexed buyer,
        bytes8 indexed itemId,
        uint256 amount
    );

    constructor() {
        orchestrator = IPanthaOrchestrator(msg.sender); // the orchestrator deploys  shop
    }

    function buyWithPermit(
        address owner,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes8 itemId
    ) external {
        IERC20PermitToken token = IERC20PermitToken(orchestrator.panthaToken());

        token.permit(owner, address(this), value, deadline, v, r, s);
        token.transferFrom(owner, orchestrator.treasury(), value);

        emit ItemPurchased(owner, itemId, value);
    }
}
