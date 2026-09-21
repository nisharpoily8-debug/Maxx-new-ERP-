// Entry point for deployment platforms (such as Hostinger Node.js Web Apps)
// that automatically detect and execute server.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Ensure production environment when started via Hostinger entry point
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly for Hostinger environment
try {
  const dotenv = await import('dotenv');
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.default.config({ path: envPath });
    console.log('[Hostinger Deployment] Loaded .env configuration file.');
  } else {
    dotenv.default.config();
  }
} catch (e) {
  // ignore
}

const bundledServer = path.resolve(__dirname, 'dist', 'server.cjs');
const indexHtml = path.resolve(__dirname, 'dist', 'index.html');

// If dist/server.cjs or dist/index.html is missing (e.g. fresh Hostinger Git deploy),
// automatically run the build command
if (!fs.existsSync(bundledServer) || !fs.existsSync(indexHtml)) {
  console.log('[Hostinger Deployment] dist/server.cjs not found. Triggering automated build (npm run build)...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('[Hostinger Deployment] Build succeeded.');
  } catch (err) {
    console.error('[Hostinger Deployment Error] Automatic build failed:', err);
    process.exit(1);
  }
}

// Load the compiled and bundled production server
await import('./dist/server.cjs');
