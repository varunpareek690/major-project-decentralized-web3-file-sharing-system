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
      name: parsed.name || 'unnamed',
      files: Array.isArray(parsed.files)
        ? parsed.files.map(f => ({
            path: f.path || parsed.name || 'unknown',
            length: f.length || 0,
          }))
        : [],
      pieceLength: parsed.pieceLength || 0,
      pieces: piecesToHexArray(parsed.pieces),
    };
  } catch (err) {
    console.error('[parser] Failed to parse torrent:', filePath, err.message);
    return {
      infoHash: null,
      name: 'invalid',
      files: [],
      pieceLength: 0,
      pieces: [],
    };
  }
}
