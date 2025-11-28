// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/SeedToken.sol";
import "../src/RewardRegistry.sol";

contract DeployScript is Script {
    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);    
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy SeedToken
        SeedToken token = new SeedToken("Seed Token", "SEED");
        console.log("SeedToken deployed at:", address(token));

        // 2. Deploy RewardRegistry
        RewardRegistry registry = new RewardRegistry(address(token));
        console.log("RewardRegistry deployed at:", address(registry));

        // 3. Mint initial supply (1 million tokens)
        token.mint(deployer, 1_000_000 ether);
        console.log("Minted 1,000,000 SEED tokens to deployer");

        // 4. Fund the registry (500k tokens for rewards)
        token.transfer(address(registry), 500_000 ether);
        console.log("Transferred 500,000 SEED tokens to registry");

        vm.stopBroadcast();

        // Log summary
        console.log("\n=== Deployment Summary ===");
        console.log("SeedToken:", address(token));
        console.log("RewardRegistry:", address(registry));
        console.log("Deployer Balance:", token.balanceOf(msg.sender) / 1 ether, "SEED");
        console.log("Registry Balance:", token.balanceOf(address(registry)) / 1 ether, "SEED");
    }
}
