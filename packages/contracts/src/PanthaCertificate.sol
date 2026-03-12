// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract PanthaCertificate is ERC721URIStorage {
    uint256 public nextTokenId;
    address public authority;

    constructor() ERC721("Pantha Certificate", "PNTHCERT") {
        authority = msg.sender;
    }

    modifier onlyAuthority() {
        require(msg.sender == authority, "Not authorized");
        _;
    }

    function mint(address to, string memory metadataURI) public onlyAuthority {
        uint256 tokenId = nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
    }
}
