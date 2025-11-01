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
      torrentOutDir: './data/torrents'
    },
    downloader: {
      downloadPath: './data/downloads',
      maxConnections: 55
    }
  };

  await fs.ensureDir(path.join(rootDir, 'config'));
  await fs.writeFile(
    path.join(rootDir, 'config/default.json'),
    JSON.stringify(config, null, 2)
  );
  console.log('  ✓ Created config/default.json');
}

async function createTestScript() {
  console.log('\n🧪 Creating test script...');
  
  const script = `#!/bin/bash

# ChainShare Local Test Script
# This script tests basic torrent functionality

echo "🚀 ChainShare Local Test"
echo "========================"
echo ""

# Colors
GREEN='\\033[0;32m'
RED='\\033[0;31m'
NC='\\033[0m' # No Color

# Start tracker in background
echo "1️⃣  Starting tracker..."
node bin/chainshare-node.js tracker &
TRACKER_PID=$!
sleep 2

# Seed a file
echo ""
echo "2️⃣  Seeding test file..."
node bin/chainshare-node.js seed data/seeds/hello.txt > seed.log 2>&1 &
SEED_PID=$!
sleep 3

# Extract magnet link
MAGNET=$(grep "magnet:" seed.log | tail -n 1 | awk '{print $NF}')
echo "   Magnet: $MAGNET"

if [ -z "$MAGNET" ]; then
    echo -e "   \${RED}❌ Failed to get magnet link\${NC}"
    kill $TRACKER_PID $SEED_PID 2>/dev/null
    exit 1
fi

# Download the file
echo ""
echo "3️⃣  Downloading..."
timeout 30 node bin/chainshare-node.js download "$MAGNET" --output test-node-1/downloads

# Verify
echo ""
echo "4️⃣  Verifying..."
if diff data/seeds/hello.txt test-node-1/downloads/hello.txt >/dev/null 2>&1; then
    echo -e "   \${GREEN}✅ File transfer successful!\${NC}"
    EXIT_CODE=0
else
    echo -e "   \${RED}❌ File verification failed\${NC}"
    EXIT_CODE=1
fi

# Cleanup
echo ""
echo "5️⃣  Cleaning up..."
kill $TRACKER_PID $SEED_PID 2>/dev/null
rm -f seed.log

echo ""
echo "========================"
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\${GREEN}✅ Test passed!\${NC}"
else
    echo -e "\${RED}❌ Test failed!\${NC}"
fi

exit $EXIT_CODE
`;

  await fs.writeFile(
    path.join(rootDir, 'tools/test-local.sh'),
    script
  );
  await fs.chmod(path.join(rootDir, 'tools/test-local.sh'), 0o755);
  console.log('  ✓ Created tools/test-local.sh');
}

async function createReadme() {
  console.log('\n📖 Creating README...');
  
  const readme = `# ChainShare Test Environment

## Quick Start

\`\`\`bash
# Setup test environment
npm run test:setup

# Run automated test
npm run test:local

# Or manual testing:

# Terminal 1 - Start tracker
npm run tracker

# Terminal 2 - Seed a file
npm run seed data/seeds/hello.txt

# Terminal 3 - Download (use magnet from Terminal 2)
npm run download "magnet:?xt=urn:btih:..."
\`\`\`

## Test Files Created

- \`data/seeds/hello.txt\` - Small text file
- \`data/seeds/medium.txt\` - Medium text file (~5KB)
- \`data/seeds/binary.dat\` - Binary file (1MB)
- \`data/seeds/project/\` - Multi-file directory

## Directory Structure

\`\`\`
chainshare/
├── data/
│   ├── seeds/        # Files to seed
│   ├── downloads/    # Downloaded files
│   └── torrents/     # Generated .torrent files
├── test-node-1/      # First test node
├── test-node-2/      # Second test node
└── test-node-3/      # Third test node
\`\`\`
`;

  await fs.writeFile(
    path.join(rootDir, 'TEST_ENVIRONMENT.md'),
    readme
  );
  console.log('  ✓ Created TEST_ENVIRONMENT.md');
}

async function main() {
  console.log('🔧 ChainShare Test Environment Setup\n');
  
  try {
    await createTestFiles();
    await createConfigFile();
    await createTestScript();
    await createReadme();
    
    console.log('\n✅ Setup complete!\n');
    console.log('Next steps:');
    console.log('  1. npm install');
    console.log('  2. npm run test:local');
    console.log('  or');
    console.log('  1. npm run tracker (Terminal 1)');
    console.log('  2. npm run seed data/seeds/hello.txt (Terminal 2)');
    console.log('  3. Copy magnet link and download (Terminal 3)');
    console.log('');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();