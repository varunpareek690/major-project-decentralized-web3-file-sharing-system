import WebTorrent from 'webtorrent';
import path from 'path';
import fs from 'fs-extra';
import createTorrent from 'create-torrent';
import parseTorrent from 'parse-torrent';

/**
 * Seed files with DHT support
 * @param {string[]} filePaths - Array of file/directory paths to seed
 * @param {Object} options - Seeding options
 * @returns {Promise<{client: WebTorrent, results: Array}>}
 */
export async function seed(filePaths, options = {}) {
  // Create WebTorrent client with DHT enabled
  const client = new WebTorrent({
    dht: true,              // Enable DHT for peer discovery
    lsd: true,              // Enable Local Service Discovery (for LAN)
    tracker: true,          // Keep tracker support
    natUpnp: true,          // Enable UPnP for NAT traversal
    natPmp: true,           // Enable NAT-PMP
    maxConns: options.maxPeers || 200,
  });

  console.log('✅ DHT enabled - peers can discover each other without trackers!');
  console.log('✅ LSD enabled - automatic discovery on local network!');

  const results = [];

  for (const filePath of filePaths) {
    const absPath = path.resolve(filePath);
    const parsed = path.parse(absPath);
    
    // Check if path exists
    const stats = await fs.stat(absPath);
    const isDirectory = stats.isDirectory();

    // Create torrent options
    const torrentOpts = {
      name: options.name || parsed.base,
      announce: options.announce || [],  // Can be empty with DHT!
      comment: options.comment || 'Created by ChainShare',
      createdBy: 'ChainShare/1.0.0',
      private: false,  // IMPORTANT: Must be false for DHT to work
    };

    console.log(`\n📦 Creating torrent for: ${parsed.base}`);
    if (torrentOpts.announce.length > 0) {
      console.log(`📡 Trackers: ${torrentOpts.announce.join(', ')}`);
    }
    console.log(`🔍 DHT: Enabled (peers will find each other automatically)`);

    // Create torrent
    const torrentBuffer = await new Promise((resolve, reject) => {
      createTorrent(absPath, torrentOpts, (err, torrent) => {
        if (err) reject(err);
        else resolve(torrent);
      });
    });

    // Parse the created torrent
    const torrentInfo = parseTorrent(torrentBuffer);

    // Save .torrent file
    const torrentFileName = `${parsed.name}.torrent`;
    const torrentOutDir = options.torrentOutDir || './data/torrents';
    const torrentFilePath = path.join(torrentOutDir, torrentFileName);

    await fs.ensureDir(torrentOutDir);
    await fs.writeFile(torrentFilePath, torrentBuffer);

    // Start seeding
    const torrent = await new Promise((resolve, reject) => {
      const t = client.seed(absPath, torrentOpts, (torrent) => {
        resolve(torrent);
      });

      t.on('error', reject);
      
      // DHT announce
      t.on('dhtAnnounce', () => {
        console.log('📢 Announced to DHT network');
      });

      // Tracker announce
      t.on('tracker-announce', () => {
        console.log('📢 Announced to tracker');
      });
    });

    // Wait a bit for DHT to initialize
