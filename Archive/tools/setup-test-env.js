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
  const largeBuffer = crypto.randomBytes(1024 * 1024);
  await fs.writeFile(
    path.join(rootDir, 'data/seeds/binary.dat'),
    largeBuffer
  );
  console.log('  ✓ Created binary.dat (1MB)');

  // Multi-file directory
  const multiFileDir = path.join(rootDir, 'data/seeds/project');
  await fs.ensureDir(multiFileDir);
  await fs.writeFile(path.join(multiFileDir, 'README.md'), '# Test Project\n\nThis is a test project.');
  await fs.writeFile(path.join(multiFileDir, 'index.js'), 'console.log("Hello World");');
  await fs.writeFile(path.join(multiFileDir, 'package.json'), JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2));
  
  const srcDir = path.join(multiFileDir, 'src');
  await fs.ensureDir(srcDir);
  await fs.writeFile(path.join(srcDir, 'app.js'), 'export default function app() { return "App"; }');
  await fs.writeFile(path.join(srcDir, 'utils.js'), 'export function helper() { return true; }');
  
  console.log('  ✓ Created project/ directory with 5 files');

  // Clean/initialize index
  await fs.writeFile(
    path.join(rootDir, 'data/index.json'),
    JSON.stringify({}, null, 2)
  );
  console.log('\n📊 Initialized metadata index');
}

async function createConfigFile() {
  console.log('\n⚙️  Creating default config...');
  
  const config = {
    tracker: {
      port: 8000,
      host: 'localhost'
    },
    seeder: {
      announce: ['http://localhost:8000/announce'],
