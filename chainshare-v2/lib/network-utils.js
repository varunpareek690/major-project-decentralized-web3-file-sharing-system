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

