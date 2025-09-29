const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function decodeBuffer(buffer) {
  let index = 0;
  let infoStart = null;
  let infoEnd = null;

  function parse() {
