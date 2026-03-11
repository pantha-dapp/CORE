// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PXP is ERC20 {
    constructor() ERC20("PanthaXP", "PXP") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
