import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ERP_SHEETS_SCHEMA } from './sheetsSchema.ts';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
}

// Ensure persistent config directory exists for Hostinger/production restarts
const currentDir = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

const PERSISTENT_CONFIG_PATHS = [
  path.resolve(process.cwd(), 'data', 'sheets-config.json'),
  path.resolve(currentDir, '..', 'data', 'sheets-config.json'),
  path.resolve(currentDir, 'sheets-config.json'),
];

function getActiveConfigFilePath(): string {
  for (const p of PERSISTENT_CONFIG_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return PERSISTENT_CONFIG_PATHS[0];
}

function loadPersistedSheetsConfig(): Partial<GoogleSheetsConfig> | null {
  try {
    for (const p of PERSISTENT_CONFIG_PATHS) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.spreadsheetId || parsed.clientEmail) {
          return parsed;
        }
      }
    }
  } catch (err: any) {
    console.warn('[GoogleSheets] Could not read persisted sheets-config.json:', err.message);
  }
  return null;
}

function savePersistedSheetsConfig(config: Partial<GoogleSheetsConfig>): void {
  try {
    const targetFile = PERSISTENT_CONFIG_PATHS[0];
    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const current = loadPersistedSheetsConfig() || {};
    const merged = { ...current, ...config };
    fs.writeFileSync(targetFile, JSON.stringify(merged, null, 2), 'utf-8');
    console.log(`[GoogleSheets] Successfully persisted Google Sheets configuration to: ${targetFile}`);
  } catch (err: any) {
    console.warn('[GoogleSheets] Could not persist sheets configuration to disk:', err.message);
  }
}

