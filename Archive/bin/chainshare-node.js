#!/usr/bin/env node

import { Command } from 'commander';
import { seed } from '../lib/seeder.js';
import { download } from '../lib/downloader.js';
import { list, addTorrent } from '../lib/metadata-index.js';

const program = new Command();

program
  .name('chainshare')
  .description('Decentralized file sharing using BitTorrent')
  .version('1.0.0');

program
  .command('seed')
  .description('Seed files or directories')
  .argument('<paths...>', 'Files or directories to seed')
  .option('-a, --announce <url>', 'Tracker announce URL', 'http://localhost:8000/announce')
  .option('-o, --output <dir>', 'Torrent output directory', './data/torrents')
  .action(async (paths, options) => {
    try {
      console.log('[chainshare] Starting seeder...');
      console.log(`[chainshare] Tracker: ${options.announce}`);
      
      const { client, results } = await seed(paths, {
        announce: [options.announce],
        torrentOutDir: options.output,
      });

      // Save metadata to index
      for (const result of results) {
        await addTorrent(result.infoHash, {
          name: result.torrent.name,
          magnetURI: result.magnetURI,
          files: result.torrent.files.map(f => ({
            name: f.name,
            length: f.length,
          })),
        });
        console.log(`[chainshare] Added to index: ${result.infoHash}`);
      }

      console.log('[chainshare] ✅ Seeding... Press Ctrl+C to stop');

      // Keep process alive
      process.on('SIGINT', () => {
        console.log('\n[chainshare] Stopping seeder...');
        client.destroy(() => {
          console.log('[chainshare] Seeder stopped');
          process.exit(0);
        });
      });
    } catch (err) {
      console.error('[chainshare] ❌ Seed failed:', err.message);
      process.exit(1);
    }
  });

program
  .command('download')
  .description('Download from magnet URI or infohash')
  .argument('<magnet>', 'Magnet URI or infohash')
  .option('-a, --announce <url>', 'Tracker announce URL (if using infohash)', 'http://localhost:8000/announce')
  .option('-o, --output <dir>', 'Download directory', './data/downloads')
  .option('-t, --timeout <ms>', 'Metadata timeout in milliseconds', '60000')
  .action(async (magnet, options) => {
    try {
      console.log('[chainshare] Starting download...');
      
      // If it's just an infohash, construct magnet URI
      let magnetURI = magnet;
      if (!magnet.startsWith('magnet:')) {
        console.log('[chainshare] Infohash detected, constructing magnet URI...');
        magnetURI = `magnet:?xt=urn:btih:${magnet}&tr=${encodeURIComponent(options.announce)}`;
        console.log(`[chainshare] Magnet: ${magnetURI}`);
      }

      const { client, torrent } = await download(magnetURI, {
        downloadPath: options.output,
        announce: options.announce,
        timeout: parseInt(options.timeout),
        onProgress: (stats) => {
          const progress = (stats.progress * 100).toFixed(2);
          const downloaded = formatBytes(stats.downloaded);
          const total = formatBytes(stats.total);
          const speed = formatBytes(stats.speed);
          
          process.stdout.write(
            `\r[chainshare] ${progress}% | ${downloaded}/${total} | ${speed}/s | Peers: ${stats.peers}    `
          );
        },
      });

      console.log('\n[chainshare] ✅ Download complete!');
      console.log('[chainshare] Now seeding... Press Ctrl+C to stop');

      process.on('SIGINT', () => {
        console.log('\n[chainshare] Stopping...');
        client.destroy(() => {
          console.log('[chainshare] Stopped');
          process.exit(0);
        });
      });
    } catch (err) {
      console.error('[chainshare] ❌ Download failed:', err.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all indexed torrents')
  .action(async () => {
    try {
      const torrents = await list();
      const entries = Object.entries(torrents);

      if (entries.length === 0) {
        console.log('[chainshare] No torrents in index');
        return;
      }

      console.log(`[chainshare] Found ${entries.length} torrent(s):\n`);
      
      entries.forEach(([hash, data]) => {
        console.log(`InfoHash: ${hash}`);
        console.log(`  Name: ${data.name}`);
        console.log(`  Magnet: ${data.magnetURI}`);
        console.log(`  Files: ${data.files?.length || 0}`);
        console.log(`  Added: ${data.addedAt}`);
        console.log('');
      });
    } catch (err) {
      console.error('[chainshare] ❌ Failed to list:', err.message);
      process.exit(1);
    }
  });

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

program.parse();