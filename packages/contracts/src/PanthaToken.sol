// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PanthaToken is ERC20, Ownable, ERC20Permit {
    constructor(
        uint256 initialSupply_
    ) ERC20("Pantha", "PANTHA") ERC20Permit("PanthaToken") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply_ * (10 ** decimals()));
    }
}
