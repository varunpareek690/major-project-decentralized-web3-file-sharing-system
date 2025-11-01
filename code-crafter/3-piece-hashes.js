const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function decodeBuffer(buffer) {
  let index = 0;
  let infoStart = null;
  let infoEnd = null;

  function parse() {
    if (index >= buffer.length) throw new Error("Unexpected end of buffer");

    const byte = buffer[index];
    const char = String.fromCharCode(byte);

    if (char === "i") {
      // integer
      index++;
      let numStr = "";
      while (index < buffer.length && buffer[index] !== 101)
        numStr += String.fromCharCode(buffer[index++]); // 'e'
      index++; // skip 'e'
      return parseInt(numStr, 10);
    } else if (byte >= 48 && byte <= 57) {
      // string
      let lenStr = "";
      while (
        index < buffer.length &&
        buffer[index] >= 48 &&
        buffer[index] <= 57
      )
        lenStr += String.fromCharCode(buffer[index++]);
      if (buffer[index++] !== 58)
        throw new Error("Invalid bencode string: missing ':'");
      const length = parseInt(lenStr, 10);
      const data = buffer.slice(index, index + length);
      index += length;
      return data;
    } else if (char === "l") {
      // list
      index++;
      const arr = [];
      while (index < buffer.length && buffer[index] !== 101) arr.push(parse());
      index++; // skip 'e'
      return arr;
    } else if (char === "d") {
      // dictionary
      index++;
      const obj = {};
      while (index < buffer.length && buffer[index] !== 101) {
        const keyBuffer = parse();
        const key = keyBuffer.toString("utf8");

        if (key === "info" && infoStart === null) {
          infoStart = index;
          obj[key] = parse();
          infoEnd = index;
        } else {
          obj[key] = parse();
        }
      }
      index++; // skip 'e'
      return obj;
    } else {
      throw new Error(`Invalid bencode at index ${index}`);
    }
  }

  const result = parse();
  return { result, infoStart, infoEnd };
}

function parseTorrent(filePath) {
  function splitPieces(piecesHex) {
    const hashes = [];
    for (let i = 0; i < piecesHex.length; i += 40) {
      hashes.push(piecesHex.slice(i, i + 40));
    }
    return hashes;
  }

  function convertBufferFields(obj) {
    if (Buffer.isBuffer(obj)) return obj.toString("utf8");
    if (Array.isArray(obj)) return obj.map(convertBufferFields);
    if (obj && typeof obj === "object") {
      const newObj = {};
      for (const key in obj) {
        if (Buffer.isBuffer(obj[key])) {
          if (key === "pieces") {
            newObj[key] = obj[key].toString("hex");
          } else {
            newObj[key] = obj[key].toString("utf8");
          }
        } else {
          newObj[key] = convertBufferFields(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  }

  const buffer = fs.readFileSync(filePath);
  const { result: torrent, infoStart, infoEnd } = decodeBuffer(buffer);

  // Compute info hash
  if (infoStart !== null && infoEnd !== null) {
    const infoBuffer = buffer.slice(infoStart, infoEnd);
    torrent.info_hash = crypto
      .createHash("sha1")
      .update(infoBuffer)
      .digest("hex");
  }

  const convertedTorrent = convertBufferFields(torrent);

  // Add additional fields
  if (convertedTorrent.info) {
    const piecesHex = convertedTorrent.info.pieces;
    convertedTorrent.pieceLength = convertedTorrent.info["piece length"];
    convertedTorrent.pieceHashes = splitPieces(piecesHex);
  }

  return convertedTorrent;
}

function displayTorrentJSON(torrent) {
  console.log("=== TORRENT JSON ===");
  console.log(JSON.stringify(torrent, null, 2));
}

// Example usage
try {
  const fileName = "ubuntu-25.10-desktop-amd64.iso.torrent";
  const filePath = path.join(__dirname, fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`File ${filePath} not found`);
    process.exit(1);
  }

  const torrent = parseTorrent(filePath);

  displayTorrentJSON(torrent);
} catch (error) {
  console.error("Error:", error.message);
}
