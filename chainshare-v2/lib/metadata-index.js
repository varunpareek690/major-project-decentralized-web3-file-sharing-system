import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "data", "index.json");

async function load() {
  try {
    await fs.ensureFile(DB_PATH);
    const raw = await fs.readFile(DB_PATH, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

async function save(obj) {
  await fs.writeFile(DB_PATH, JSON.stringify(obj, null, 2));
}

export async function addTorrent(infohash, metadata) {
  const db = await load();

  if (!infohash || !/^[a-fA-F0-9]{40}$/.test(infohash)) {
    console.error("[index] Invalid infohash:", infohash);
    return;
  }

  const validMetadata = {
    name: metadata.name || "Unknown",
    size: metadata.size || 0,
    files: metadata.files || [],
    addedAt: new Date().toISOString(),
    ...metadata,
  };

  db[infohash] = validMetadata;
  await save(db);
}
export async function getTorrent(infohash) {
  const db = await load();
  return db[infohash];
}

export async function list() {
  return await load();
}

export async function removeTorrent(infohash) {
