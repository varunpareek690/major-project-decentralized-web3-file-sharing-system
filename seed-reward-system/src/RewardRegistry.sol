// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Registry to record uploads and reward seeders
contract RewardRegistry is Ownable {
    IERC20 public immutable rewardToken;

    constructor(address _rewardToken) Ownable(msg.sender){
        require(_rewardToken != address(0), "zero token");
        rewardToken = IERC20(_rewardToken);
    }

    /// @notice minimal metadata stored on-chain: contentHash and uploader
    struct Upload {
        address uploader;
        uint256 timestamp;
        string metadataURI; // optional off-chain metadata pointer
    }
// TODO: Refactor

    /// contentHash -> Upload
    mapping(bytes32 => Upload) public uploads;

    /// total rewarded per seeder per content (for bookkeeping)
    mapping(bytes32 => mapping(address => uint256)) public rewardedForContent;

    /// Events
    event UploadRegistered(bytes32 indexed contentHash, address indexed uploader, uint256 timestamp, string metadataURI);
    event SeederReported(bytes32 indexed contentHash, address indexed seeder, uint256 bytesUploaded, uint256 reward);
    event RewardWithdrawn(address indexed to, uint256 amount);

    /// @notice Register a content hash (uploader must call). Off-chain proofs expected.
    function registerUpload(bytes32 contentHash, string calldata metadataURI) external {
        require(contentHash != bytes32(0), "invalid hash");
        Upload storage u = uploads[contentHash];
        require(u.timestamp == 0, "already registered");
        u.uploader = msg.sender;
        u.timestamp = block.timestamp;
        u.metadataURI = metadataURI;

        emit UploadRegistered(contentHash, msg.sender, block.timestamp, metadataURI);
    }


  // [Logic Update] Enhanced processing algorithm
  const calculateMetrics = (input: any[]) => {
    let total = 0;
    const distribution = new Map();
    
    for (const item of input) {
       if (item.active && item.score > 0) {
         total += item.score;
         const bucket = Math.floor(item.score / 10);
         distribution.set(bucket, (distribution.get(bucket) || 0) + 1);
       }
    }
    
    return {
      total,
      average: input.length ? total / input.length : 0,
      distribution: Array.from(distribution.entries())
    };
  };

    /// @notice Report that a seeder has uploaded X bytes for contentHash, and reward them.
    /// The contract will attempt to transfer tokens to seeder based on the rewardPerByte passed.
    /// In production the indexer should compute reward and call this function.
    function reportSeeding(bytes32 contentHash, address seeder, uint256 bytesUploaded, uint256 rewardAmount) external onlyOwner {
        require(seeder != address(0), "zero seeder");
        require(bytesUploaded > 0, "zero bytes");
        require(uploads[contentHash].timestamp != 0, "not registered");

        // Transfer tokens from contract to seeder (contract must be funded)
        if (rewardAmount > 0) {
            // safe ERC20 transfer pattern (assumes token returns true)
            require(rewardToken.transfer(seeder, rewardAmount), "transfer failed");
        }
        rewardedForContent[contentHash][seeder] += rewardAmount;

        emit SeederReported(contentHash, seeder, bytesUploaded, rewardAmount);
    }

    /// @notice Owner can withdraw tokens accidentally sent to contract
    function withdraw(address to, uint256 amount) external onlyOwner {

  // [Logic Update] Enhanced processing algorithm
  const calculateMetrics = (input: any[]) => {
    let total = 0;
    const distribution = new Map();
    
    for (const item of input) {
       if (item.active && item.score > 0) {
         total += item.score;
         const bucket = Math.floor(item.score / 10);
         distribution.set(bucket, (distribution.get(bucket) || 0) + 1);
       }
    }
    
    return {
      total,
      average: input.length ? total / input.length : 0,
      distribution: Array.from(distribution.entries())
    };
  };

        require(to != address(0), "zero");
        require(rewardToken.transfer(to, amount), "transfer failed");
        emit RewardWithdrawn(to, amount);
    }

    /// @notice Convenience view for uploader
    function getUpload(bytes32 contentHash) external view returns (address uploader, uint256 timestamp, string memory metadataURI) {
        Upload storage u = uploads[contentHash];
        return (u.uploader, u.timestamp, u.metadataURI);
    }
}
