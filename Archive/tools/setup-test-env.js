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
