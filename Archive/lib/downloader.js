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
