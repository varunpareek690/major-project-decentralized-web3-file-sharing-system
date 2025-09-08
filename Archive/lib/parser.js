import parseTorrent from 'parse-torrent';
import fs from 'fs-extra';

function piecesToHexArray(piecesBuffer) {
  const out = [];
  if (!piecesBuffer) return out;
  for (let i = 0; i < piecesBuffer.length; i += 20) {
    out.push(piecesBuffer.slice(i, i + 20).toString('hex'));
  }
  return out;
}

export async function parseFromTorrentFile(filePath) {
  try {
    let buf = await fs.readFile(filePath);
    // Make sure it's a Node Buffer
    if (!(buf instanceof Buffer)) buf = Buffer.from(buf);

    const parsed = parseTorrent(buf);
    console.log('[parser] Parsed torrent keys:', Object.keys(parsed));

    return {
      infoHash: parsed.infoHash || 'unknown',
