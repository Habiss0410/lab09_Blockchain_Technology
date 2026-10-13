import { createPublicClient, http, formatUnits } from "viem";
import { trustkeys } from "./trustkeys.js";
import { erc20Abi, badgeAbi } from "./abis.js";

// Chỉ cần RPC: không khóa, không gas.
const client = createPublicClient({ chain: trustkeys, transport: http() });

const chainId = await client.getChainId();
const block = await client.getBlock();
const gasPrice = await client.getGasPrice();
const extraBytes = (block.extraData.length - 2) / 2;

console.log("== Network ==");
console.log("chainId:", chainId);
console.log("latest block:", block.number);
console.log("gasPrice (wei):", gasPrice);
console.log("extraData bytes:", extraBytes);

const { TOKEN, ACCOUNT, BADGE, TOKEN_ID = "0" } = process.env;

if (TOKEN) {
  const read = (functionName, args) =>
    client.readContract({ address: TOKEN, abi: erc20Abi, functionName, args });
  const [name, symbol, decimals] = await Promise.all([
    read("name"), read("symbol"), read("decimals"),
  ]);
  console.log("\n== Token ==");
  console.log("name/symbol/decimals:", name, symbol, decimals);
  if (ACCOUNT) {
    const bal = await read("balanceOf", [ACCOUNT]);
    console.log(`balanceOf(${ACCOUNT}):`, formatUnits(bal, decimals), symbol);
  }
}

if (BADGE) {
  const uri = await client.readContract({
    address: BADGE, abi: badgeAbi, functionName: "tokenURI", args: [BigInt(TOKEN_ID)],
  });
  const meta = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString("utf8"));
  const svg = Buffer.from(meta.image.split(",")[1], "base64").toString("utf8");
  console.log("\n== Badge tokenURI ==");
  console.log(JSON.stringify({ ...meta, image: meta.image.slice(0, 40) + "..." }, null, 2));
  console.log("\n== Decoded SVG ==");
  console.log(svg);
}
