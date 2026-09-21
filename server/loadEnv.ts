import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Determine base directory safely in both ESM and CJS environments
const currentDir = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

// Candidate paths where .env might exist across different hosting environments (including Hostinger)
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env.production'),
  path.resolve(currentDir, '.env'),
  path.resolve(currentDir, '..', '.env'),
  path.resolve(currentDir, '..', '..', '.env'),
];

let envLoaded = false;
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    try {
      dotenv.config({ path: envPath });
      console.log(`[Maxpack ERP] Successfully loaded environment configuration from: ${envPath}`);
      envLoaded = true;
      break;
    } catch (e: any) {
      console.warn(`[Maxpack ERP] Failed to parse .env at ${envPath}:`, e.message);
    }
  }
}

if (!envLoaded) {
  // Fallback to standard dotenv.config()
  dotenv.config();
}

export function getLoadedEnvStatus() {
  return {
    envLoaded,
    hasSheetsId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    hasServiceEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    hasServiceJson: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  };
}
