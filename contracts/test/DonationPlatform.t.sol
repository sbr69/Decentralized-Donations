// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { TestSetup } from "./helpers/TestSetup.sol";
import { DonationPlatform } from "../src/core/DonationPlatform.sol";

contract DonationPlatformTest is TestSetup {

    // --- Campaign creation ---

    function test_createCampaign() public {
        uint256 id = _createCampaign();

        (
            address _creator,
            uint40 _deadline,
            DonationPlatform.Status _status,
            ,
            uint128 _targetAmount,
            uint128 _raisedAmount,
            ,
            ,
            uint16 _donorCount,
            ,
            ,
            uint8 _categoryId
        ) = platform.getCampaign(id);

        assertEq(_creator, creator);
        assertEq(_deadline, uint40(block.timestamp) + DURATION);
        assertEq(uint8(_status), uint8(DonationPlatform.Status.Active));
        assertEq(_targetAmount, TARGET);
        assertEq(_raisedAmount, 0);
        assertEq(_donorCount, 0);
        assertEq(_categoryId, 0);
    }

    function test_createCampaign_incrementsCount() public {
        assertEq(platform.campaignCount(), 0);
        _createCampaign();
        assertEq(platform.campaignCount(), 1);
        _createCampaign();
        assertEq(platform.campaignCount(), 2);
    }

    function test_revert_createCampaign_zeroTarget() public {
        vm.prank(creator);
        vm.expectRevert(DonationPlatform.InvalidTarget.selector);
        platform.createCampaign(0, uint40(block.timestamp) + DURATION, "cid", "t", "d", 0);
    }

    function test_revert_createCampaign_deadlineTooSoon() public {
        vm.prank(creator);
        vm.expectRevert(DonationPlatform.DeadlineTooSoon.selector);
        platform.createCampaign(TARGET, uint40(block.timestamp) + 1 days, "cid", "t", "d", 0);
    }

    // --- Donations ---

    function test_donate_USDC() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, DONATION_AMOUNT);

        (, , , , , uint128 raised, , , uint16 donorCount, , , ) = platform.getCampaign(id);
        assertEq(raised, DONATION_AMOUNT);
        assertEq(donorCount, 1);
        assertEq(platform.getDonation(id, donor1, address(usdc)), DONATION_AMOUNT);
    }

    function test_donate_USDT() public {
        uint256 id = _createCampaign();
        _donateUSDT(donor1, id, DONATION_AMOUNT);

        (, , , , , uint128 raised, , , uint16 donorCount, , , ) = platform.getCampaign(id);
        assertEq(raised, DONATION_AMOUNT);
        assertEq(donorCount, 1);
        assertEq(platform.getDonation(id, donor1, address(usdt)), DONATION_AMOUNT);
    }

    function test_donate_multipleDonors() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, DONATION_AMOUNT);
        _donateUSDT(donor2, id, DONATION_AMOUNT);

        (, , , , , uint128 raised, , , uint16 donorCount, , , ) = platform.getCampaign(id);
        assertEq(raised, DONATION_AMOUNT * 2);
        assertEq(donorCount, 2);
    }

    function test_donate_sameDonorTwice_donorCountStaysOne() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);
        _donateUSDT(donor1, id, SMALL_DONATION);

        (, , , , , , , , uint16 donorCount, , , ) = platform.getCampaign(id);
        assertEq(donorCount, 1);
    }

    function test_donate_mintsBadgeOnFirstDonation() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);
        assertEq(badge.balanceOf(donor1, id), 1);
    }

    function test_donate_noBadgeOnSecondDonation() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);
        _donateUSDC(donor1, id, SMALL_DONATION);
        assertEq(badge.balanceOf(donor1, id), 1);
    }

    function test_revert_donate_afterDeadline() public {
        uint256 id = _createCampaign();
        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.DeadlinePassed.selector);
        platform.donate(id, address(usdc), DONATION_AMOUNT);
    }

    function test_revert_donate_invalidToken() public {
        uint256 id = _createCampaign();
        address fakeToken = makeAddr("fakeToken");
        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.InvalidToken.selector);
        platform.donate(id, fakeToken, DONATION_AMOUNT);
    }

    function test_revert_donate_belowMinimum() public {
        uint256 id = _createCampaign();
        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.BelowMinDonation.selector);
        platform.donate(id, address(usdc), 100);
    }

    function test_revert_donate_selfDonation() public {
        uint256 id = _createCampaign();
        usdc.mint(creator, 1000e6);
        vm.startPrank(creator);
        usdc.approve(address(platform), type(uint256).max);
        vm.expectRevert(DonationPlatform.SelfDonation.selector);
        platform.donate(id, address(usdc), DONATION_AMOUNT);
        vm.stopPrank();
    }

    // --- Rating ---

    function test_rateCampaign() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.prank(donor1);
        platform.rateCampaign(id, 5);

        (, , , , , , uint32 ratingSum, uint16 ratingCount, , , , ) = platform.getCampaign(id);
        assertEq(ratingSum, 5);
        assertEq(ratingCount, 1);
    }

    function test_revert_rateCampaign_notDonor() public {
        uint256 id = _createCampaign();
        vm.prank(stranger);
        vm.expectRevert(DonationPlatform.NotDonor.selector);
        platform.rateCampaign(id, 3);
    }

    function test_revert_rateCampaign_alreadyRated() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.prank(donor1);
        platform.rateCampaign(id, 4);

        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.AlreadyRated.selector);
        platform.rateCampaign(id, 3);
    }

    function test_revert_rateCampaign_invalidRating_zero() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.InvalidRating.selector);
        platform.rateCampaign(id, 0);
    }

    function test_revert_rateCampaign_invalidRating_six() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.InvalidRating.selector);
        platform.rateCampaign(id, 6);
    }

    // --- Fund withdrawal ---

    function test_withdrawFunds_afterDeadline_targetMet() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, TARGET);

        vm.warp(block.timestamp + DURATION + 1);

        uint256 creatorBalBefore = usdc.balanceOf(creator);
        vm.prank(creator);
        platform.withdrawFunds(id);

        assertEq(usdc.balanceOf(creator), creatorBalBefore + TARGET);

        (, , DonationPlatform.Status status, , , , , , , , , ) = platform.getCampaign(id);
        assertEq(uint8(status), uint8(DonationPlatform.Status.Closed));
    }

    function test_withdrawFunds_multiToken() public {
        uint256 id = _createCampaignWithTarget(1000e6);
        _donateUSDC(donor1, id, 600e6);
        _donateUSDT(donor2, id, 400e6);

        vm.warp(block.timestamp + DURATION + 1);

        uint256 creatorUSDC = usdc.balanceOf(creator);
        uint256 creatorUSDT = usdt.balanceOf(creator);

        vm.prank(creator);
        platform.withdrawFunds(id);

        assertEq(usdc.balanceOf(creator), creatorUSDC + 600e6);
        assertEq(usdt.balanceOf(creator), creatorUSDT + 400e6);
    }

    function test_revert_withdrawFunds_beforeDeadline() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, TARGET);

        vm.prank(creator);
        vm.expectRevert(DonationPlatform.DeadlineNotPassed.selector);
        platform.withdrawFunds(id);
    }

    function test_revert_withdrawFunds_targetNotMet() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(creator);
        vm.expectRevert(DonationPlatform.TargetNotMet.selector);
        platform.withdrawFunds(id);
    }

    function test_revert_withdrawFunds_notCreator() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, TARGET);

        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(stranger);
        vm.expectRevert(DonationPlatform.NotCreator.selector);
        platform.withdrawFunds(id);
    }

    function test_revert_withdrawFunds_graceExpired() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, TARGET);

        vm.warp(block.timestamp + DURATION + 7 days + 1);
        vm.prank(creator);
        vm.expectRevert(DonationPlatform.WithdrawGraceExpired.selector);
        platform.withdrawFunds(id);
    }

    // --- Early withdrawal ---

    function test_earlyWithdraw_fullFlow() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, 300e6);
        _donateUSDT(donor2, id, 200e6);

        vm.prank(creator);
        platform.requestEarlyWithdraw(id);

        vm.prank(donor1);
        platform.approveEarlyWithdraw(id);
        vm.prank(donor2);
        platform.approveEarlyWithdraw(id);

        uint256 creatorUSDC = usdc.balanceOf(creator);
        uint256 creatorUSDT = usdt.balanceOf(creator);

        vm.prank(creator);
        platform.executeEarlyWithdraw(id);

        assertEq(usdc.balanceOf(creator), creatorUSDC + 300e6);
        assertEq(usdt.balanceOf(creator), creatorUSDT + 200e6);

        (, , DonationPlatform.Status status, , , , , , , , , ) = platform.getCampaign(id);
        assertEq(uint8(status), uint8(DonationPlatform.Status.Closed));
    }

    function test_revert_earlyWithdraw_notAllApproved() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, 300e6);
        _donateUSDC(donor2, id, 200e6);

        vm.prank(creator);
        platform.requestEarlyWithdraw(id);

        vm.prank(donor1);
        platform.approveEarlyWithdraw(id);

        vm.prank(creator);
        vm.expectRevert(DonationPlatform.UnanimousApprovalRequired.selector);
        platform.executeEarlyWithdraw(id);
    }

    function test_revert_earlyWithdraw_notRequested() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, 300e6);

        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.EarlyWithdrawNotRequested.selector);
        platform.approveEarlyWithdraw(id);
    }

    function test_revert_requestEarlyWithdraw_afterDeadline() public {
        uint256 id = _createCampaign();
        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(creator);
        vm.expectRevert(DonationPlatform.DeadlinePassed.selector);
        platform.requestEarlyWithdraw(id);
    }

    // --- Fraud reporting ---

    function test_reportFraud_withProofCID() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, DONATION_AMOUNT);

        vm.prank(donor1);
        platform.reportFraud(id, "QmFraudProofCID", "");

        (, , , , , , , , , uint16 fraudCount, , ) = platform.getCampaign(id);
        assertEq(fraudCount, 1);
    }

    function test_reportFraud_withMessage() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, DONATION_AMOUNT);

        vm.prank(donor1);
        platform.reportFraud(id, "", "This campaign is a scam because...");

        (, , , , , , , , , uint16 fraudCount, , ) = platform.getCampaign(id);
        assertEq(fraudCount, 1);
    }

    function test_reportFraud_triggersRefunding_majority() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);
        _donateUSDC(donor2, id, SMALL_DONATION);
        _donateUSDC(donor3, id, SMALL_DONATION);

        vm.prank(donor1);
        platform.reportFraud(id, "QmProof1", "");

        (, , DonationPlatform.Status statusAfter1, , , , , , , , , ) = platform.getCampaign(id);
        assertEq(uint8(statusAfter1), uint8(DonationPlatform.Status.Active));

        vm.prank(donor2);
        platform.reportFraud(id, "QmProof2", "");

        (, , DonationPlatform.Status statusAfter2, , , , , , , , , ) = platform.getCampaign(id);
        assertEq(uint8(statusAfter2), uint8(DonationPlatform.Status.Refunding));
    }

    function test_reportFraud_exactly50Percent_noTrigger() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);
        _donateUSDC(donor2, id, SMALL_DONATION);

        vm.prank(donor1);
        platform.reportFraud(id, "QmProof", "");

        (, , DonationPlatform.Status status, , , , , , , , , ) = platform.getCampaign(id);
        assertEq(uint8(status), uint8(DonationPlatform.Status.Active));
    }

    function test_revert_reportFraud_emptyProof() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.InvalidProof.selector);
        platform.reportFraud(id, "", "");
    }

    function test_revert_reportFraud_afterDeadline() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.DeadlinePassed.selector);
        platform.reportFraud(id, "QmProof", "");
    }

    function test_revert_reportFraud_notDonor() public {
        uint256 id = _createCampaign();

        vm.prank(stranger);
        vm.expectRevert(DonationPlatform.NotDonor.selector);
        platform.reportFraud(id, "QmProof", "fraud");
    }

    function test_revert_reportFraud_alreadyReported() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);
        _donateUSDC(donor2, id, SMALL_DONATION);
        _donateUSDC(donor3, id, SMALL_DONATION);

        vm.prank(donor1);
        platform.reportFraud(id, "QmProof", "");

        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.AlreadyReported.selector);
        platform.reportFraud(id, "QmProof2", "");
    }

    // --- Refunds ---

    function test_claimRefund_afterFraud() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, 400e6);
        _donateUSDT(donor2, id, 300e6);

        vm.prank(donor1);
        platform.reportFraud(id, "QmProof1", "");
        vm.prank(donor2);
        platform.reportFraud(id, "", "scam");

        uint256 donor1USDCBefore = usdc.balanceOf(donor1);
        vm.prank(donor1);
        platform.claimRefund(id);
        assertEq(usdc.balanceOf(donor1), donor1USDCBefore + 400e6);

        uint256 donor2USDTBefore = usdt.balanceOf(donor2);
        vm.prank(donor2);
        platform.claimRefund(id);
        assertEq(usdt.balanceOf(donor2), donor2USDTBefore + 300e6);
    }

    function test_claimRefund_afterExpiry() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.warp(block.timestamp + DURATION + 1);
        platform.expireCampaign(id);

        uint256 donor1Before = usdc.balanceOf(donor1);
        vm.prank(donor1);
        platform.claimRefund(id);
        assertEq(usdc.balanceOf(donor1), donor1Before + SMALL_DONATION);
    }

    function test_revert_claimRefund_doubleRefund() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.warp(block.timestamp + DURATION + 1);
        platform.expireCampaign(id);

        vm.prank(donor1);
        platform.claimRefund(id);

        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.NothingToRefund.selector);
        platform.claimRefund(id);
    }

    function test_revert_claimRefund_notRefundable() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.prank(donor1);
        vm.expectRevert(DonationPlatform.NotRefundable.selector);
        platform.claimRefund(id);
    }

    // --- Expire campaign ---

    function test_expireCampaign_targetNotMet() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.warp(block.timestamp + DURATION + 1);
        platform.expireCampaign(id);

        (, , DonationPlatform.Status status, , , , , , , , , ) = platform.getCampaign(id);
        assertEq(uint8(status), uint8(DonationPlatform.Status.Expired));
    }

    function test_expireCampaign_targetMet_graceExpired() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, TARGET);

        vm.warp(block.timestamp + DURATION + 7 days + 1);
        platform.expireCampaign(id);

        (, , DonationPlatform.Status status, , , , , , , , , ) = platform.getCampaign(id);
        assertEq(uint8(status), uint8(DonationPlatform.Status.Expired));
    }

    function test_revert_expireCampaign_beforeDeadline() public {
        uint256 id = _createCampaign();
        vm.expectRevert(DonationPlatform.DeadlineNotPassed.selector);
        platform.expireCampaign(id);
    }

    function test_revert_expireCampaign_targetMet_withinGrace() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, TARGET);

        vm.warp(block.timestamp + DURATION + 1);
        vm.expectRevert(DonationPlatform.TargetNotMet.selector);
        platform.expireCampaign(id);
    }

    // --- Fraud + withdrawal interaction ---

    function test_revert_withdrawFunds_afterFraudMajority() public {
        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, 500e6);
        _donateUSDC(donor2, id, 500e6);

        vm.prank(donor1);
        platform.reportFraud(id, "proof1", "");
        vm.prank(donor2);
        platform.reportFraud(id, "proof2", "");

        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(creator);
        vm.expectRevert(DonationPlatform.CampaignNotActive.selector);
        platform.withdrawFunds(id);
    }

    // --- Campaign updates ---

    function test_postUpdate() public {
        uint256 id = _createCampaign();
        vm.prank(creator);
        platform.postUpdate(id, "QmUpdateCID", "Progress update");
    }

    function test_revert_postUpdate_notCreator() public {
        uint256 id = _createCampaign();
        vm.prank(stranger);
        vm.expectRevert(DonationPlatform.NotCreator.selector);
        platform.postUpdate(id, "QmUpdateCID", "fake update");
    }

    // --- Admin ---

    function test_pause_unpause() public {
        vm.prank(owner);
        platform.pause();

        vm.prank(creator);
        vm.expectRevert();
        platform.createCampaign(TARGET, uint40(block.timestamp) + DURATION, "cid", "t", "d", 0);

        vm.prank(owner);
        platform.unpause();

        _createCampaign();
    }

    // --- Fuzz ---

    function testFuzz_donate_validAmount(uint128 amount) public {
        amount = uint128(bound(amount, 1e6, 50_000e6));

        uint256 id = _createCampaignWithTarget(100_000e6);

        usdc.mint(donor1, amount);
        vm.startPrank(donor1);
        usdc.approve(address(platform), amount);
        vm.stopPrank();

        _donateUSDC(donor1, id, amount);

        assertEq(platform.getDonation(id, donor1, address(usdc)), amount);
    }

    function testFuzz_createCampaign_validDeadline(uint40 offset) public {
        offset = uint40(bound(offset, 3 days, 365 days));
        uint40 deadline = uint40(block.timestamp) + offset;

        vm.prank(creator);
        platform.createCampaign(TARGET, deadline, "cid", "t", "d", 0);

        (, uint40 _deadline, , , , , , , , , , ) = platform.getCampaign(0);
        assertEq(_deadline, deadline);
    }

    function testFuzz_rating_validRange(uint8 rating) public {
        rating = uint8(bound(rating, 1, 5));

        uint256 id = _createCampaign();
        _donateUSDC(donor1, id, SMALL_DONATION);

        vm.prank(donor1);
        platform.rateCampaign(id, rating);

        (, , , , , , uint32 ratingSum, , , , , ) = platform.getCampaign(id);
        assertEq(ratingSum, rating);
    }
}
