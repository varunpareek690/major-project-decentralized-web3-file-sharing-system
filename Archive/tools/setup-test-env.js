#!/usr/bin/env node

/**
 * Setup script to create test environment for ChainShare
 * Run: node tools/setup-test-env.js
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function createTestFiles() {
  console.log('📁 Creating test file structure...');
  
  const dirs = [
    'data/seeds',
    'data/downloads',
    'data/torrents',
    'test-node-1/downloads',
    'test-node-2/downloads',
    'test-node-3/downloads',
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(rootDir, dir));
    console.log(`  ✓ Created ${dir}`);
  }

  // Create test files
  console.log('\n📝 Creating test files...');

  // Small text file
  await fs.writeFile(
    path.join(rootDir, 'data/seeds/hello.txt'),
    'Hello from ChainShare! This is a test file.'
  );
  console.log('  ✓ Created hello.txt');

  // Medium text file
  const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
  await fs.writeFile(
    path.join(rootDir, 'data/seeds/medium.txt'),
    loremIpsum
  );
  console.log('  ✓ Created medium.txt');

  // Large binary file (1MB)
