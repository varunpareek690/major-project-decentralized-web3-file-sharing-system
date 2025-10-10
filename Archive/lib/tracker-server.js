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
    console.log('[tracker] running on:');
    console.log(`  - HTTP: http://localhost:${port}/announce`);
    console.log(`  - UDP:  udp://localhost:${port}`);
    console.log(`  - WS:   ws://localhost:${port}`);
  });

  // Optional peer lifecycle logging
  server.on('start', addr => console.log('[tracker] peer start:', addr.peerId?.toString('hex')));
  server.on('complete', addr => console.log('[tracker] peer complete:', addr.peerId?.toString('hex')));
  server.on('stop', addr => console.log('[tracker] peer stop:', addr.peerId?.toString('hex')));

  // Start listening
  server.listen(port);

  return server;
}
