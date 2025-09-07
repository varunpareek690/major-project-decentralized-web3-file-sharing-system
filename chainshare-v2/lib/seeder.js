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
