const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function decodeBuffer(buffer) {
    let index = 0;
    let infoStart = null;
    let infoEnd = null;

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

                if (key === 'info' && infoStart === null) {
