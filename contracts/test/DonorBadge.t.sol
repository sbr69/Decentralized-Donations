// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { DonorBadge } from "../src/tokens/DonorBadge.sol";

contract DonorBadgeTest is Test {
    DonorBadge public badge;
    address public owner = makeAddr("owner");
    address public minter = makeAddr("minter");
    address public user = makeAddr("user");

    function setUp() public {
        badge = new DonorBadge("https://api.example.com/badges/", owner);
        vm.prank(owner);
        badge.setMinter(minter);
    }

    function test_mint() public {
        vm.prank(minter);
        badge.mint(user, 0);
        assertEq(badge.balanceOf(user, 0), 1);
    }

    function test_mint_multipleCampaigns() public {
        vm.startPrank(minter);
        badge.mint(user, 0);
        badge.mint(user, 1);
        badge.mint(user, 42);
        vm.stopPrank();

        assertEq(badge.balanceOf(user, 0), 1);
        assertEq(badge.balanceOf(user, 1), 1);
        assertEq(badge.balanceOf(user, 42), 1);
    }

    function test_revert_mint_notMinter() public {
        vm.prank(user);
        vm.expectRevert(DonorBadge.NotMinter.selector);
        badge.mint(user, 0);
    }

    function test_setMinter_onlyOwner() public {
        address newMinter = makeAddr("newMinter");
        vm.prank(owner);
        badge.setMinter(newMinter);
        assertEq(badge.minter(), newMinter);
    }

    function test_revert_setMinter_notOwner() public {
        vm.prank(user);
        vm.expectRevert();
        badge.setMinter(user);
    }

    function test_setURI() public {
        vm.prank(owner);
        badge.setURI("https://new-api.example.com/badges/");
    }

    function test_uri_returnsBaseURI() public view {
        assertEq(badge.uri(0), "https://api.example.com/badges/");
    }
}
