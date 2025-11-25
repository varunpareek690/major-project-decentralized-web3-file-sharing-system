import {startTracker} from '../lib/tracker-server.js';

const port = process.env.TRACKER_PORT ? parseInt(process.env.TRACKER_PORT,10) : 8000;
const server = startTracker({ port });

process.on('SIGINT', async () => {
  console.log('Shutting down tracker...');
  try {
    server.close(() => process.exit(0));
  } catch (e) { process.exit(0); }
});
