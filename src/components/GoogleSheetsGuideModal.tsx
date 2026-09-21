import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useErp } from '../context/ErpContext.tsx';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  Layers,
  ShieldCheck,
  Database
} from 'lucide-react';

interface GoogleSheetsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsGuideModal: React.FC<GoogleSheetsGuideModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useErp();
  const [status, setStatus] = useState<any>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [initResult, setInitResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const res = await api.getSheetsStatus();
      setStatus(res);
      if (res.spreadsheetId) setSpreadsheetId(res.spreadsheetId);
    } catch (e: any) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'info');
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    setInitResult(null);
    try {
      const res = await api.testSheetsConnection(spreadsheetId);
      setTestResult(res);
      if (res.success) {
        showToast('Google Sheets connected successfully!', 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
      loadStatus();
    }
  };

  const handleInitTemplate = async () => {
    setIsLoading(true);
    setInitResult(null);
    try {
      const res = await api.initSheetsTemplate(spreadsheetId);
      setInitResult(res);
      if (res.success) {
        showToast(`Created ${res.createdSheets.length} ERP tables in your Google Sheet!`, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setInitResult({ success: false, message: err.message });
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
      loadStatus();
    }
  };

  const handleSyncAll = async () => {
    setIsLoading(true);
    setSyncResult(null);
    try {
      const res = await api.syncAllToSheets(spreadsheetId);
      setSyncResult(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message });
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
      loadStatus();
    }
  };

  if (!isOpen) return null;

  const serviceEmail = status?.serviceAccountEmail || 'maxpack-erp-service@maxpack-uae.iam.gserviceaccount.com';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Google Sheets Integration & Setup</h2>
              <p className="text-xs text-slate-400">
                Connect your Maxpack UAE master Google Sheet as the live database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {/* Status banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              status?.configured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {status?.configured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">
                {status?.configured
                  ? 'Google Sheets API is Active & Connected'
                  : 'Google Sheets Service Account Standby'}
              </p>
              <p className="text-xs mt-0.5 leading-relaxed">
                {status?.configured
                  ? `Connected to Spreadsheet ID: ${status.spreadsheetId}. All transactions are synchronously appended to your cloud sheet.`
                  : 'The ERP is operating in high-performance memory storage mode. Follow the 3 quick steps below to stream all data directly into your company Google Sheet.'}
              </p>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Step-by-Step Connection Instructions</span>
            </h3>

            {/* Step 1 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">
                  1
                </span>
                <span>Share your Google Sheet with the Service Account</span>
              </div>
              <p className="text-slate-600">
                Open your Google Sheet (or create a new blank one named <strong>Maxpack ERP Database</strong>), click the green <strong>Share</strong> button, and invite this Service Account email as an <strong>Editor</strong>:
              </p>
              <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] text-slate-900">
                <span className="truncate">{serviceEmail}</span>
                <button
                  onClick={() => copyToClipboard(serviceEmail)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition font-sans font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">
                  2
                </span>
                <span>Enter your Google Spreadsheet ID</span>
              </div>
              <p className="text-slate-600">
                Copy the Spreadsheet ID from your browser address bar:
                <br />
                <code className="text-slate-800 bg-slate-200 px-1 py-0.5 rounded">
                  https://docs.google.com/spreadsheets/d/<strong>YOUR_SPREADSHEET_ID</strong>/edit
                </code>
              </p>
              <input
                type="text"
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
              />
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">
                  3
                </span>
                <span>Test Connection & Auto-Initialize Tables</span>
              </div>
              <p className="text-slate-600">
                Once shared, click <strong>Test Connection</strong> to verify access, then click <strong>Auto-Initialize Tables</strong> to automatically create all 23 structured worksheets (Products, Customers, Invoices, POS, Stock Movements, General Ledger, etc.) with standardized headers!
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleTestConnection}
                  disabled={isLoading || !spreadsheetId}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <button
                  onClick={handleInitTemplate}
                  disabled={isLoading || !spreadsheetId}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg transition disabled:opacity-50 shadow-sm"
                >
                  <Database className="w-4 h-4" />
                  <span>Auto-Initialize All 23 Tables</span>
                </button>

                <button
                  onClick={handleSyncAll}
                  disabled={isLoading || !spreadsheetId}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Sync All ERP Data to Google Sheets</span>
                </button>
              </div>

              {/* Test / Init / Sync Result display */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.sheetNames && (
                    <p className="mt-1 text-[11px]">
                      Found existing sheets: {testResult.sheetNames.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {initResult && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    initResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-bold">{initResult.message}</p>
                  {initResult.createdSheets && (
                    <p className="mt-1 text-[11px]">
                      Created sheets: {initResult.createdSheets.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {syncResult && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    syncResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-bold">{syncResult.message}</p>
                  {syncResult.syncedTables && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono bg-white/70 p-2 rounded border border-emerald-200">
                      {Object.entries(syncResult.syncedTables).map(([table, count]) => (
                        <div key={table} className="flex justify-between px-1">
                          <span className="text-slate-600 truncate">{table}:</span>
                          <span className="font-bold text-slate-900">{count as any} rows</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Architecture guarantee note */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Future-Proof Data Layer Guarantee</span>
                <span className="text-[11px] text-blue-800 leading-normal">
                  All Maxpack ERP UI components interact exclusively through the abstract <code>DataStore</code> interface. When transitioning from Google Sheets to PostgreSQL / Supabase, zero frontend UI code requires rebuilding.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
