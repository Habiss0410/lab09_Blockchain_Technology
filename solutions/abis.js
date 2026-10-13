import { parseAbi } from "viem";

export const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const badgeAbi = parseAbi([
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function mint(address to, string studentName) returns (uint256)",
]);
