import fs from 'fs-extra';
import path from 'path';

const DEFAULT_CONFIG = {
  tracker: {
    port: 8000,
    enableHttp: true,
    enableUdp: true,
    enableWs: true
  },
  seeder: {
    torrentOutDir: './data/torrents',
    defaultAnnounce: [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://tracker.openbittorrent.com:6969/announce',
      'udp://open.stealth.si:80/announce',
      'wss://tracker.openwebtorrent.com'
    ],
    enableDHT: true,
    enableLSD: true,
    enablePEX: true,
    maxPeers: 200
  },
  downloader: {
    downloadPath: './data/downloads',
    timeout: 120000,
    maxRetries: 5,
    enableDHT: true,
    enableLSD: true,
    enablePEX: true,
    maxPeers: 200
  },
  network: {
    enableDHT: true,
    enableLSD: true,
    enablePEX: true,
    natTraversal: true,
    maxPeers: 200
  },
  ui: {
    showProgress: true,
    logLevel: 'info'
  }
};

let config = null;

/**
 * Load configuration from config.json or use defaults
 * @param {string} configPath - Path to config file
 * @returns {Object} Configuration object
 */
export async function loadConfig(configPath = './config.json') {
  if (config) return config;

  try {
    const absPath = path.resolve(configPath);
    
    if (await fs.pathExists(absPath)) {
      const fileContent = await fs.readFile(absPath, 'utf-8');
      const userConfig = JSON.parse(fileContent);
      
      // Merge with defaults
      config = mergeDeep(DEFAULT_CONFIG, userConfig);
      console.log('✅ Loaded configuration from', absPath);
    } else {
      config = DEFAULT_CONFIG;
      console.log('ℹ️  Using default configuration');
      
      // Create default config file
      await fs.ensureDir(path.dirname(absPath));
      await fs.writeFile(absPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log('✅ Created default config.json');
    }
  } catch (err) {
    console.warn('⚠️  Error loading config, using defaults:', err.message);
    config = DEFAULT_CONFIG;
  }

  return config;
}

/**
 * Get current configuration
 * @returns {Object} Configuration object
 */
export function getConfig() {
  return config || DEFAULT_CONFIG;
}

/**
 * Deep merge two objects
 */
function mergeDeep(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}