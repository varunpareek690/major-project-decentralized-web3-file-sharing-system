import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// --- 1. Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const DB_PATH = path.join(__dirname, 'database.json');
const UPLOAD_PATH = path.join(__dirname, 'uploads');
const HISTORY_PATH = path.join(__dirname, 'history.json'); // <-- NEW: History file path

// --- 2. Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(fileUpload());

// --- 3. Database Helper Functions ---
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data) || { peers: {}, files: {} };
  } catch (error) {
    return { peers: {}, files: {} };
  }
}

async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// --- NEW: History Helper Functions ---
async function readHistory() {
  try {
    const data = await fs.readFile(HISTORY_PATH, 'utf-8');
    return JSON.parse(data) || {};
  } catch (error) {
    return {};
  }
}

async function writeHistory(data) {
  await fs.writeFile(HISTORY_PATH, JSON.stringify(data, null, 2));
}

// --- 4. WebSocket Logic (Peer Management) ---
const clients = new Map();

function broadcast(message) {
  for (const client of clients.values()) {
    client.ws.send(JSON.stringify(message));
  }
}

wss.on('connection', async (ws, req) => {
  // Peer ID ko IP se banaya
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const peerId = `Peer-${crypto
    .createHash('md5')
    .update(ip)
    .digest('hex')
    .substring(0, 6)}`;

  clients.set(peerId, { ws });
  console.log(`[Server] Peer connect hua: ${peerId} (IP: ${ip})`);

  let db = await readDB();
  db.peers[peerId] = { status: 'online', joinedAt: new Date().toISOString() };
  
  // --- NEW: History Logic (Aapka Idea) ---
  const history = await readHistory();
  let filesUpdated = false;

  if (history[peerId]) {
    console.log(`[Server] Peer ${peerId} wapas aaya hai. History check ki ja rahi hai...`);
    const filesOwnedByPeer = history[peerId]; // Jaise ['file1.txt', 'file2.mp4']
    
    for (const filename of filesOwnedByPeer) {
      // Check karo ki file abhi bhi database mein hai
      if (db.files[filename]) {
        // Check karo ki peer seeder list mein nahi hai
        if (!db.files[filename].seeders.includes(peerId)) {
          // Peer ko seeder list mein wapas add karo
          db.files[filename].seeders.push(peerId);
          filesUpdated = true;
          console.log(`[Server] Peer ${peerId} ko ${filename} ke liye seeder mark kiya.`);
        }
      }
    }
  }
  // --- END History Logic ---

  await writeDB(db); // Pehle DB save karo

  ws.send(JSON.stringify({ type: 'YOUR_ID', payload: { peerId } }));

  // Sabko poori list bhejo (connection ke time)
  broadcast({
    type: 'PEER_UPDATE',
    payload: { peers: db.peers, files: db.files },
  });

  // Agar history ke kaaran files update hui hain, toh ek aur update bhejo
  if (filesUpdated) {
    broadcast({
      type: 'FILE_UPDATE',
      payload: { files: db.files },
    });
  }

  // Jab peer message bheje
  ws.on('message', async (message) => {
    const { type, payload } = JSON.parse(message.toString());

    if (type === 'DOWNLOAD_COMPLETE') {
      const { filename } = payload;
      let db = await readDB();
      if (db.files[filename] && !db.files[filename].seeders.includes(peerId)) {
        console.log(
          `[Server] Peer ${peerId} ab ${filename} ko seed kar raha hai.`
        );
        db.files[filename].seeders.push(peerId);
        await writeDB(db);

        // --- NEW: History Update (Download) ---
        const history = await readHistory();
        if (!history[peerId]) {
          history[peerId] = []; // Naya peer hai toh array banaya
        }
        if (!history[peerId].includes(filename)) {
          history[peerId].push(filename); // File ko history mein add kiya
          await writeHistory(history);
          console.log(`[Server] Peer ${peerId} ki history mein ${filename} add kiya.`);
        }
        // --- END History Update ---

        broadcast({
          type: 'FILE_UPDATE',
          payload: { files: db.files },
        });
      }
    }
  });

  // Jab peer disconnect ho
  ws.on('close', async () => {
    clients.delete(peerId);
    console.log(`[Server] Peer disconnect hua: ${peerId}`);
    const db = await readDB();
    delete db.peers[peerId]; // Online list se hataya
    
    // Sabhi files ki 'seeders' list se hataya
    for (const filename in db.files) {
      db.files[filename].seeders = db.files[filename].seeders.filter(
        (id) => id !== peerId
      );
    }
    await writeDB(db);
    
    // History se nahi hataya!

    broadcast({
      type: 'PEER_UPDATE',
      payload: { peers: db.peers, files: db.files },
    });
  });
});

