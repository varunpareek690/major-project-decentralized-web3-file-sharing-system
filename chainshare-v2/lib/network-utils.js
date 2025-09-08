import os from 'os';

/**
 * Get all network interfaces with their addresses
 * @returns {Array<{name: string, address: string, family: string, internal: boolean, mac: string}>}
 */
export function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const result = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;

    for (const addr of addrs) {
      // Only include IPv4 addresses
      if (addr.family === 'IPv4') {
        result.push({
          name,
          address: addr.address,
          family: addr.family,
          internal: addr.internal,
          mac: addr.mac
        });
      }
    }
  }

  return result;
}

/**
 * Get the primary non-loopback IPv4 address (usually WLAN)
 * @returns {string|null}
 */
export function getPrimaryAddress() {
  const interfaces = getNetworkInfo();
  
  // Filter out loopback and internal interfaces
  const external = interfaces.filter(iface => !iface.internal);
  
  if (external.length === 0) {
    return null;
  }

  // Prefer wireless interfaces
  const wireless = external.find(iface => 
    iface.name.toLowerCase().includes('wlan') ||
    iface.name.toLowerCase().includes('wi-fi') ||
    iface.name.toLowerCase().includes('wifi')
  );

  if (wireless) {
    return wireless.address;
  }

  // Return first non-loopback address
  return external[0].address;
}

/**
 * Generate tracker URLs for all available network interfaces
 * @param {number} port - Tracker port
 * @returns {string[]}
 */
export function getTrackerUrls(port = 8000) {
  const interfaces = getNetworkInfo();
  const urls = [];