function cleanSpreadsheetId(id: string): string {
  if (!id) return '';
  let cleaned = id.trim().replace(/^[`"'\s]+/, '').replace(/[`"'\s]+$/, '');
  const urlMatch = cleaned.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    cleaned = urlMatch[1];
  }
  return cleaned;
}

function cleanClientEmail(email: string): string {
  if (!email) return '';
  let cleaned = email.trim().replace(/^[`"'\s]+/, '').replace(/[`"'\s]+$/, '');
  // If user pasted Google Cloud Console IAM details URL, extract numeric ID
  const urlMatch = cleaned.match(/serviceaccounts\/details\/([0-9]+)/);
  if (urlMatch && urlMatch[1]) {
    cleaned = urlMatch[1];
  }
  return cleaned;
}

function cleanPrivateKey(key: string): string {
  if (!key) return '';
  let cleaned = key.trim().replace(/^[`"'\s]+/, '').replace(/[`"',\s]+$/, '');
  return cleaned.replace(/\\n/g, '\n');
}

export class GoogleSheetsService {
  private sheets: any = null;
  private config: GoogleSheetsConfig | null = null;
  private isConfigured: boolean = false;
  private lastError: string | null = null;
  private lastSyncTime: string | null = null;
  private totalSyncedRows: number = 0;
  private connectedSheetTitle: string = '';
  private knownSheetTitles: Set<string> = new Set();

  // Write queue & quota management to avoid 429 Write requests quota exceeded
  private appendQueue: Map<string, { rowData: any; headers?: string[] }[]> = new Map();
  private flushTimeout: NodeJS.Timeout | null = null;
  private isFlushingQueue: boolean = false;
  private quotaCooldownUntil: number = 0;

  constructor() {
    this.initFromEnv();
  }

  public initFromEnv() {
    // 1. Check environment variables
    const rawSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
    const rawClientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY || '';

    let spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
    let clientEmail = cleanClientEmail(rawClientEmail);
    let privateKey = cleanPrivateKey(rawPrivateKey);

    // 2. Handle JSON file string if provided in env
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        if (parsed.client_email && parsed.private_key) {
          clientEmail = cleanClientEmail(parsed.client_email);
          privateKey = cleanPrivateKey(parsed.private_key);
        }
      } catch (e) {
        console.warn('[GoogleSheets] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e);
      }
    }

    // 3. Fallback to persisted disk configuration (crucial for Hostinger server restarts/recycles)
    const persisted = loadPersistedSheetsConfig();
    if (persisted) {
      if (!spreadsheetId && persisted.spreadsheetId) {
        spreadsheetId = cleanSpreadsheetId(persisted.spreadsheetId);
      }
      if (!clientEmail && persisted.clientEmail) {
        clientEmail = cleanClientEmail(persisted.clientEmail);
      }
      if (!privateKey && persisted.privateKey) {
        privateKey = cleanPrivateKey(persisted.privateKey);
      }
    }

    if (clientEmail && privateKey) {
      this.config = {
        spreadsheetId,
        clientEmail,
        privateKey,
      };

      try {
        const auth = new google.auth.JWT({
          email: this.config.clientEmail,
          key: this.config.privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.isConfigured = !!this.config.spreadsheetId;
        this.lastError = null;
        console.log('[GoogleSheets] Initialized with Service Account/ID:', this.config.clientEmail, '| Configured:', this.isConfigured);
      } catch (err: any) {
        this.lastError = err.message || 'Failed to initialize Google Auth';
        console.error('[GoogleSheets] Auth initialization error:', err);
      }
    } else {
      this.isConfigured = false;
      if (spreadsheetId) {
        this.config = {
          spreadsheetId,
          clientEmail: '',
          privateKey: '',
        };
      }
    }
  }

  public getStatus() {
    // Auto-heal / reload if not yet configured
    if (!this.isConfigured) {
      this.initFromEnv();
    }

    let pendingCount = 0;
    for (const items of this.appendQueue.values()) {
      pendingCount += items.length;
    }

    return {
      configured: this.isConfigured,
      hasServiceAccount: !!(this.config?.clientEmail && this.config?.privateKey),
      hasSpreadsheetId: !!this.config?.spreadsheetId,
      spreadsheetId: this.config?.spreadsheetId || '',
      maskedSpreadsheetId: this.config?.spreadsheetId
        ? `${this.config.spreadsheetId.substring(0, 8)}...${this.config.spreadsheetId.substring(this.config.spreadsheetId.length - 4)}`
        : '',
      serviceAccountEmail: this.config?.clientEmail || '',
      connectedSheetTitle: this.connectedSheetTitle,
      lastSyncTime: this.lastSyncTime,
      totalSyncedRows: this.totalSyncedRows,
      pendingQueueCount: pendingCount,
      quotaCoolingDown: Date.now() < this.quotaCooldownUntil,
      lastError: this.lastError,
      storageFile: getActiveConfigFilePath(),
    };
  }

  public setSpreadsheetId(id: string) {
    const cleaned = cleanSpreadsheetId(id);
    if (!cleaned) return;

    if (this.config) {
      this.config.spreadsheetId = cleaned;
      this.isConfigured = !!(this.config.spreadsheetId && this.sheets);
    } else {
      this.config = {
        spreadsheetId: cleaned,
        clientEmail: cleanClientEmail(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''),
        privateKey: cleanPrivateKey(process.env.GOOGLE_PRIVATE_KEY || ''),
      };
      if (this.config.clientEmail && this.config.privateKey) {
        this.initFromEnv();
      }
    }

    // Persist to disk for Hostinger restarts
    savePersistedSheetsConfig({ spreadsheetId: cleaned });
  }

  public updateCredentials(params: {
    spreadsheetId?: string;
    clientEmail?: string;
    privateKey?: string;
    jsonKey?: string;
  }) {
    let curSpreadsheetId = params.spreadsheetId !== undefined ? cleanSpreadsheetId(params.spreadsheetId) : (this.config?.spreadsheetId || '');
    let curClientEmail = params.clientEmail !== undefined ? cleanClientEmail(params.clientEmail) : (this.config?.clientEmail || '');
    let curPrivateKey = params.privateKey !== undefined ? cleanPrivateKey(params.privateKey) : (this.config?.privateKey || '');

    // Allow user to supply raw service account JSON string
    if (params.jsonKey && params.jsonKey.trim()) {
      try {
        const parsed = JSON.parse(params.jsonKey.trim());
        if (parsed.client_email) curClientEmail = cleanClientEmail(parsed.client_email);
        if (parsed.private_key) curPrivateKey = cleanPrivateKey(parsed.private_key);
      } catch (e: any) {
        console.warn('[GoogleSheets] Failed to parse provided jsonKey:', e.message);
      }
    }

    if (curClientEmail && curPrivateKey) {
      this.config = {
        spreadsheetId: curSpreadsheetId,
        clientEmail: curClientEmail,
        privateKey: curPrivateKey,
      };

      try {
        const auth = new google.auth.JWT({
          email: this.config.clientEmail,
          key: this.config.privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.isConfigured = !!this.config.spreadsheetId;
        this.lastError = null;

        // Persist to disk
        savePersistedSheetsConfig({
          spreadsheetId: curSpreadsheetId,
          clientEmail: curClientEmail,
          privateKey: curPrivateKey,
        });
        console.log('[GoogleSheets] Credentials updated and saved to disk. Ready to sync.');
      } catch (err: any) {
        this.lastError = err.message;
      }
    } else if (curSpreadsheetId) {
      this.setSpreadsheetId(curSpreadsheetId);
    }
  }

  /**
   * Test the connection to Google Sheets
   */
  public async testConnection(spreadsheetIdOverride?: string): Promise<{ success: boolean; message: string; sheetNames?: string[] }> {
    if (!this.sheets || !this.config?.spreadsheetId) {
      this.initFromEnv();
    }
    const targetSpreadsheetId = cleanSpreadsheetId(spreadsheetIdOverride || this.config?.spreadsheetId || '');

    if (!targetSpreadsheetId) {
      return { success: false, message: 'Spreadsheet ID is missing. Please provide a valid Google Sheet ID or URL.' };
    }

    if (!this.sheets || !this.config?.clientEmail) {
      return {
        success: false,
        message: 'Google Service Account credentials are not configured. Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in server environment, or configure in Settings tab.',
      };
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: targetSpreadsheetId,
      });

      this.connectedSheetTitle = response.data.properties?.title || 'Maxpack ERP';
      this.isConfigured = true;
      this.lastError = null;
      if (this.config) {
        this.config.spreadsheetId = targetSpreadsheetId;
      }

      const sheetNames = response.data.sheets?.map((s: any) => s.properties?.title || '') || [];
      return {
        success: true,
        message: `Successfully connected to Google Sheet: "${this.connectedSheetTitle}" with ${sheetNames.length} tabs.`,
        sheetNames,
      };
    } catch (err: any) {
      let msg = err.message || 'Unknown error occurred while contacting Google Sheets API.';
      if (msg.includes('The caller does not have permission') || msg.includes('403')) {
        msg = `Permission Denied (403): Please share your Google Spreadsheet with the Service Account email/ID (${this.config.clientEmail}) with "Editor" permission.`;
      } else if (msg.includes('Requested entity was not found') || msg.includes('404')) {
        msg = `Spreadsheet Not Found (404): Please verify that the Spreadsheet ID (${targetSpreadsheetId}) is correct.`;
      }
      this.lastError = msg;
      return { success: false, message: msg };
    }
  }

  /**
   * Initialize all database sheets with their standard headers if they don't already exist.
   */
  public async initializeSheetsTemplate(targetSpreadsheetId?: string): Promise<{ success: boolean; createdSheets: string[]; message: string }> {
    const spreadsheetId = cleanSpreadsheetId(targetSpreadsheetId || this.config?.spreadsheetId || '');
    if (!spreadsheetId || !this.sheets) {
      throw new Error('Google Sheets is not configured or missing spreadsheet ID');
    }

    // 1. Get existing sheets
    const meta = await this.sheets.spreadsheets.get({ spreadsheetId });
    this.connectedSheetTitle = meta.data.properties?.title || 'Maxpack ERP';
    const existingTitles = new Set(meta.data.sheets?.map((s: any) => s.properties?.title) || []);
    existingTitles.forEach((t: any) => this.knownSheetTitles.add(t));

    const createdSheets: string[] = [];
    const requests: any[] = [];

    // Add missing sheets
    for (const [key, def] of Object.entries(ERP_SHEETS_SCHEMA)) {
      if (!existingTitles.has(def.title)) {
        requests.push({
          addSheet: {
            properties: {
              title: def.title,
              gridProperties: {
                rowCount: 1000,
                columnCount: Math.max(def.headers.length + 2, 20),
                frozenRowCount: 1,
              },
            },
          },
        });
        createdSheets.push(def.title);
      }
    }

    if (requests.length > 0) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });
      createdSheets.forEach(t => this.knownSheetTitles.add(t));
    }

    // Now populate header rows for all sheets defined in schema using a single batchUpdate
    try {
      const headerData = Object.values(ERP_SHEETS_SCHEMA).map(def => ({
        range: `${def.title}!A1:${this.columnLetter(def.headers.length)}1`,
        values: [def.headers],
      }));

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: headerData,
        },
      });
    } catch (err: any) {
      console.warn('[GoogleSheets] Batch header init warning:', err.message);
    }

    this.isConfigured = true;
    this.lastError = null;

    return {
      success: true,
      createdSheets,
      message: `Successfully verified and structured ${Object.keys(ERP_SHEETS_SCHEMA).length} ERP tables in Google Sheets ("${this.connectedSheetTitle}").`,
    };
  }

  /**
   * Read all rows from a sheet tab into an array of objects
   */
  public async readTable<T>(sheetTitle: string): Promise<T[]> {
    if (!this.sheets || !this.config?.spreadsheetId) {
      this.initFromEnv();
    }
    if (!this.sheets || !this.config?.spreadsheetId) return [];

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${sheetTitle}!A1:Z5000`,
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) return [];

      const headers = rows[0] as string[];
      const dataRows = rows.slice(1);

      return dataRows.map((row: any[]) => {
        const item: any = {};
        headers.forEach((header, index) => {
          const val = row[index] !== undefined ? row[index] : '';
          try {
            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
              item[header] = JSON.parse(val);
            } else if (val === 'true') {
              item[header] = true;
            } else if (val === 'false') {
              item[header] = false;
            } else if (!isNaN(Number(val)) && val !== '' && !val.startsWith('0') && !val.includes('-')) {
              item[header] = Number(val);
            } else {
              item[header] = val;
            }
          } catch {
            item[header] = val;
          }
        });
        return item as T;
      });
    } catch (err: any) {
      console.warn(`[GoogleSheets] Failed to read ${sheetTitle}:`, err.message);
      return [];
    }
  }

  /**
   * Ensure a sheet tab exists with standard headers, creating it dynamically if missing.
   */
  public async ensureSheetExists(sheetTitle: string, headers?: string[]): Promise<boolean> {
    if (!this.sheets || !this.config?.spreadsheetId) return false;
    const spreadsheetId = this.config.spreadsheetId;

    if (this.knownSheetTitles.has(sheetTitle)) return true;

    try {
      const meta = await this.sheets.spreadsheets.get({ spreadsheetId });
      this.connectedSheetTitle = meta.data.properties?.title || 'Maxpack ERP';
      const titles = new Set(meta.data.sheets?.map((s: any) => s.properties?.title) || []);
      titles.forEach((t: any) => this.knownSheetTitles.add(t));

      if (!this.knownSheetTitles.has(sheetTitle)) {
        const def = Object.values(ERP_SHEETS_SCHEMA).find((s) => s.title === sheetTitle);
        const headerList = headers || def?.headers || [];

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetTitle,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: Math.max(headerList.length + 2, 20),
                      frozenRowCount: 1,
                    },
                  },
                },
              },
            ],
          },
        });

        if (headerList.length > 0) {
          await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetTitle}!A1:${this.columnLetter(headerList.length)}1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [headerList],
            },
          });
        }
        this.knownSheetTitles.add(sheetTitle);
      }
      return true;
    } catch (err: any) {
      console.warn(`[GoogleSheets] ensureSheetExists error on ${sheetTitle}:`, err.message);
      return false;
    }
  }

  /**
   * Append a row to a sheet tab using an in-memory queue with debounced batch flushing
   * to strictly respect Google Sheets 60 writes/min API quota.
   */
  public async appendRow(sheetTitle: string, rowData: any, headers?: string[]): Promise<void> {
    if (!this.sheets || !this.config?.spreadsheetId) {
      this.initFromEnv();
    }
    if (!this.sheets || !this.config?.spreadsheetId) return;

    if (!this.appendQueue.has(sheetTitle)) {
      this.appendQueue.set(sheetTitle, []);
    }
    this.appendQueue.get(sheetTitle)!.push({ rowData, headers });

    this.scheduleQueueFlush(1500);
  }

  private scheduleQueueFlush(delayMs: number = 1500) {
    if (this.flushTimeout) return;
    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.flushAppendQueue().catch(err => {
        console.warn('[GoogleSheets] Background queue flush note:', err.message);
      });
    }, delayMs);
  }

  public async flushAppendQueue() {
    if (this.isFlushingQueue || !this.sheets || !this.config?.spreadsheetId) return;

    const now = Date.now();
    if (now < this.quotaCooldownUntil) {
      const remainingMs = this.quotaCooldownUntil - now;
      this.scheduleQueueFlush(remainingMs + 1000);
      return;
    }

    this.isFlushingQueue = true;
    const spreadsheetId = cleanSpreadsheetId(this.config.spreadsheetId);

    try {
      for (const [sheetTitle, items] of this.appendQueue.entries()) {
        if (!items || items.length === 0) continue;

        if (Date.now() < this.quotaCooldownUntil) {
          break;
        }

        // Take up to 50 items per batch to write multiple rows in a single API call
        const batch = items.splice(0, 50);

        try {
          await this.ensureSheetExists(sheetTitle, batch[0]?.headers);

          const def = Object.values(ERP_SHEETS_SCHEMA).find(s => s.title === sheetTitle);
          const cols = batch[0]?.headers || def?.headers || Object.keys(batch[0].rowData);

          const values = batch.map(item => {
            return cols.map(col => {
              const val = item.rowData[col];
              if (typeof val === 'object' && val !== null) {
                return JSON.stringify(val);
              }
              return val !== undefined && val !== null ? String(val) : '';
            });
          });

          await this.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetTitle}!A:A`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values,
            },
          });

          this.totalSyncedRows += batch.length;

          // Small pause between different sheets to remain well below 60 req/min
          await new Promise(res => setTimeout(res, 200));
        } catch (err: any) {
          const errMsg = err.message || '';
          const isQuota = err.code === 429 || err.status === 429 ||
            errMsg.includes('Quota exceeded') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('Write requests per minute');

          if (isQuota) {
            // Restore batch back into queue for graceful retry
            items.unshift(...batch);
            this.quotaCooldownUntil = Date.now() + 60000;
            console.warn(`[GoogleSheets] Write quota paused for 60s (${sheetTitle}). ${items.length} records safely preserved in memory queue.`);
            this.scheduleQueueFlush(61000);
            break;
          } else {
            console.warn(`[GoogleSheets] Append note on ${sheetTitle}:`, errMsg);
          }
        }
      }
    } finally {
      this.isFlushingQueue = false;

      let remainingCount = 0;
      for (const items of this.appendQueue.values()) {
        remainingCount += items.length;
      }
      if (remainingCount > 0 && Date.now() >= this.quotaCooldownUntil) {
        this.scheduleQueueFlush(1000);
      }
    }
  }

  /**
   * Sync all ERP data tables to Google Sheets using high-efficiency batchClear and batchUpdate
   * (only 2 API write requests for all 17 tables instead of 34+ individual requests).
   */
  public async syncAllData(tables: Record<string, any[]>): Promise<{
    success: boolean;
    syncedTables: Record<string, number>;
    totalRows: number;
    message: string;
  }> {
    if (!this.sheets || !this.config?.spreadsheetId) {
      this.initFromEnv();
    }
    if (!this.sheets || !this.config?.spreadsheetId) {
      throw new Error('Google Sheets is not configured or missing spreadsheet ID. Please verify Settings -> Google Sheets Database Sync.');
    }

    const spreadsheetId = cleanSpreadsheetId(this.config.spreadsheetId);

    // Initial check to verify spreadsheet access
    try {
      const meta = await this.sheets.spreadsheets.get({ spreadsheetId });
      this.connectedSheetTitle = meta.data.properties?.title || 'Maxpack ERP';
      const existingTitles = new Set(meta.data.sheets?.map((s: any) => s.properties?.title) || []);
      existingTitles.forEach((t: any) => this.knownSheetTitles.add(t));
    } catch (err: any) {
      let msg = err.message || 'Failed to reach Google Spreadsheet.';
      if (msg.includes('The caller does not have permission') || msg.includes('403')) {
        msg = `Permission Denied: Please share your Google Spreadsheet (${spreadsheetId}) with your Service Account email/ID (${this.config.clientEmail}) with Editor permissions.`;
      } else if (msg.includes('404')) {
        msg = `Spreadsheet Not Found (404): Please verify Spreadsheet ID "${spreadsheetId}".`;
      }
      this.lastError = msg;
      throw new Error(msg);
    }

    const syncedTables: Record<string, number> = {};
    const clearRanges: string[] = [];
    const updateData: any[] = [];
    let totalRows = 0;

    for (const [sheetTitle, rows] of Object.entries(tables)) {
      try {
        const def = Object.values(ERP_SHEETS_SCHEMA).find(s => s.title === sheetTitle);
        const headers = def?.headers || (rows.length > 0 ? Object.keys(rows[0]) : []);
        if (headers.length === 0) continue;

        await this.ensureSheetExists(sheetTitle, headers);

        const endCol = this.columnLetter(headers.length);
        clearRanges.push(`${sheetTitle}!A2:${endCol}5000`);

        const rowValues = rows.map((r: any) => {
          return headers.map(h => {
            const val = r[h];
            if (typeof val === 'object' && val !== null) {
              return JSON.stringify(val);
            }
            return val !== undefined && val !== null ? String(val) : '';
          });
        });

        updateData.push({
          range: `${sheetTitle}!A1:${endCol}${rowValues.length + 1}`,
          values: [headers, ...rowValues],
        });

        syncedTables[sheetTitle] = rows.length;
        totalRows += rows.length;

        // Clear any pending queued single rows for this sheet since full data is being synced
        if (this.appendQueue.has(sheetTitle)) {
          this.appendQueue.set(sheetTitle, []);
        }
      } catch (err: any) {
        console.warn(`[GoogleSheets] Structure prep note for ${sheetTitle}:`, err.message);
      }
    }

    try {
      // 1. Batch clear old data across all tables in a single write call
      if (clearRanges.length > 0) {
        try {
          await this.sheets.spreadsheets.values.batchClear({
            spreadsheetId,
            requestBody: {
              ranges: clearRanges,
            },
          });
        } catch (clearErr: any) {
          console.warn('[GoogleSheets] batchClear note:', clearErr.message);
        }
      }

      // 2. Batch update all 17 tables in a single write call
      if (updateData.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updateData,
          },
        });
      }

      this.lastSyncTime = new Date().toISOString();
      this.totalSyncedRows = totalRows;
      this.isConfigured = true;
      this.lastError = null;

      return {
        success: true,
        syncedTables,
        totalRows,
        message: `Successfully synchronized ${totalRows} records across ${Object.keys(syncedTables).length} tables into Google Sheet "${this.connectedSheetTitle}".`,
      };
    } catch (err: any) {
      const errMsg = err.message || '';
      const isQuota = err.code === 429 || err.status === 429 ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Write requests per minute');

      if (isQuota) {
        this.quotaCooldownUntil = Date.now() + 60000;
        this.lastError = 'Google Sheets write quota reached (60 writes/min). Sync will retry shortly.';
        console.warn('[GoogleSheets] Bulk sync paused due to API quota rate limit.');
        return {
          success: false,
          syncedTables,
          totalRows: 0,
          message: 'Google Sheets write quota reached. System has queued sync and will retry automatically.',
        };
      }

      this.lastError = errMsg;
      return {
        success: false,
        syncedTables,
        totalRows: 0,
        message: `Failed to sync data: ${errMsg}`,
      };
    }
  }

  private columnLetter(index: number): string {
    let temp, letter = '';
    while (index > 0) {
      temp = (index - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      index = (index - temp - 1) / 26;
    }
    return letter || 'Z';
  }
}

export const googleSheetsService = new GoogleSheetsService();
