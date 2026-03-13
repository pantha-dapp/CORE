// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PXP is ERC20, Ownable {
    error NonTransferable();

    constructor() ERC20("PanthaXP", "PXP") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// @notice Transfers are disabled - PXP is soulbound
    function transfer(address, uint256) public pure override returns (bool) {
        revert NonTransferable();
    }

    /// @notice Transfers are disabled - PXP is soulbound
    function transferFrom(
        address,
        address,
        uint256
    ) public pure override returns (bool) {
        revert NonTransferable();
    }

    /// @notice Approvals are disabled - PXP is soulbound
    function approve(address, uint256) public pure override returns (bool) {
        revert NonTransferable();
    }
}
