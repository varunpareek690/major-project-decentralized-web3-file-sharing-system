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

