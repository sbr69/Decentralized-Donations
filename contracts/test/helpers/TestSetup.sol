// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";

import { DonationPlatform } from "../../src/core/DonationPlatform.sol";
import { DonorBadge } from "../../src/tokens/DonorBadge.sol";
import { MockUSDC } from "../../src/mocks/MockUSDC.sol";
import { MockUSDT } from "../../src/mocks/MockUSDT.sol";

abstract contract TestSetup is Test {
    DonationPlatform public platform;
    DonorBadge public badge;
    MockUSDC public usdc;
    MockUSDT public usdt;

    address public owner = makeAddr("owner");
    address public creator = makeAddr("creator");
    address public donor1 = makeAddr("donor1");
    address public donor2 = makeAddr("donor2");
    address public donor3 = makeAddr("donor3");
    address public stranger = makeAddr("stranger");

    uint128 public constant TARGET = 1000e6;
    uint128 public constant DONATION_AMOUNT = 500e6;
    uint128 public constant SMALL_DONATION = 1e6;
    uint40 public constant DURATION = 7 days;

    function setUp() public virtual {
        usdc = new MockUSDC();
        usdt = new MockUSDT();
        badge = new DonorBadge("https://api.example.com/badges/", owner);
        platform = new DonationPlatform(address(usdc), address(usdt), address(badge), owner);

        vm.prank(owner);
        badge.setMinter(address(platform));

        // fund donors
        usdc.mint(donor1, 100_000e6);
        usdc.mint(donor2, 100_000e6);
        usdc.mint(donor3, 100_000e6);
        usdt.mint(donor1, 100_000e6);
        usdt.mint(donor2, 100_000e6);
        usdt.mint(donor3, 100_000e6);

        // approvals
        vm.startPrank(donor1);
        usdc.approve(address(platform), type(uint256).max);
        usdt.approve(address(platform), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(donor2);
        usdc.approve(address(platform), type(uint256).max);
        usdt.approve(address(platform), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(donor3);
        usdc.approve(address(platform), type(uint256).max);
        usdt.approve(address(platform), type(uint256).max);
        vm.stopPrank();
    }

    function _createCampaign() internal returns (uint256) {
        return _createCampaignWithTarget(TARGET);
    }

    function _createCampaignWithTarget(uint128 target) internal returns (uint256) {
        uint40 deadline = uint40(block.timestamp) + DURATION;
        vm.prank(creator);
        platform.createCampaign(target, deadline, "QmTestProofCID", "Test Campaign", "A test campaign", 0);
        return platform.campaignCount() - 1;
    }

    function _donateUSDC(address donor, uint256 campaignId, uint128 amount) internal {
        vm.prank(donor);
        platform.donate(campaignId, address(usdc), amount);
    }

    function _donateUSDT(address donor, uint256 campaignId, uint128 amount) internal {
        vm.prank(donor);
        platform.donate(campaignId, address(usdt), amount);
    }
}
