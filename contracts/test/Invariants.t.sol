// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { TestSetup } from "./helpers/TestSetup.sol";
import { DonationPlatform } from "../src/core/DonationPlatform.sol";

contract InvariantsTest is TestSetup {
    uint256 internal campaignId;

    function setUp() public override {
        super.setUp();
        campaignId = _createCampaign();
    }

    function test_invariant_donorCountGteFraudReports() public {
        _donateUSDC(donor1, campaignId, SMALL_DONATION);
        _donateUSDC(donor2, campaignId, SMALL_DONATION);
        _donateUSDC(donor3, campaignId, SMALL_DONATION);

        vm.prank(donor1);
        platform.reportFraud(campaignId, "proof", "");
        vm.prank(donor2);
        platform.reportFraud(campaignId, "proof", "");

        (, , , , , , , , uint16 donorCount, uint16 fraudReportCount, , ) = platform.getCampaign(campaignId);
        assertTrue(donorCount >= fraudReportCount);
    }

    function test_invariant_raisedEqualsSumOfTokenBalances() public {
        _donateUSDC(donor1, campaignId, 300e6);
        _donateUSDT(donor2, campaignId, 200e6);
        _donateUSDC(donor3, campaignId, 100e6);

        (, , , , , uint128 raised, , , , , , ) = platform.getCampaign(campaignId);

        uint128 usdcBal = platform.campaignTokenBalance(campaignId, address(usdc));
        uint128 usdtBal = platform.campaignTokenBalance(campaignId, address(usdt));

        assertEq(raised, usdcBal + usdtBal);
    }

    function test_invariant_refundZerosBalance() public {
        _donateUSDC(donor1, campaignId, 100e6);
        _donateUSDT(donor1, campaignId, 50e6);

        vm.warp(block.timestamp + DURATION + 1);
        platform.expireCampaign(campaignId);

        vm.prank(donor1);
        platform.claimRefund(campaignId);

        assertEq(platform.getDonation(campaignId, donor1, address(usdc)), 0);
        assertEq(platform.getDonation(campaignId, donor1, address(usdt)), 0);
    }

    function test_invariant_closedCampaignHasZeroBalance() public {
        _donateUSDC(donor1, campaignId, TARGET);

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(creator);
        platform.withdrawFunds(campaignId);

        assertEq(platform.campaignTokenBalance(campaignId, address(usdc)), 0);
        assertEq(platform.campaignTokenBalance(campaignId, address(usdt)), 0);
    }
}
