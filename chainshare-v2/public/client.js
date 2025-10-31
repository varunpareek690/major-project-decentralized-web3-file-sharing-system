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
