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
