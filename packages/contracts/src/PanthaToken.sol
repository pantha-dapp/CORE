// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PXP is ERC20, Ownable {
    constructor(
        uint256 initialSupply_
    ) ERC20("Pantha", "PANTHA") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply_ * (10 ** decimals()));
    }
}
