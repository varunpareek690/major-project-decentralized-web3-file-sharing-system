import WebTorrent from 'webtorrent';
import fs from 'fs-extra';
import path from 'path';

/**
 * Download files from magnet URI or torrent file
 * @param {string} magnetURI - Magnet link or infohash
 * @param {Object} options - Configuration options
 * @returns {Promise<{client, torrent}>}
 */
export async function download(magnetURI, {
  downloadPath = './data/downloads',
  clientOptions = {},
  announce,
  onProgress,
  onMetadata,
  timeout = 60000, // 60 second timeout
} = {}) {
  const client = new WebTorrent(clientOptions);
  client.on('error', err => console.error('[downloader-client] error', err));

  await fs.ensureDir(downloadPath);
  
  const opts = { path: downloadPath };
  if (announce) {
    opts.announce = Array.isArray(announce) ? announce : [announce];
  }

  return new Promise((resolve, reject) => {
    let metadataReceived = false;
    let downloadStarted = false;
    
    // Set timeout for metadata
    const metadataTimeout = setTimeout(() => {
      if (!metadataReceived) {
        const error = new Error('Timeout: Could not retrieve metadata from peers');
        console.error('[downloader] ❌', error.message);
        client.destroy();
        reject(error);
      }
    }, timeout);

    console.log('[downloader] 🔍 Adding torrent...');
    console.log(`[downloader] Magnet: ${magnetURI}`);

    const torrent = client.add(magnetURI, opts);

    // Metadata received
    torrent.on('metadata', () => {
      metadataReceived = true;
      clearTimeout(metadataTimeout);
      
      console.log(`[downloader] 🧩 Metadata received:`);
      console.log(`  ↳ Name: ${torrent.name}`);
      console.log(`  ↳ InfoHash: ${torrent.infoHash}`);
      console.log(`  ↳ Size: ${formatBytes(torrent.length)}`);
      console.log(`  ↳ Files: ${torrent.files.length}`);
      
      torrent.files.forEach((file, i) => {
        console.log(`     ${i + 1}. ${file.name} (${formatBytes(file.length)})`);
      });

      if (onMetadata) onMetadata(torrent);
    });

    // Download progress
    torrent.on('download', bytes => {
      if (!downloadStarted) {
        downloadStarted = true;
        console.log('[downloader] 📥 Download started...');
      }

      const progress = (torrent.progress * 100).toFixed(2);
      const downloaded = formatBytes(torrent.downloaded);
      const total = formatBytes(torrent.length);
      const speed = formatBytes(torrent.downloadSpeed);
      const peers = torrent.numPeers;

      // Log every 5% progress or call custom handler
      if (onProgress) {
        onProgress({
          progress: torrent.progress,
          downloaded: torrent.downloaded,
          total: torrent.length,
          speed: torrent.downloadSpeed,
          peers: torrent.numPeers,
        });
      } else {
        // Default logging - only show at certain milestones
        const progressInt = Math.floor(torrent.progress * 100);
        if (progressInt % 10 === 0 && bytes > 0) {
          console.log(
            `[downloader] Progress: ${progress}% | ` +
            `${downloaded}/${total} | ` +
            `${speed}/s | ` +
            `Peers: ${peers}`
          );
        }
      }
    });

    // Wire connection
    torrent.on('wire', (wire, addr) => {
      console.log(`[downloader] 🔗 Connected to peer: ${addr || 'unknown'}`);
    });

    // No peers warning
    torrent.on('noPeers', () => {
      console.warn('[downloader] ⚠️  No peers found. Waiting...');
    });

    // Download complete
    torrent.on('done', async () => {
      console.log(`[downloader] ✅ Download complete: ${torrent.name}`);
      console.log(`[downloader] Saved to: ${path.resolve(downloadPath)}`);
      console.log(`[downloader] Files:`);
      
      torrent.files.forEach(f => {
        const filePath = path.join(downloadPath, f.path);
        console.log(`  ↳ ✔️  ${f.path}`);
      });

      console.log(`\n[downloader] 🌱 Now seeding...`);
      resolve({ client, torrent });
    });

    // Error handling
    torrent.on('error', err => {
      console.error('[downloader] ❌ Torrent error:', err.message);
      clearTimeout(metadataTimeout);
      client.destroy();
      reject(err);
    });

    // Warning handling
    torrent.on('warning', warn => {
      console.warn('[downloader] ⚠️  Warning:', warn.message);
    });
  });
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Download with retry logic
 */
export async function downloadWithRetry(magnetURI, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[downloader] Attempt ${attempt}/${maxRetries}`);
      return await download(magnetURI, options);
    } catch (err) {
      lastError = err;
      console.error(`[downloader] Attempt ${attempt} failed:`, err.message);
      
      if (attempt < maxRetries) {
        const delay = attempt * 5000; // Exponential backoff
        console.log(`[downloader] Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Download failed after ${maxRetries} attempts: ${lastError.message}`);
}

export default download;