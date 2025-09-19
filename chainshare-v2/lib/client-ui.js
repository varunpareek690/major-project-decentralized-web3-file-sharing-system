// Is function ko 'start-client-daemon.js' import karega
export function getClientHTML(port) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ChainShare Client</title>
    <style>
        body { font-family: sans-serif; background: #f0f2f5; }
        .container { max-width: 800px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; }
        input { width: 90%; padding: 10px; font-size: 1em; }
        button { padding: 10px; }
        #downloads { margin-top: 20px; }
        .progress-bar { background: #eee; border-radius: 4px; overflow: hidden; }
        .progress-inner { background: #007bff; color: white; padding: 5px; width: 0%; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔗 ChainShare Client</h1>
        
        <h2>Download Torrent</h2>
        <input type="text" id="magnetInput" placeholder="Paste magnet link here...">
        <button id="downloadBtn">Download</button>

        <hr>
        <h2>Active Downloads</h2>
        <div id="downloads">
            <p>No active downloads...</p>
        </div>
    </div>

    <script>
        const magnetInput = document.getElementById('magnetInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadsDiv = document.getElementById('downloads');

        // 1. API Call (Download start karne ke liye)
        downloadBtn.onclick = async () => {
            const magnetURI = magnetInput.value;
            if (!magnetURI) return alert('Please paste a magnet link');

            try {
                const res = await fetch('/api/client/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ magnetURI })
                });
                const data = await res.json();
                
                if (res.ok) {
                    alert('Download started! See progress below.');
                    if (!document.getElementById(magnetURI)) {
                         downloadsDiv.innerHTML += \`
                            <div id="\${magnetURI}">
                                <p><strong>Magnet:</strong> \${magnetURI.substring(0, 40)}...</p>
                                <div class="progress-bar">
                                    <div class="progress-inner" id="prog-\${magnetURI}">Starting...</div>
                                </div>
                                <small id="speed-\${magnetURI}">Speed: 0 B/s | Peers: 0</small>
                            </div>
                         \`;
                    }
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                alert('Server error: ' + err.message);
            }
        };

        // 2. WebSocket (Live progress updates ke liye)
        const ws = new WebSocket(\`ws://localhost:${port}\`);
        
        ws.onopen = () => console.log('Connected to Daemon');
        
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
