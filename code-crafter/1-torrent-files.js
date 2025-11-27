const fs = require('fs');
const path = require('path');

function decodeBuffer(buffer) {
    let index = 0;

    function parse() {
        if (index >= buffer.length) {
            throw new Error("Unexpected end of buffer");
        }

        const byte = buffer[index];
        const char = String.fromCharCode(byte);

        if (char === 'i') { // integer
            index++;
            let numStr = '';
            while (index < buffer.length && buffer[index] !== 101) { // 'e'
                numStr += String.fromCharCode(buffer[index]);
                index++;
            }
            if (index >= buffer.length || buffer[index] !== 101) {
                throw new Error("Invalid bencode integer: missing 'e'");
            }
            index++;
            return parseInt(numStr, 10);
        } else if (byte >= 48 && byte <= 57) { // '0' to '9'
            let lengthStr = '';
            while (index < buffer.length && buffer[index] >= 48 && buffer[index] <= 57) {
                lengthStr += String.fromCharCode(buffer[index]);
                index++;
            }
            if (index >= buffer.length || buffer[index] !== 58) {
                throw new Error(`Invalid bencode string: missing ':' at index ${index}`);
            }
            const length = parseInt(lengthStr, 10);
            index++; // skip ':'
            const start = index;
            const end = start + length;
            if (end > buffer.length) {
                throw new Error(`String length ${length} exceeds buffer bounds`);
            }
            const data = buffer.slice(start, end);
            index = end;
            return data;
        } else if (char === 'l') { // list
            index++;
            const arr = [];
            while (index < buffer.length && buffer[index] !== 101) {
                arr.push(parse());
            }
            if (index >= buffer.length || buffer[index] !== 101) {
                throw new Error("Invalid bencode list: missing 'e'");
            }
            index++;
            return arr;
        } else if (char === 'd') { // dictionary
            index++;
            const obj = {};
            while (index < buffer.length && buffer[index] !== 101) {
                const keyBuffer = parse();
                if (!Buffer.isBuffer(keyBuffer)) {
                    throw new Error("Dictionary key must be a string");
                }
                const key = keyBuffer.toString('utf8');
                obj[key] = parse();
            }
            if (index >= buffer.length || buffer[index] !== 101) {
                throw new Error("Invalid bencode dictionary: missing 'e'");
            }
            index++;
            return obj;
        } else {
            throw new Error(`Invalid bencode format at index ${index} (char='${char}', byte=${byte}). Expected 'i', 'l', 'd', or digit.`);
        }
    }

    return parse();
}

function parseTorrent(filePath) {
    const buffer = fs.readFileSync(filePath);
    const torrent = decodeBuffer(buffer);

    function convertBufferFields(obj) {
        if (Buffer.isBuffer(obj)) return obj.toString('utf8');
        if (Array.isArray(obj)) return obj.map(convertBufferFields);
        if (obj && typeof obj === 'object') {
            const newObj = {};
            for (const key in obj) {
                if (Buffer.isBuffer(obj[key])) {
                    // Special case: pieces field to hex
                    if (key === 'pieces') {
                        newObj[key] = obj[key].toString('hex');
                    } else {
                        newObj[key] = obj[key].toString('utf8');
                    }
                } else {
                    newObj[key] = convertBufferFields(obj[key]);
                }
            }
            return newObj;
        }
        return obj;
    }

    return convertBufferFields(torrent);
}

function displayTorrentJSON(torrent) {
    console.log("=== TORRENT JSON ===");
    console.log(JSON.stringify(torrent, null, 2));
}

// Example usage
try {
    const fileName = 'ubuntu-25.10-desktop-amd64.iso.torrent';
    const filePath = path.join(__dirname, fileName);

    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} not found`);
        process.exit(1);
    }

    console.log(`Parsing torrent file: ${filePath}`);
    const torrent = parseTorrent(filePath);
    displayTorrentJSON(torrent);

} catch (error) {
    console.error('Error parsing torrent file:', error.message);
}