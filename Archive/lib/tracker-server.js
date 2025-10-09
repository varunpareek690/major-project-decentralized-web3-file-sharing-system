import { Server } from 'bittorrent-tracker';

export function startTracker({ port = 8000 } = {}) {
  const server = new Server({
    udp: true,   // UDP tracker (for native BitTorrent)
    http: true,  // HTTP tracker
    ws: true     // WebSocket tracker (for WebTorrent peers)
  });

  // Event handlers
  server.on('error', err => console.error('[tracker] error:', err));
  server.on('warning', warn => console.warn('[tracker] warning:', warn.message));
  server.on('listening', () => {
