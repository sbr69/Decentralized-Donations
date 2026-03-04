// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console } from "forge-std/Script.sol";
import { MockUSDC } from "../src/mocks/MockUSDC.sol";
import { MockUSDT } from "../src/mocks/MockUSDT.sol";

contract DeployMocks is Script {
    function run() external {
        vm.startBroadcast();

        MockUSDC usdc = new MockUSDC();
        MockUSDT usdt = new MockUSDT();

        console.log("MockUSDC:", address(usdc));
        console.log("MockUSDT:", address(usdt));

        vm.stopBroadcast();
    }
}
