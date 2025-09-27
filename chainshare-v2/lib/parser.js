import parseTorrent from 'parse-torrent';
import fs from 'fs-extra';

function piecesToHexArray(piecesBuffer) {
  const out = [];
  if (!piecesBuffer) return out;
  for (let i = 0; i < piecesBuffer.length; i += 20) {
    out.push(piecesBuffer.slice(i, i + 20).toString('hex'));
  }
  return out;
