import WebTorrent from 'webtorrent';
import createTorrent from 'create-torrent';
import fs from 'fs-extra';
import path from 'path';
import bencode from 'bencode';
import crypto from 'crypto';

/**
 * Parse torrent buffer manually
 */
function parseTorrentBuffer(buffer) {
  try {
    const torrent = bencode.decode(buffer);
    
    // Calculate info hash
    const info = torrent.info;
    const infoHash = crypto.createHash('sha1')
      .update(bencode.encode(info))
      .digest('hex');
    
    return {
      infoHash,
