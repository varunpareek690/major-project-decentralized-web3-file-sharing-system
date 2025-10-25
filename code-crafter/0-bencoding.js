// Encode functions
function encode(data) {
  if (typeof data === "number") {
    return `i${data}e`;
  } else if (typeof data === "string") {
    return `${Buffer.byteLength(data, "utf8")}:${data}`;
  } else if (Array.isArray(data)) {
    return `l${data.map(encode).join("")}e`;
  } else if (typeof data === "object" && data !== null) {
    // Dictionary keys must be sorted
    const keys = Object.keys(data).sort();
    return `d${keys.map(k => encode(k) + encode(data[k])).join("")}e`;
  } else {
    throw new Error("Unsupported data type");
  }
}

// Decode functions
function decode(input) {
  let index = 0;

  function parse() {
    if (input[index] === "i") {
      index++;
      let end = input.indexOf("e", index);
      let number = parseInt(input.slice(index, end), 10);
      index = end + 1;
      return number;
    } else if (/\d/.test(input[index])) {
      let colon = input.indexOf(":", index);
      let length = parseInt(input.slice(index, colon), 10);
      let start = colon + 1;
      let str = input.slice(start, start + length);
      index = start + length;
      return str;
    } else if (input[index] === "l") {
      index++;
      let arr = [];
      while (input[index] !== "e") arr.push(parse());
      index++;
      return arr;
    } else if (input[index] === "d") {
      index++;
      let obj = {};
      while (input[index] !== "e") {
        let key = parse();
        let value = parse();
        obj[key] = value;
      }
      index++;
      return obj;
    } else {
      throw new Error("Invalid bencode format at index " + index);
    }
  }

  return parse();
}

// --- Example Usage ---

const data = {
  announce: "http://tracker.example.com",
  info: {
    name: "myfile.txt",
    length: 12345
  },
  files: ["file1.txt", "file2.txt"]
};

// Encode
const bencoded = encode(data);
console.log("Bencoded Data:\n", bencoded);

// Decode
const decoded = decode(bencoded);
console.log("\nDecoded Data:\n", decoded);
