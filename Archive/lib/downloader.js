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
