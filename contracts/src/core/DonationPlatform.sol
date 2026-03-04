// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

import { DonorBadge } from "../tokens/DonorBadge.sol";

/// @title DonationPlatform
/// @author github.com/sbr69
/// @notice Decentralised crowdfunding on Mantle. USDC/USDT only, event-based metadata,
///         fraud reporting with majority-vote refunds, early withdrawal with 100% donor approval.
contract DonationPlatform is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    //  Constants & Immutables
    // -------------------------------------------------------------------------

    uint40 public constant MIN_DURATION = 3 days;
    uint128 public constant MIN_DONATION = 1e6; // 1 token (6 decimals)
    uint40 public constant WITHDRAW_GRACE = 7 days;

    IERC20 public immutable USDC;
    IERC20 public immutable USDT;
    DonorBadge public immutable badge;

    // -------------------------------------------------------------------------
    //  Types
    // -------------------------------------------------------------------------

    enum Status {
        Active,
        Closed,
        Refunding,
        Expired
    }

    /// @dev Packed into 3 storage slots.
    struct Campaign {
        // slot 1
        address creator;
        uint40 deadline;
        Status status;
        bool earlyWithdrawRequested;
        // slot 2
        uint128 targetAmount;
        uint128 raisedAmount;
        // slot 3
        uint32 ratingSum;
        uint16 ratingCount;
        uint16 donorCount;
        uint16 fraudReportCount;
        uint16 earlyWithdrawApprovals;
        uint8 categoryId;
    }

    // -------------------------------------------------------------------------
    //  State
    // -------------------------------------------------------------------------

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint128)) public campaignTokenBalance;
    mapping(uint256 => mapping(address => mapping(address => uint128))) public donations;
    mapping(uint256 => mapping(address => bool)) public isDonor;
    mapping(uint256 => mapping(address => bool)) public hasRated;
    mapping(uint256 => mapping(address => bool)) public hasReported;
    mapping(uint256 => mapping(address => bool)) public hasApprovedEarlyWithdraw;

    // -------------------------------------------------------------------------
    //  Errors
    // -------------------------------------------------------------------------

    error InvalidTarget();
    error DeadlineTooSoon();
    error CampaignNotActive();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error InvalidToken();
    error BelowMinDonation();
    error SelfDonation();
    error NotDonor();
    error AlreadyRated();
    error InvalidRating();
    error NotCreator();
    error TargetNotMet();
    error FraudMajority();
    error NoFraudMajority();
    error AlreadyReported();
    error InvalidProof();
    error NotRefundable();
    error NothingToRefund();
    error EarlyWithdrawNotRequested();
    error AlreadyApprovedEarlyWithdraw();
    error UnanimousApprovalRequired();
    error WithdrawGraceExpired();
    error NothingToWithdraw();

    // -------------------------------------------------------------------------
    //  Events
    // -------------------------------------------------------------------------

    // metadata (title, description, proofCID) lives only in events to save gas
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint128 targetAmount,
        uint40 deadline,
        string proofCID,
        string title,
        string description,
        uint8 categoryId
    );

    event CampaignUpdate(uint256 indexed campaignId, string updateCID, string message);

    event DonationReceived(
        uint256 indexed campaignId, address indexed donor, address indexed token, uint128 amount
    );

    event CampaignFunded(uint256 indexed campaignId, uint128 totalRaised);

    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint128 usdcAmount, uint128 usdtAmount);

    event CampaignExpired(uint256 indexed campaignId);

    event RatingSubmitted(uint256 indexed campaignId, address indexed donor, uint8 rating);

    event FraudReported(uint256 indexed campaignId, address indexed reporter, string proofCID, string message);

    event CampaignFraudConfirmed(uint256 indexed campaignId, uint16 reportCount, uint16 donorCount);

    event RefundClaimed(
        uint256 indexed campaignId, address indexed donor, uint128 usdcAmount, uint128 usdtAmount
    );

    event EarlyWithdrawRequested(uint256 indexed campaignId, address indexed creator);

    event EarlyWithdrawApproved(uint256 indexed campaignId, address indexed donor, uint16 approvalCount);

    event EarlyWithdrawExecuted(uint256 indexed campaignId, uint128 usdcAmount, uint128 usdtAmount);

    // -------------------------------------------------------------------------
    //  Constructor
    // -------------------------------------------------------------------------

    constructor(address _usdc, address _usdt, address _badge, address _owner) Ownable(_owner) {
        USDC = IERC20(_usdc);
        USDT = IERC20(_usdt);
        badge = DonorBadge(_badge);
    }

    // -------------------------------------------------------------------------
    //  Campaign management
    // -------------------------------------------------------------------------

    function createCampaign(
        uint128 targetAmount,
        uint40 deadline,
        string calldata proofCID,
        string calldata title,
        string calldata description,
        uint8 categoryId
    ) external whenNotPaused {
        if (targetAmount == 0) revert InvalidTarget();
        if (deadline < uint40(block.timestamp) + MIN_DURATION) revert DeadlineTooSoon();

        uint256 id;
        unchecked {
            id = campaignCount++;
        }

        Campaign storage c = campaigns[id];
        c.creator = msg.sender;
        c.deadline = deadline;
        c.targetAmount = targetAmount;
        c.categoryId = categoryId;

        emit CampaignCreated(id, msg.sender, targetAmount, deadline, proofCID, title, description, categoryId);
    }

    /// @notice Post an update (event-only, no storage cost).
    function postUpdate(uint256 campaignId, string calldata updateCID, string calldata message) external {
        Campaign storage c = campaigns[campaignId];
        if (msg.sender != c.creator) revert NotCreator();
        if (c.status != Status.Active) revert CampaignNotActive();

        emit CampaignUpdate(campaignId, updateCID, message);
    }

    // -------------------------------------------------------------------------
    //  Donations
    // -------------------------------------------------------------------------

    function donate(uint256 campaignId, address token, uint128 amount) external nonReentrant whenNotPaused {
        if (amount < MIN_DONATION) revert BelowMinDonation();
        if (!_isAcceptedToken(token)) revert InvalidToken();

        Campaign storage c = campaigns[campaignId];
        if (c.status != Status.Active) revert CampaignNotActive();
        if (uint40(block.timestamp) >= c.deadline) revert DeadlinePassed();
        if (msg.sender == c.creator) revert SelfDonation();

        donations[campaignId][msg.sender][token] += amount;
        campaignTokenBalance[campaignId][token] += amount;

        uint128 newRaised;
        unchecked {
            newRaised = c.raisedAmount + amount;
        }
        c.raisedAmount = newRaised;

        bool isFirstDonation = !isDonor[campaignId][msg.sender];
        if (isFirstDonation) {
            isDonor[campaignId][msg.sender] = true;
            unchecked {
                c.donorCount++;
            }
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (isFirstDonation) {
            badge.mint(msg.sender, campaignId);
        }

        emit DonationReceived(campaignId, msg.sender, token, amount);

        if (newRaised >= c.targetAmount) {
            emit CampaignFunded(campaignId, newRaised);
        }
    }

    // -------------------------------------------------------------------------
    //  Rating
    // -------------------------------------------------------------------------

    /// @notice Rate a campaign 1-5. Only donors, once per donor.
    function rateCampaign(uint256 campaignId, uint8 rating) external {
        if (rating < 1 || rating > 5) revert InvalidRating();
        if (!isDonor[campaignId][msg.sender]) revert NotDonor();
        if (hasRated[campaignId][msg.sender]) revert AlreadyRated();

        hasRated[campaignId][msg.sender] = true;

        Campaign storage c = campaigns[campaignId];
        unchecked {
            c.ratingSum += rating;
            c.ratingCount++;
        }

        emit RatingSubmitted(campaignId, msg.sender, rating);
    }

    // -------------------------------------------------------------------------
    //  Fund withdrawal
    // -------------------------------------------------------------------------

    /// @notice Withdraw after deadline. Target must be met, no fraud majority, within grace.
    function withdrawFunds(uint256 campaignId) external nonReentrant {
        Campaign storage c = campaigns[campaignId];

        if (msg.sender != c.creator) revert NotCreator();
        if (c.status != Status.Active) revert CampaignNotActive();
        if (uint40(block.timestamp) < c.deadline) revert DeadlineNotPassed();
        if (uint40(block.timestamp) > c.deadline + WITHDRAW_GRACE) revert WithdrawGraceExpired();
        if (c.raisedAmount < c.targetAmount) revert TargetNotMet();
        if (c.donorCount > 0 && c.fraudReportCount > c.donorCount / 2) revert FraudMajority();

        c.status = Status.Closed;

        uint128 usdcBal = campaignTokenBalance[campaignId][address(USDC)];
        uint128 usdtBal = campaignTokenBalance[campaignId][address(USDT)];

        if (usdcBal == 0 && usdtBal == 0) revert NothingToWithdraw();

        campaignTokenBalance[campaignId][address(USDC)] = 0;
        campaignTokenBalance[campaignId][address(USDT)] = 0;

        if (usdcBal > 0) USDC.safeTransfer(c.creator, usdcBal);
        if (usdtBal > 0) USDT.safeTransfer(c.creator, usdtBal);

        emit FundsWithdrawn(campaignId, c.creator, usdcBal, usdtBal);
    }

    // -------------------------------------------------------------------------
    //  Early withdrawal (requires unanimous donor approval)
    // -------------------------------------------------------------------------

    function requestEarlyWithdraw(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        if (msg.sender != c.creator) revert NotCreator();
        if (c.status != Status.Active) revert CampaignNotActive();
        if (uint40(block.timestamp) >= c.deadline) revert DeadlinePassed();

        c.earlyWithdrawRequested = true;
        c.earlyWithdrawApprovals = 0;

        emit EarlyWithdrawRequested(campaignId, msg.sender);
    }

    function approveEarlyWithdraw(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        if (c.status != Status.Active) revert CampaignNotActive();
        if (!c.earlyWithdrawRequested) revert EarlyWithdrawNotRequested();
        if (!isDonor[campaignId][msg.sender]) revert NotDonor();
        if (hasApprovedEarlyWithdraw[campaignId][msg.sender]) revert AlreadyApprovedEarlyWithdraw();

        hasApprovedEarlyWithdraw[campaignId][msg.sender] = true;
        unchecked {
            c.earlyWithdrawApprovals++;
        }

        emit EarlyWithdrawApproved(campaignId, msg.sender, c.earlyWithdrawApprovals);
    }

    function executeEarlyWithdraw(uint256 campaignId) external nonReentrant {
        Campaign storage c = campaigns[campaignId];

        if (msg.sender != c.creator) revert NotCreator();
        if (c.status != Status.Active) revert CampaignNotActive();
        if (!c.earlyWithdrawRequested) revert EarlyWithdrawNotRequested();
        if (c.earlyWithdrawApprovals != c.donorCount) revert UnanimousApprovalRequired();

        c.status = Status.Closed;

        uint128 usdcBal = campaignTokenBalance[campaignId][address(USDC)];
        uint128 usdtBal = campaignTokenBalance[campaignId][address(USDT)];

        if (usdcBal == 0 && usdtBal == 0) revert NothingToWithdraw();

        campaignTokenBalance[campaignId][address(USDC)] = 0;
        campaignTokenBalance[campaignId][address(USDT)] = 0;

        if (usdcBal > 0) USDC.safeTransfer(c.creator, usdcBal);
        if (usdtBal > 0) USDT.safeTransfer(c.creator, usdtBal);

        emit EarlyWithdrawExecuted(campaignId, usdcBal, usdtBal);
    }

    // -------------------------------------------------------------------------
    //  Fraud reporting
    // -------------------------------------------------------------------------

    /// @notice Report fraud with proof. >50% donor reports triggers refunds.
    function reportFraud(uint256 campaignId, string calldata proofCID, string calldata message) external {
        if (bytes(proofCID).length == 0 && bytes(message).length == 0) revert InvalidProof();

        Campaign storage c = campaigns[campaignId];
        if (c.status != Status.Active) revert CampaignNotActive();
        if (uint40(block.timestamp) >= c.deadline) revert DeadlinePassed();
        if (!isDonor[campaignId][msg.sender]) revert NotDonor();
        if (hasReported[campaignId][msg.sender]) revert AlreadyReported();

        hasReported[campaignId][msg.sender] = true;
        unchecked {
            c.fraudReportCount++;
        }

        emit FraudReported(campaignId, msg.sender, proofCID, message);

        if (c.fraudReportCount > c.donorCount / 2) {
            c.status = Status.Refunding;
            emit CampaignFraudConfirmed(campaignId, c.fraudReportCount, c.donorCount);
        }
    }

    // -------------------------------------------------------------------------
    //  Expiry & Refunds
    // -------------------------------------------------------------------------

    /// @notice Mark a campaign as expired after deadline (target not met or creator abandoned).
    function expireCampaign(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        if (c.status != Status.Active) revert CampaignNotActive();
        if (uint40(block.timestamp) < c.deadline) revert DeadlineNotPassed();
        if (c.raisedAmount >= c.targetAmount) {
            if (uint40(block.timestamp) <= c.deadline + WITHDRAW_GRACE) {
                revert TargetNotMet(); // within grace, creator should withdraw
            }
        }

        c.status = Status.Expired;
        emit CampaignExpired(campaignId);
    }

    function claimRefund(uint256 campaignId) external nonReentrant {
        Campaign storage c = campaigns[campaignId];
        if (c.status != Status.Refunding && c.status != Status.Expired) revert NotRefundable();

        uint128 usdcOwed = donations[campaignId][msg.sender][address(USDC)];
        uint128 usdtOwed = donations[campaignId][msg.sender][address(USDT)];

        if (usdcOwed == 0 && usdtOwed == 0) revert NothingToRefund();

        donations[campaignId][msg.sender][address(USDC)] = 0;
        donations[campaignId][msg.sender][address(USDT)] = 0;

        if (usdcOwed > 0) USDC.safeTransfer(msg.sender, usdcOwed);
        if (usdtOwed > 0) USDT.safeTransfer(msg.sender, usdtOwed);

        emit RefundClaimed(campaignId, msg.sender, usdcOwed, usdtOwed);
    }

    // -------------------------------------------------------------------------
    //  Admin
    // -------------------------------------------------------------------------

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // -------------------------------------------------------------------------
    //  View helpers
    // -------------------------------------------------------------------------

    function getCampaign(uint256 campaignId)
        external
        view
        returns (
            address creator,
            uint40 deadline,
            Status status,
            bool earlyWithdrawRequested,
            uint128 targetAmount,
            uint128 raisedAmount,
            uint32 ratingSum,
            uint16 ratingCount,
            uint16 donorCount,
            uint16 fraudReportCount,
            uint16 earlyWithdrawApprovals,
            uint8 categoryId
        )
    {
        Campaign storage c = campaigns[campaignId];
        return (
            c.creator,
            c.deadline,
            c.status,
            c.earlyWithdrawRequested,
            c.targetAmount,
            c.raisedAmount,
            c.ratingSum,
            c.ratingCount,
            c.donorCount,
            c.fraudReportCount,
            c.earlyWithdrawApprovals,
            c.categoryId
        );
    }

    function getDonation(uint256 campaignId, address donor, address token) external view returns (uint128) {
        return donations[campaignId][donor][token];
    }

    // -------------------------------------------------------------------------
    //  Internal
    // -------------------------------------------------------------------------

    function _isAcceptedToken(address token) internal view returns (bool) {
        return token == address(USDC) || token == address(USDT);
    }
}
