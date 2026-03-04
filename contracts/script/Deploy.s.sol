// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console } from "forge-std/Script.sol";
import { DonationPlatform } from "../src/core/DonationPlatform.sol";
import { DonorBadge } from "../src/tokens/DonorBadge.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address usdc = vm.envAddress("USDC_ADDRESS");
        address usdt = vm.envAddress("USDT_ADDRESS");
        string memory baseURI = vm.envOr("BASE_URI", string("https://api.example.com/badges/"));

        console.log("Deployer:", deployer);
        console.log("USDC:", usdc);
        console.log("USDT:", usdt);

        vm.startBroadcast(deployerKey);

        DonorBadge badge = new DonorBadge(baseURI, deployer);
        console.log("DonorBadge:", address(badge));

        DonationPlatform platform = new DonationPlatform(usdc, usdt, address(badge), deployer);
        console.log("DonationPlatform:", address(platform));

        badge.setMinter(address(platform));

        vm.stopBroadcast();
    }
}
