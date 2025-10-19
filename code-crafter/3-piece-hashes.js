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
