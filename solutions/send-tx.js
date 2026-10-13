import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { trustkeys } from "./trustkeys.js";
import { badgeAbi } from "./abis.js";

// Bonus 9.5: mint ClassBadge (chỉ owner). Dùng khóa của tài khoản THỬ.
const { PRIVATE_KEY, BADGE, TO, STUDENT } = process.env;
if (!PRIVATE_KEY || !BADGE || !TO || !STUDENT) {
  throw new Error("Cần PRIVATE_KEY, BADGE, TO, STUDENT");
}

const key = PRIVATE_KEY.trim();
const account = privateKeyToAccount(key.startsWith("0x") ? key : "0x" + key);
const publicClient = createPublicClient({ chain: trustkeys, transport: http() });
const walletClient = createWalletClient({ account, chain: trustkeys, transport: http() });

const { request } = await publicClient.simulateContract({
  address: BADGE, abi: badgeAbi, functionName: "mint", args: [TO, STUDENT], account,
});
const hash = await walletClient.writeContract(request);
console.log("PENDING", hash);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(receipt.status === "success" ? "SUCCESS" : "REVERTED", "block", receipt.blockNumber);
