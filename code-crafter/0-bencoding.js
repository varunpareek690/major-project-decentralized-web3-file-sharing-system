// Encode functions
function encode(data) {
  if (typeof data === "number") {
    return `i${data}e`;
  } else if (typeof data === "string") {
    return `${Buffer.byteLength(data, "utf8")}:${data}`;
  } else if (Array.isArray(data)) {
