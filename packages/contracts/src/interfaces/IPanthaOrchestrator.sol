// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Auto-generated from src/PanthaOrchestrator.sol — DO NOT EDIT (regenerate with the script only)

interface IPanthaOrchestrator {
    function panthaToken() external view returns (address);
    function pxp() external view returns (address);
    function certificationAuthority() external view returns (address);
    function keyStore() external view returns (address);
    function server() external view returns (address);
    function totalXp() external view returns (uint256);
    function accRewardPerXp() external view returns (uint256);
    function userXp(address key) external view returns (uint256);
    function rewardDebt(address key) external view returns (uint256);
    event XpMinted();
    event RewardsDistributed();
    event RewardClaimed();
    function cycleServer(address newServer_) external;
    function distribute(uint256 amount_) external;
    function claim() external;
    function mintXp(address recipient_, uint256 amount_, bytes8 reason_, bytes8 reasonResourceIdentifier_) external;
    function pendingRewards(address user) external view returns (uint256);
}
