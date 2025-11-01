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
export function startWebUI({ 
  port = 3000,
  trackerPort = 8000,
  host = '0.0.0.0' // Bind to all interfaces
} = {}) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // CORS headers for API calls
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      // API endpoints
      if (url.pathname === '/api/torrents') {
        const torrents = await listTorrents();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(torrents, null, 2));
        return;
      }

      if (url.pathname === '/api/network') {
        const networks = getNetworkInfo();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(networks, null, 2));
        return;
      }

      if (url.pathname === '/api/stats') {
        const torrents = await listTorrents();
        const stats = {
          totalTorrents: Object.keys(torrents).length,
          totalSize: Object.values(torrents).reduce((sum, t) => sum + (t.size || 0), 0),
          trackerUrl: `http://localhost:${trackerPort}/announce`
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats, null, 2));
        return;
      }

      // Serve HTML UI
      if (url.pathname === '/' || url.pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getIndexHTML(trackerPort));
        return;
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');

    } catch (err) {
      console.error('[web-ui] Error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  server.listen(port, host, () => {
    console.log(`[web-ui] 🌐 Web interface running at:`);
    console.log(`[web-ui]    http://localhost:${port}`);
    
    const networks = getNetworkInfo();
    networks.filter(n => !n.internal).forEach(net => {
      console.log(`[web-ui]    http://${net.address}:${port}`);
    });
    console.log(`[web-ui] 📡 Accessible from all network interfaces (${host})`);
  });

  return server;
}

/**
 * Generate HTML for the web interface
 */
function getIndexHTML(trackerPort) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChainShare - WLAN Torrent System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-card h3 {
            color: #667eea;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .stat-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #764ba2;
        }
        .section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .section h2 {
            color: #667eea;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .torrent-list {
            display: grid;
            gap: 15px;
        }
        .torrent-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .torrent-item:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .torrent-name {
            font-size: 1.3em;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
        }
        .torrent-info {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 0.9em;
            color: #666;
            margin-bottom: 10px;
        }
        .torrent-hash {
            font-family: 'Courier New', monospace;
            background: #e9ecef;
            padding: 8px 12px;
            border-radius: 5px;
            font-size: 0.85em;
            word-break: break-all;
            margin-top: 10px;
        }
        .network-list {
            display: grid;
            gap: 10px;
        }
        .network-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .network-name {
            font-weight: 600;
            color: #667eea;
        }
        .network-addr {
            font-family: 'Courier New', monospace;
            color: #666;
        }
        .tracker-url {
            background: #667eea;
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            text-align: center;
            margin-top: 20px;
            word-break: break-all;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        .empty-state-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        .refresh-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .refresh-btn:hover {
            transform: scale(1.05);
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .badge-files {
            background: #e3f2fd;
            color: #1976d2;
        }
        .badge-size {
            background: #f3e5f5;
            color: #7b1fa2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 ChainShare</h1>
            <p>Decentralized File Sharing over WLAN</p>
        </div>

        <div class="stats" id="stats">
            <div class="stat-card">
                <h3>Total Torrents</h3>
                <div class="value" id="totalTorrents">-</div>
            </div>
            <div class="stat-card">
                <h3>Total Size</h3>
                <div class="value" id="totalSize">-</div>
            </div>
            <div class="stat-card">
                <h3>Tracker Port</h3>
                <div class="value">${trackerPort}</div>
            </div>
        </div>

        <div class="section">
            <h2>📋 Indexed Torrents</h2>
            <button class="refresh-btn" onclick="loadTorrents()">🔄 Refresh</button>
            <div id="torrentList" class="torrent-list" style="margin-top: 20px;">
                <div class="empty-state">
                    <div class="empty-state-icon">⏳</div>
                    <p>Loading torrents...</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📡 Network Interfaces</h2>
            <div id="networkList" class="network-list">
                <div class="empty-state">
                    <div class="empty-state-icon">⏳</div>
                    <p>Loading network info...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        async function loadStats() {
            try {
                const res = await fetch('/api/stats');
                const stats = await res.json();
                document.getElementById('totalTorrents').textContent = stats.totalTorrents;
                document.getElementById('totalSize').textContent = formatBytes(stats.totalSize);
            } catch (err) {
                console.error('Failed to load stats:', err);
            }
        }

        async function loadTorrents() {
            try {
                const res = await fetch('/api/torrents');
                const torrents = await res.json();
                const container = document.getElementById('torrentList');
                
                const entries = Object.entries(torrents);
                
                if (entries.length === 0) {
                    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No torrents indexed yet. Use CLI to seed files.</p></div>';
                    return;
                }

                container.innerHTML = entries.map(([hash, torrent]) => \`
                    <div class="torrent-item">
                        <div class="torrent-name">📦 \${torrent.name || 'Unknown'}</div>
                        <div class="torrent-info">
                            <span class="badge badge-size">\${formatBytes(torrent.size || 0)}</span>
                            <span class="badge badge-files">\${(torrent.files || []).length} files</span>
                            <span style="color: #999;">Added: \${new Date(torrent.addedAt).toLocaleString()}</span>
                        </div>
                        <div class="torrent-hash">🔑 \${hash}</div>
                        \${torrent.magnetURI ? \`<div class="torrent-hash" style="background: #d1f2eb; color: #0e6251; margin-top: 5px;">🧲 \${torrent.magnetURI}</div>\` : ''}
                    </div>
                \`).join('');
            } catch (err) {
                console.error('Failed to load torrents:', err);
                document.getElementById('torrentList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>Failed to load torrents</p></div>';
            }
        }

        async function loadNetwork() {
            try {
                const res = await fetch('/api/network');
                const networks = await res.json();
                const container = document.getElementById('networkList');
                
                const external = networks.filter(n => !n.internal);
                
                container.innerHTML = external.map(net => \`
                    <div class="network-item">
                        <div>
                            <div class="network-name">\${net.name}</div>
                            <div class="network-addr">\${net.address}</div>
                        </div>
                        <div class="badge badge-files">\${net.family}</div>
                    </div>
                \`).join('');

                if (external.length > 0) {
                    container.innerHTML += \`
                        <div class="tracker-url">
                            📍 Tracker: http://\${external[0].address}:${trackerPort}/announce
                        </div>
                    \`;
                }
            } catch (err) {
                console.error('Failed to load network:', err);
            }
        }

        // Load data on page load
        loadStats();
        loadTorrents();
        loadNetwork();

        // Auto-refresh every 10 seconds
        setInterval(() => {
            loadStats();
            loadTorrents();
        }, 10000);
    </script>
</body>
</html>`;
}