// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract DonorBadge is ERC1155, Ownable {
    error NotMinter();

    address public minter;

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    constructor(string memory baseURI, address _owner) ERC1155(baseURI) Ownable(_owner) {}

    function setMinter(address _minter) external onlyOwner {
        emit MinterUpdated(minter, _minter);
        minter = _minter;
    }

    function setURI(string memory newURI) external onlyOwner {
        _setURI(newURI);
    }

    function mint(address to, uint256 tokenId) external {
        if (msg.sender != minter) revert NotMinter();
        _mint(to, tokenId, 1, "");
    }
}
