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
