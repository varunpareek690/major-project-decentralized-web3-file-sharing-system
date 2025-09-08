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
