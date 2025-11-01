import WebTorrent from 'webtorrent';
import path from 'path';

/**
 * Download torrent with DHT support
 * @param {string} magnetURI - Magnet URI or torrent file buffer
 * @param {Object} options - Download options
 * @returns {Promise<{client: WebTorrent, torrent: Torrent}>}
 */
export async function download(magnetURI, options = {}) {
  // Create WebTorrent client with DHT enabled
  const client = new WebTorrent({
    dht: true,              // Enable DHT for peer discovery
    lsd: true,              // Enable Local Service Discovery (for LAN)
    tracker: true,          // Keep tracker support
    natUpnp: true,          // Enable UPnP for NAT traversal
    natPmp: true,           // Enable NAT-PMP
    maxConns: options.maxPeers || 200,
  });

  console.log('✅ DHT enabled - searching for peers...');
  console.log('✅ LSD enabled - scanning local network...');

  const downloadPath = options.downloadPath || './data/downloads';

  // Add the torrent
  const torrent = await new Promise((resolve, reject) => {
    const torrentObj = client.add(magnetURI, {
      path: downloadPath,
      announce: options.announce || []
    });

    let metadataReceived = false;
    let firstPeerFound = false;

    // Error handling
    torrentObj.on('error', (err) => {
      reject(new Error(`Torrent error: ${err.message}`));
    });

    // Metadata received (torrent info downloaded)
    torrentObj.on('metadata', () => {
      metadataReceived = true;
      console.log('\n✅ Metadata received!');
      console.log(`📁 Name: ${torrentObj.name}`);
      console.log(`📦 Size: ${formatBytes(torrentObj.length)}`);
      console.log(`📄 Files: ${torrentObj.files.length}`);
      
      // Setup progress tracking
      if (options.onProgress) {
        const progressInterval = setInterval(() => {
          options.onProgress({
            progress: torrentObj.progress,
            speed: torrentObj.downloadSpeed,
            peers: torrentObj.numPeers,
            downloaded: torrentObj.downloaded,
            uploaded: torrentObj.uploaded,
            ratio: torrentObj.uploaded / torrentObj.downloaded || 0
          });
        }, 1000);

        torrentObj.on('done', () => {
          clearInterval(progressInterval);
        });
      }
    });

    // Peer discovery events
    torrentObj.on('peer', (peer) => {
      if (!firstPeerFound) {
        firstPeerFound = true;
        console.log(`\n🤝 First peer found: ${peer.id}`);
      }
      console.log(`🤝 Peer connected: ${peer.addr}`);
    });

    // DHT peer discovery
    torrentObj.on('dhtAnnounce', () => {
      console.log('📢 Announced to DHT network');
    });

    // Tracker announce
    torrentObj.on('trackerAnnounce', () => {
      console.log('📢 Announced to tracker');
    });

    // Wire protocol connection
    torrentObj.on('wire', (wire, addr) => {
      console.log(`⚡ Wire connected: ${addr}`);
    });

    // Download complete
    torrentObj.on('done', () => {
      console.log('\n🎉 Download complete!');
      console.log(`📁 Location: ${path.resolve(downloadPath, torrentObj.name)}`);
      resolve(torrentObj);
    });

    // Timeout handling
    const timeout = options.timeout || 120000; // 2 minutes default
    const timeoutId = setTimeout(() => {
      if (!metadataReceived) {
        reject(new Error(
          'Timeout: Could not find peers via DHT, LSD, or trackers. ' +
          'Make sure the seeder is online and try adding public trackers.'
        ));
      }
    }, timeout);

    torrentObj.on('metadata', () => {
      clearTimeout(timeoutId);
    });

    // Log initial info
    console.log(`\n🔍 Searching for peers...`);
    console.log(`   DHT: Querying distributed hash table...`);
    console.log(`   LSD: Broadcasting on local network...`);
    if (options.announce && options.announce.length > 0) {
      console.log(`   Trackers: ${options.announce.length} configured`);
    }
  });

  return { client, torrent };
}

/**
 * Download with retry logic
 * @param {string} magnetURI - Magnet URI
 * @param {Object} options - Download options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<{client: WebTorrent, torrent: Torrent}>}
 */
export async function downloadWithRetry(magnetURI, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n🔄 Attempt ${attempt}/${maxRetries}`);
      return await download(magnetURI, options);
    } catch (err) {
      lastError = err;
      console.error(`❌ Attempt ${attempt} failed: ${err.message}`);
      
      if (attempt < maxRetries) {
        const waitTime = attempt * 5000; // Exponential backoff
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw new Error(`Download failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Get peer discovery stats
 * @param {Torrent} torrent - WebTorrent torrent object
 * @returns {Object} Peer discovery statistics
 */
export function getPeerStats(torrent) {
  return {
    totalPeers: torrent.numPeers,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    progress: torrent.progress,
    downloaded: torrent.downloaded,
    uploaded: torrent.uploaded,
    ratio: torrent.uploaded / torrent.downloaded || 0,
    timeRemaining: torrent.timeRemaining,
    peers: torrent.wires.map(wire => ({
      id: wire.peerId,
      addr: wire.remoteAddress,
      downloadSpeed: wire.downloadSpeed(),
      uploadSpeed: wire.uploadSpeed()
    }))
  };
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}