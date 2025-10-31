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
