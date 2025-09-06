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
