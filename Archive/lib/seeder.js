import WebTorrent from 'webtorrent';
import createTorrent from 'create-torrent';
import fs from 'fs-extra';
import path from 'path';
import bencode from 'bencode';
import crypto from 'crypto';

/**
 * Parse torrent buffer manually
 */
function parseTorrentBuffer(buffer) {
  try {
    const torrent = bencode.decode(buffer);
    
    // Calculate info hash
    const info = torrent.info;
    const infoHash = crypto.createHash('sha1')
      .update(bencode.encode(info))
      .digest('hex');
    
    return {
      infoHash,
      name: info.name?.toString('utf8') || 'unknown',
      announce: torrent.announce?.toString('utf8'),
      announceList: torrent['announce-list'],
      info
    };
  } catch (err) {
    console.error('[torrent] Failed to parse torrent:', err);
    return null;
  }
}

/**
 * Create a .torrent file from a file or directory
 * @returns {Promise<{parsed, outPath, buffer}>}
 */
async function createTorrentFile(inputPath, outDir, opts = {}) {
  await fs.ensureDir(outDir);

  console.log(`[torrent] Creating torrent for: ${inputPath}`);
  
  const buffer = await new Promise((resolve, reject) => {
    createTorrent(inputPath, opts, (err, torrent) => {
      if (err) {
        console.error('[torrent] createTorrent error:', err);
        return reject(err);
      }
      const buf = Buffer.isBuffer(torrent) ? torrent : Buffer.from(torrent);
      console.log('[torrent] Torrent buffer created, size:', buf.length);
      resolve(buf);
    });
  });

  // Parse the torrent to extract metadata
  console.log('[torrent] Parsing torrent buffer...');
  const parsed = parseTorrentBuffer(buffer);
  
  if (!parsed || !parsed.infoHash) {
    console.error('[torrent] Failed to parse torrent buffer');
    throw new Error('Failed to generate valid infoHash from torrent');
  }

  console.log('[torrent] Parsed result:', {
    infoHash: parsed.infoHash,
    name: parsed.name,
    announce: parsed.announce
  });

  const infoHash = parsed.infoHash;
  const name = parsed.name || path.basename(inputPath);
  const filename = `${infoHash}.torrent`;
  const outPath = path.join(outDir, filename);

  await fs.writeFile(outPath, buffer);

  console.log(`[torrent] Created torrent file: ${outPath}`);
  console.log(`[torrent] infoHash=${infoHash}, name=${name}`);

