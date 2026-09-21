// Entry point for deployment platforms (such as Hostinger Node.js Web Apps)
// that automatically detect and execute server.js
import fs from 'fs';
import path from 'path';

const bundledServer = path.resolve(process.cwd(), 'dist', 'server.cjs');

if (!fs.existsSync(bundledServer)) {
  console.error('[Error] dist/server.cjs not found. Please ensure the build command "npm run build" ran successfully.');
  process.exit(1);
}

// Load the compiled and bundled production server
await import('./dist/server.cjs');
