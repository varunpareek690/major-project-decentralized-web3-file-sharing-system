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
