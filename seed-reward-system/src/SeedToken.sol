// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Simple ERC20 token to reward seeders
contract SeedToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_) 
        ERC20(name_, symbol_) 
        Ownable(msg.sender)
    {}

    /// @notice mint tokens to an address (owner only)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice burn tokens (optional)
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}