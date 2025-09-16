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

  for (const iface of interfaces) {
    if (!iface.internal) {
      urls.push(`http://${iface.address}:${port}/announce`);
    }
  }

  return urls;
}

/**
 * Check if an address is on the local network
 * @param {string} address - IP address to check
 * @returns {boolean}
 */
export function isLocalNetwork(address) {
  // Check for private IP ranges
  const parts = address.split('.').map(Number);
  
  if (parts[0] === 10) return true; // 10.0.0.0/8
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
  if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
  if (parts[0] === 127) return true; // Loopback
  
  return false;
}

/**
 * Get hostname
 * @returns {string}
 */
export function getHostname() {
  return os.hostname();
}

/**
 * Display network configuration info
 */
export function displayNetworkInfo() {
  const interfaces = getNetworkInfo();
  const primary = getPrimaryAddress();
  const hostname = getHostname();

  console.log('╔════════════════════════════════════════╗');
  console.log('║        Network Configuration          ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n🖥️  Hostname: ${hostname}`);
  console.log(`📍 Primary IP: ${primary || 'Not found'}\n`);

  console.log('📡 Available Interfaces:');
  interfaces.forEach(iface => {
