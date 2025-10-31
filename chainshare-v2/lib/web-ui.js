import http from 'http';
import fs from 'fs-extra';
import path from 'path';
import { list as listTorrents } from './metadata-index.js';
import { getNetworkInfo } from './network-utils.js';

/**
 * Start a simple web UI for managing torrents
 * @param {Object} options - Configuration options
 * @returns {http.Server}
 */