// --- 5. API Endpoints (UPDATED) ---

// API 1: Seeding (File Upload)
app.post('/api/seed', async (req, res) => {
  if (!req.files || !req.files.file || !req.body.peerId) {
    return res.status(400).json({ error: 'File ya peerId missing hai' });
  }

  const { file } = req.files;
  const { peerId } = req.body;
  const filePath = path.join(UPLOAD_PATH, file.name);

  try {
    await file.mv(filePath);

    const torrentName = file.name.replace(/ /g, '.') + '.torrent';
    const fakeHash = crypto
      .createHash('sha1')
      .update(file.name + Date.now())
      .digest('hex');
    const displayName = encodeURIComponent(file.name);
    const tracker = encodeURIComponent(`http://localhost:${PORT}/announce`);
    const magnetLink = `magnet:?xt=urn:btih:${fakeHash}&dn=${displayName}&tr=${tracker}`;

    const db = await readDB();
    db.files[file.name] = {
      name: file.name,
      size: file.size,
      seeders: [peerId],
      torrentName: torrentName,
      magnetLink: magnetLink,
    };
    await writeDB(db);

    // --- NEW: History Update (Seed) ---
    const history = await readHistory();
    if (!history[peerId]) {
      history[peerId] = [];
    }
    if (!history[peerId].includes(file.name)) {
      history[peerId].push(file.name);
      await writeHistory(history);
      console.log(`[Server] Peer ${peerId} ki history mein ${file.name} (seed) add kiya.`);
    }
    // --- END History Update ---

    broadcast({
      type: 'FILE_UPDATE',
      payload: { files: db.files },
    });

    res.json({ message: 'File seeded successfully!', file: db.files[file.name] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API 2: List Files
app.get('/api/files', async (req, res) => {
  const db = await readDB();
  res.json(db.files);
});

// API 3: "Bencoded" Torrent File Download
app.get('/api/torrent/:torrentName', async (req, res) => {
  const { torrentName } = req.params;
  const db = await readDB();
  let fileData = null;
  for (const key in db.files) {
    if (db.files[key].torrentName === torrentName) {
      fileData = db.files[key];
      break;
    }
  }
  if (!fileData) {
    return res.status(404).send('Torrent not found in DB');
  }
  const infoDict = {
    filename: fileData.name,
    size: fileData.size,
  };
  const infoString = JSON.stringify(infoDict);
  const fakeTrackerUrl = `http://localhost:${PORT}/announce`;
  const bencodedContent = `d8:announce${fakeTrackerUrl.length}:${fakeTrackerUrl}10:created by16:ChainShare-Jugaad4:info${infoString.length}:${infoString}ee`;

  res.setHeader('Content-Disposition', `attachment; filename="${torrentName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(bencodedContent);
});

// API 4: Asli File Download
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOAD_PATH, filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// API 5: File ke Seeders ki list
app.get('/api/file-seeders/:filename', async (req, res) => {
  const { filename } = req.params;
  const db = await readDB();
  if (db.files[filename]) {
    res.json({ seeders: db.files[filename].seeders });
  } else {
    res.status(404).json({ error: 'File not found in database' });
  }
});

// --- 6. Server Start ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[Server] 🚀 Hamara "Jugaad" Server http://localhost:${PORT} par chal raha hai.`
  );
  console.log(
    `[Server] Network par yahan available hai (dusre laptops ke liye): http://[Aapka-IP-Address]:${PORT}`
  );
});