import { ethers } from "ethers";
import dotenv from "dotenv";
import { createRequire } from "module";

// Load .env
dotenv.config();

// Use createRequire to load ABI JSON
const require = createRequire(import.meta.url);
const registryJson = require("../out/RewardRegistry.sol/RewardRegistry.json");

// ---- CONFIG ----
const RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = "0xB2EE2663118f58Faa2e2b58315ea75eAedDc03a5"; // replace this


// ---- SETUP ----
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, registryJson.abi, wallet);

async function main() {
  console.log("\n🔥 Yo homie, we live! Wallet:", wallet.address);

  const owner = await contract.owner();
  console.log("👑 Contract Owner:", owner);

  const hash = ethers.keccak256(ethers.toUtf8Bytes("testFile.mp4"));
  const metadata = "ipfs://example";

  console.log("\n📨 Sending TX to register upload...");
  const tx = await contract.registerUpload(hash, metadata);

  console.log("⏳ Waiting for confirmation:", tx.hash);
  await tx.wait();

  console.log("✅ Upload registered!");

  const stored = await contract.getUpload(hash);
  console.log("\n📦 Upload Info:", stored);
}

main().catch((err) => {
  console.log("\n❌ ERROR");
  console.error(err);
});
