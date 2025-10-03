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
