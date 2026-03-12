// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PXP.sol";

contract PanthaOrchestrator is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable panthaToken;
    PXP public immutable pxp;

    address public server;

    uint256 public totalXp;
    uint256 public accRewardPerXp;

    uint256 constant PRECISION = 1e12;

    mapping(address => uint256) public userXp;
    mapping(address => uint256) public rewardDebt;

    event XpMinted(
        address indexed user,
        uint256 amount,
        bytes8 reason,
        bytes8 reasonResourceIdentifier
    );

    event RewardsDistributed(uint256 amount);

    event RewardClaimed(address indexed user, uint256 amount);

    modifier onlyServer() {
        require(msg.sender == server, "Only server");
        _;
    }

    constructor(IERC20 panthaToken_) {
        panthaToken = panthaToken_;
        pxp = new PXP();
        server = msg.sender;
    }

    function cycleServer(address newServer_) external onlyServer {
        require(newServer_ != address(0), "Invalid server");
        server = newServer_;
    }

    function distribute(uint256 amount_) external onlyServer {
        require(totalXp > 0, "No XP minted");

        panthaToken.safeTransferFrom(msg.sender, address(this), amount_);

        accRewardPerXp += (amount_ * PRECISION) / totalXp;

        emit RewardsDistributed(amount_);
    }

    function claim() external nonReentrant {
        _claim(msg.sender);
    }

    function mintXp(
        address recipient_,
        uint256 amount_,
        bytes8 reason_,
        bytes8 reasonResourceIdentifier_
    ) external onlyServer {
        require(recipient_ != address(0), "Invalid recipient");
        require(amount_ > 0, "Zero XP");

        _claim(recipient_);

        pxp.mint(recipient_, amount_);

        userXp[recipient_] += amount_;
        totalXp += amount_;

        rewardDebt[recipient_] =
            (userXp[recipient_] * accRewardPerXp) /
            PRECISION;

        emit XpMinted(recipient_, amount_, reason_, reasonResourceIdentifier_);
    }

    function pendingRewards(address user) external view returns (uint256) {
        uint256 xp = userXp[user];

        uint256 accumulated = (xp * accRewardPerXp) / PRECISION;

        return accumulated - rewardDebt[user];
    }

    function _claim(address user) internal {
        uint256 xp = userXp[user];

        if (xp == 0) return;

        uint256 accumulated = (xp * accRewardPerXp) / PRECISION;

        uint256 pending = accumulated - rewardDebt[user];

        if (pending > 0) {
            panthaToken.safeTransfer(user, pending);

            emit RewardClaimed(user, pending);
        }

        rewardDebt[user] = accumulated;
    }
}
