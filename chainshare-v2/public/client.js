// --- 0. DOM Elements (Saare HTML elements ko pakadna) ---
document.addEventListener('DOMContentLoaded', () => {
  // Global state
  let myPeerId = null;
  let ws = null;
  let allFilesData = {}; // File size aur seeder count track karne ke liye

  // Status Bar
  const peerIdDisplay = document.getElementById('peer-id');
  const peerCountDisplay = document.getElementById('peer-count');

  // Section 1: Seed
  const seedFileInput = document.getElementById('seed-file-input');
  const seedButton = document.getElementById('seed-button');

  // Section 2: Tracker
  const trackerList = document.getElementById('tracker-list');

  // Section 3: Download (UPDATED)
  const magnetInput = document.getElementById('magnet-input');
  const torrentFileInput = document.getElementById('torrent-file-input');
  const downloadButton = document.getElementById('download-button');

  // Section 4: Active Downloads
  const downloadsList = document.getElementById('downloads-list');
  const noDownloads = document.getElementById('no-downloads');

  // Section 5: Logs
  const logsContainer = document.getElementById('logs-container');

  // --- 1. Helper Functions (Chhote-mote kaam) ---

  /**
   * Log box mein naya log add karta hai
   */
  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';

    let typeClass = '';
    if (type === 'success') typeClass = 'log-msg-success';
    else if (type === 'error') typeClass = 'log-msg-error';
    else if (type === 'info') typeClass = 'log-msg-info';

    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="${typeClass}">${message}</span>`;
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  /**
   * Bytes ko KB, MB, GB mein convert karta hai
   */
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Progress bar ke liye random color deta hai
   */
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /**
   * NEW: Clipboard copy "jugaad" jo non-secure (http) par bhi chalta hai
   */
  function copyToClipboard(text, buttonElement) {
    // 1. Naya tareeka (Secure contexts ke liye, jaise localhost)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => showCopySuccess(buttonElement))
        .catch((err) => fallbackCopy(text, buttonElement)); // Agar fail ho
    } else {
      // 2. Purana tareeka (Jugaad fallback - http IP address ke liye)
      fallbackCopy(text, buttonElement);
    }
  }

  function fallbackCopy(text, buttonElement) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Dikhna nahi chahiye
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showCopySuccess(buttonElement);
    } catch (err) {
      addLog('Failed to copy magnet link', 'error');
    }
    document.body.removeChild(textArea);
  }

  // Button ka text "Copied!" dikhata hai
  function showCopySuccess(buttonElement) {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = 'Copied!';
    buttonElement.classList.add('copied'); // CSS ke liye class
    setTimeout(() => {
      buttonElement.textContent = originalText;
      buttonElement.classList.remove('copied');
    }, 1500); // 1.5 sec baad wapas normal
  }

  // --- 2. Core Logic ---

  /**
   * Backend WebSocket se connect karta hai
   */
  function connectWebSocket() {
    const wsUrl = `ws://${window.location.host}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => addLog('🔗 Connected to ChainShare network', 'success');
    ws.onclose = () => {
      addLog('🔌 Disconnected from network. Reconnecting...', 'error');
      setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = (err) => {
      addLog('WebSocket error. See console.', 'error');
      console.error(err);
    };

    // Server se message receive karna
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        // --- BUG 1 FIX ---
        case 'YOUR_ID':
          myPeerId = msg.payload.peerId;
          peerIdDisplay.textContent = myPeerId; // <-- YEH LINE WAPAS ADD KAR DI HAI
          addLog(`Peer ID assigned: ${myPeerId}`, 'system'); // <-- Professional log
          break;
        // --- END BUG 1 FIX ---

        case 'PEER_UPDATE':
          addLog('Network topology changed. Peer list updated.', 'system'); // <-- Professional log
          peerCountDisplay.textContent = Object.keys(msg.payload.peers).length;
          updateTrackerList(msg.payload.files);
          break;

        case 'FILE_UPDATE':
          addLog('Tracker file index updated.', 'system'); // <-- Professional log
          updateTrackerList(msg.payload.files);
          break;
      }
    };
  }

  /**
   * File tracker table ko update karta hai (UPDATED)
   */
  function updateTrackerList(files) {
    trackerList.innerHTML = '';
    allFilesData = files; // Global state mein save kiya (size/seeder count ke liye)

    if (Object.keys(files).length === 0) {
      trackerList.innerHTML =
        '<tr><td colspan="4">No files found on the network. Seed one!</td></tr>';
      return;
    }

    for (const filename in files) {
      const file = files[filename];
      const row = document.createElement('tr');

      const seederCountStyle =
        file.seeders.length === 0 ? 'style="color: red;"' : '';

      row.innerHTML = `
        <td>${file.name}</td>
        <td>${formatBytes(file.size)}</td>
        <td ${seederCountStyle}>${file.seeders.length}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn" data-torrentname="${
              file.torrentName
            }">Download .torrent</button>
            <button class="action-btn copy-magnet-btn" data-magnetlink="${
              file.magnetLink
            }">Copy Magnet</button>
          </div>
        </td>
      `;
      trackerList.appendChild(row);
    }
  }

  /**
   * Seeding (File Upload) ko handle karta hai
   */
  async function handleSeedFile() {
    const file = seedFileInput.files[0];
    if (!file) return addLog('No file selected to seed', 'error');
    if (!myPeerId)
      return addLog('Not connected to network. Cannot seed.', 'error');

    seedButton.disabled = true;
    seedButton.textContent = 'Uploading...';
    addLog(`Seeding new file: ${file.name}`, 'info'); // <-- Professional log

    const formData = new FormData();
    formData.append('file', file);
    formData.append('peerId', myPeerId);

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      const result = await response.json();
      addLog(`File broadcast to tracker: ${result.file.name}`, 'success'); // <-- Professional log
    } catch (err) {
      addLog(`Failed to seed file: ${err.message}`, 'error');
    }

    seedButton.disabled = false;
    seedButton.textContent = '🌱 Seed File';
  }

  /**
   * Download (Fake Torrent/Magnet) ko handle karta hai (UPDATED)
   */
  async function handleStartDownload() {
    downloadButton.disabled = true;
    let realFilename = null;
    let seeders = []; // <-- Seeders ko yahan define kiya

    // --- NEW: Input check (Magnet ya File) ---
    const magnetLink = magnetInput.value.trim();
    const torrentFile = torrentFileInput.files[0];

    if (magnetLink) {
      // --- JUGAAD: Magnet Link "Parse" ---
      try {
        addLog(`Parsing magnet link...`, 'system'); // <-- Professional log
        const dnMatch = magnetLink.match(/&dn=([^&]+)/);
        if (!dnMatch || !dnMatch[1])
          throw new Error("Invalid magnet link (missing 'dn=')");
        realFilename = decodeURIComponent(dnMatch[1]);
        addLog(`Resolved filename: ${realFilename}`, 'info'); // <-- Professional log
      } catch (err)
      {
        addLog(`Failed to parse magnet link: ${err.message}`, 'error');
        downloadButton.disabled = false;
        return;
      }
    } else if (torrentFile) {
      // --- JUGAAD: .torrent File "Parse" ---
      try {
        addLog(`Reading .torrent metadata...`, 'system'); // <-- Professional log
        const fileContent = await torrentFile.text();
        const infoMatch = fileContent.match(/4:info(\d+):({.*})ee/);
        if (!infoMatch || !infoMatch[2])
          throw new Error('Invalid .torrent (metadata parsing failed)');
        const torrentData = JSON.parse(infoMatch[2]);
        if (!torrentData.filename)
          throw new Error('Invalid .torrent (missing filename)');
        realFilename = torrentData.filename;
        addLog(`Resolved filename: ${realFilename}`, 'info'); // <-- Professional log
      } catch (err) {
        addLog(`Failed to parse .torrent file: ${err.message}`, 'error');
        downloadButton.disabled = false;
        return;
      }
    } else {
      addLog('No magnet link or .torrent file provided', 'error');
      downloadButton.disabled = false;
      return;
    }

    // --- File validation ---
    if (!realFilename) {
      addLog('Could not determine filename to download', 'error');
      downloadButton.disabled = false;
      return;
    }

    addLog(`Checking tracker for file: ${realFilename}`, 'info');
    if (!allFilesData[realFilename]) {
      addLog(`File ${realFilename} not found in tracker database.`, 'error');
      downloadButton.disabled = false;
      return;
    }

    // --- Zero Seeder Logic ---
    seeders = allFilesData[realFilename].seeders; // <-- Seeders ko assign kiya
    if (!seeders || seeders.length === 0) {
      addLog(
        `File ${realFilename} has 0 seeders. Cannot download.`,
        'error'
      );
      downloadButton.disabled = false;
      return;
    }

    addLog(`Tracker returned ${seeders.length} peers: ${seeders.join(', ')}`, 'success'); // <-- Professional log

    // --- UI BANANE KA KAAM ---
    noDownloads.style.display = 'none';
    const downloadId = `download-${Date.now()}`;
    const fileData = allFilesData[realFilename];

    const downloadItem = document.createElement('div');
    downloadItem.className = 'download-item';
    downloadItem.innerHTML = `
      <div class="download-item-title">${realFilename}</div>
      <div class="progress-bar-container" id="bar-${downloadId}"></div>
      <div class="download-info" id="info-${downloadId}">Starting download...</div>
    `;
    downloadsList.appendChild(downloadItem);

    // --- JUGAAD 3 (Animation Logic) ---
    const progressBar = document.getElementById(`bar-${downloadId}`);
    const infoDisplay = document.getElementById(`info-${downloadId}`);
    const segmentTargets = [];
    let remainingPercent = 100;

    for (let i = 0; i < seeders.length; i++) {
      const segment = document.createElement('div');
      segment.className = 'progress-segment';
      segment.dataset.peer = seeders[i];

      let targetWidth = 0;
      if (i === seeders.length - 1) {
        targetWidth = remainingPercent;
      } else {
        targetWidth =
          Math.random() * (remainingPercent / (seeders.length - i) * 1.5);
      }
      segmentTargets.push(targetWidth);
      segment.style.width = '0%';
      segment.textContent = seeders[i];
      progressBar.appendChild(segment);
      remainingPercent -= targetWidth;
    }

    // --- ASLI DOWNLOAD (using XMLHttpRequest for progress) ---
    addLog(`Initiating connections to ${seeders.length} peers...`, 'info'); // <-- Professional log

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/download/${encodeURIComponent(realFilename)}`);
    xhr.responseType = 'blob';

    xhr.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const totalPercent = e.loaded / e.total;
        const segments = progressBar.querySelectorAll('.progress-segment');
        segments.forEach((segment, index) => {
          const target = segmentTargets[index];
          const currentWidth = target * totalPercent;
          segment.style.width = `${currentWidth}%`;
        });
        infoDisplay.textContent = `Downloading... ${(totalPercent * 100).toFixed(
          0
        )}% (${formatBytes(e.loaded)} / ${formatBytes(e.total)})`;
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        addLog(`Download complete: ${realFilename}`, 'success'); // <-- Professional log
        const segments = progressBar.querySelectorAll('.progress-segment');
        segments.forEach((segment, index) => {
          segment.style.width = `${segmentTargets[index]}%`;
          segment.textContent = `${seeders[index]} (100%)`;
        });
        infoDisplay.textContent = `Completed (${formatBytes(xhr.response.size)})`;

        const url = URL.createObjectURL(xhr.response);
        const a = document.createElement('a');
        a.href = url;
        a.download = realFilename;
        a.click();
        URL.revokeObjectURL(url);

        ws.send(
          JSON.stringify({
            type: 'DOWNLOAD_COMPLETE',
            payload: { filename: realFilename },
          })
        );
        addLog(`File download complete. Now seeding: ${realFilename}`, 'success'); // <-- Professional log
      } else {
        addLog(`Download failed: ${xhr.statusText}`, 'error');
        infoDisplay.textContent = `Error: ${xhr.statusText}`;
      }
      downloadButton.disabled = false;
      magnetInput.value = ''; // Clear inputs
      torrentFileInput.value = ''; // Clear inputs
    };

    xhr.onerror = () => {
      addLog('Network error during download', 'error');
      infoDisplay.textContent = `Error: Network failed`;
      downloadButton.disabled = false;
    };

    xhr.send();
    // --- BUG 2 FIX: 'Suchar;' line yahan se HATA di gayi hai ---
  }

  // --- 3. Event Listeners (Buttons ko chalu karna) ---

  // Page load hote hi WebSocket connect karo
  connectWebSocket();

  // Seeder button
  seedButton.addEventListener('click', handleSeedFile);

  // Download button
  downloadButton.addEventListener('click', handleStartDownload);

  // Tracker list mein "Download .torrent" aur "Copy Magnet" (UPDATED)
  trackerList.addEventListener('click', (e) => {
    const target = e.target;

    // ".torrent" button click
    if (target.classList.contains('action-btn') && target.dataset.torrentname) {
      const torrentName = target.dataset.torrentname;
      addLog(`Requesting .torrent file: ${torrentName}`, 'system'); // <-- Professional log
      window.location.href = `/api/torrent/${torrentName}`;
    }

    // "Copy Magnet" button click
    if (
      target.classList.contains('copy-magnet-btn') &&
      target.dataset.magnetlink
    ) {
      const magnetLink = target.dataset.magnetlink;
      copyToClipboard(magnetLink, target); // Naya "jugaad" copy function
    }
  });
});