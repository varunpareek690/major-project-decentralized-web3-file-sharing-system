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
    
