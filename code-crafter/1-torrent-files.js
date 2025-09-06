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
