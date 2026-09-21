import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import {
  Settings,
  Building2,
  FileSpreadsheet,
  Database,
  Shield,
  Download,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowRight,
  Code2,
  RefreshCw,
  ExternalLink,
  Upload,
  Image,
  Trash2,
  X,
  Sun,
  Moon,
  Monitor,
  Palette,
  Sparkles,
  Check,
  Eye,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenSheetsGuide: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenSheetsGuide }) => {
  const {
    settings,
    formatAED,
    showToast,
    can,
    refreshSettings,
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  } = useErp();

  const [companyForm, setCompanyForm] = useState({
    companyName: 'Maxpack Packaging LLC',
    tradeLicenseNo: '1029485',
    trn: '100234857600003',
    address: 'Plot 598-1124, Dubai Investment Park 1, Jebel Ali',
    city: 'Dubai',
    country: 'United Arab Emirates',
    phone: '+971 4 885 9200',
    email: 'info@maxpack.ae',
    vatRate: 5,
    currency: 'AED',
    timezone: 'Asia/Dubai',
  });

  const [logoUrl, setLogoUrl] = useState('');
  const [showClearDemoModal, setShowClearDemoModal] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);

  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [initializingTables, setInitializingTables] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'appearance' | 'sheets' | 'migration'>('company');

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (settings) {
      if (settings.logoUrl !== undefined) {
        setLogoUrl(settings.logoUrl || '');
      }
      if (settings.googleSheets?.autoSync !== undefined) {
        setAutoSyncEnabled(settings.googleSheets.autoSync);
      }
      setCompanyForm((prev) => ({
        ...prev,
        companyName: settings.companyName || prev.companyName,
        trn: settings.trn || prev.trn,
        address: settings.address || prev.address,
        phone: settings.phone || prev.phone,
        email: settings.email || prev.email,
      }));
    }
  }, [settings]);

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('Logo file size must be less than 4MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoUrl(result);
      showToast('Company logo loaded! Click "Save Organization Settings" to apply to Invoices and Quotes.', 'info');
    };
    reader.onerror = () => {
      showToast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleClearDemoData = async () => {
    setIsClearingDemo(true);
    try {
      const res = await api.clearDemoData();
      showToast(res.message || 'Demo data cleared and Google Sheets synchronized!', 'success');
      setShowClearDemoModal(false);
      await refreshSettings();
      await loadStatus();
    } catch (e: any) {
      showToast(e.message || 'Failed to clear demo data', 'error');
    } finally {
      setIsClearingDemo(false);
    }
  };

  const loadStatus = async () => {
    try {
      const res = await api.getSheetsStatus();
      setSheetsStatus(res);
      if (res.spreadsheetId) {
        setSpreadsheetInput(res.spreadsheetId);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSyncAllToSheets = async () => {
    setSyncingAll(true);
    try {
      const res = await api.syncAllToSheets(spreadsheetInput || undefined);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
      await loadStatus();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleTestSheets = async () => {
    setTestingConnection(true);
    try {
      const res = await api.testSheetsConnection(spreadsheetInput || undefined);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message || 'Google Sheets test failed', 'error');
      }
      await loadStatus();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInitAllSheets = async () => {
    setInitializingTables(true);
    try {
      const res = await api.initSheetsTemplate(spreadsheetInput || undefined);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
      await loadStatus();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setInitializingTables(false);
    }
  };

  const handleSaveSheetsConfig = async () => {
    try {
      await api.updateSettings({
        googleSheets: {
          ...(settings?.googleSheets || {}),
          spreadsheetId: spreadsheetInput.trim(),
          serviceAccountEmail: sheetsStatus?.serviceAccountEmail || '',
          autoSync: autoSyncEnabled,
          status: sheetsStatus?.configured ? 'Connected' : 'Not Configured',
          lastSyncTime: new Date().toISOString(),
        },
      });
      showToast('Google Sheets configuration and Auto-Sync saved successfully!', 'success');
      await loadStatus();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        companyName: companyForm.companyName,
        tradeLicenseNo: companyForm.tradeLicenseNo,
        trn: companyForm.trn,
        address: companyForm.address,
        phone: companyForm.phone,
        email: companyForm.email,
        logoUrl: logoUrl.trim(),
      });
      await refreshSettings();
      showToast('Company settings & invoice logo saved successfully!', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const sqlSchemaSnippet = `-- Maxpack UAE ERP PostgreSQL Schema
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL,
  selling_price NUMERIC(12, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'pcs',
  specifications JSONB,
  active BOOLEAN DEFAULT true
);

CREATE TABLE sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  subtotal NUMERIC(12, 2) NOT NULL,
  vat_rate NUMERIC(5, 4) DEFAULT 0.05,
  vat_amount NUMERIC(12, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'Issued'
);`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Settings, Theme & System Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure appearance & dark mode, legal entity details, FTA VAT parameters, and live Google Sheets sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Theme Switcher Pill Group */}
          <div
            id="settings-header-theme-selector"
            className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <button
              id="btn-quick-theme-light"
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                theme === 'light'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Switch to Light Mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Light</span>
            </button>
            <button
              id="btn-quick-theme-dark"
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Switch to Dark Mode"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Dark</span>
            </button>
            <button
              id="btn-quick-theme-system"
              type="button"
              onClick={() => setTheme('system')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                theme === 'system'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Synchronize with OS System Theme"
            >
              <Monitor className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Auto</span>
            </button>
          </div>

          <button
            onClick={onOpenSheetsGuide}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Google Sheets Setup Guide</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          id="tab-settings-company"
          onClick={() => setActiveSubTab('company')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeSubTab === 'company'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Company & UAE VAT Profile</span>
        </button>

        <button
          id="tab-settings-appearance"
          onClick={() => setActiveSubTab('appearance')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeSubTab === 'appearance'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance & Dark Mode</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              resolvedTheme === 'dark'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        <button
          id="tab-settings-sheets"
          onClick={() => setActiveSubTab('sheets')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeSubTab === 'sheets'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Google Sheets Database Sync</span>
        </button>

        <button
          id="tab-settings-migration"
          onClick={() => setActiveSubTab('migration')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeSubTab === 'migration'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase / PostgreSQL Migration</span>
        </button>
      </div>

      {/* 1. COMPANY SETTINGS TAB */}
      {activeSubTab === 'company' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveCompany} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 text-xs transition-colors">
            {/* Display Theme Card inside Company Profile */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-800 dark:text-emerald-300">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">ERP Display Theme Mode</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Switch the application between High-Contrast Light and Low-Glare Dark mode across all operational views.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                  <button
                    type="button"
                    id="btn-company-theme-light"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      theme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    id="btn-company-theme-dark"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dark</span>
                  </button>

                  <button
                    type="button"
                    id="btn-company-theme-system"
                    onClick={() => setTheme('system')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      theme === 'system'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Auto ({resolvedTheme})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Logo & Invoicing Branding Section */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-xs relative group shrink-0">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Company Logo Preview"
                        className="w-full h-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <Image className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <span className="text-[9px] font-bold block">No Logo</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Official Company & Invoicing Logo</h3>
                    <p className="text-[11px] text-slate-500 max-w-md mt-0.5">
                      This logo appears automatically on UAE Tax Invoices, Commercial Quotations, Sales Orders, and Thermal Receipts.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{logoUrl ? 'Change Logo File' : 'Upload Logo File'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={handleLogoFileSelect}
                        />
                      </label>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl('');
                            showToast('Logo removed. Click "Save Organization Settings" to apply.', 'info');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Logo URL field */}
                <div className="w-full sm:w-72">
                  <label className="block text-slate-600 font-bold mb-1 text-[11px]">Or Paste Public Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company Legal Trade Name *</label>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Dubai DED Trade License # *</label>
                <input
                  type="text"
                  value={companyForm.tradeLicenseNo}
                  onChange={(e) => setCompanyForm({ ...companyForm, tradeLicenseNo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Federal Tax Authority TRN *</label>
                <input
                  type="text"
                  value={companyForm.trn}
                  onChange={(e) => setCompanyForm({ ...companyForm, trn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Standard VAT Rate (%)</label>
                <input
                  type="number"
                  value={companyForm.vatRate}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-slate-600 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Mandated 5.0% UAE VAT</span>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Functional Currency</label>
                <input
                  type="text"
                  value="AED (United Arab Emirates Dirham)"
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Physical Registered Address</label>
              <input
                type="text"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Invoicing Email</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">System Timezone</label>
                <input
                  type="text"
                  value="Asia/Dubai (GST +04:00)"
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                id="btn-save-company-settings"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition"
              >
                Save Organization Settings & Logo
              </button>
            </div>
          </form>

          {/* Clean Database / Purge Demo Data Card */}
          <div className="p-6 bg-white rounded-2xl border border-rose-200 shadow-xs text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    Database Cleanup
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">Purge Demo Data & Start Fresh</h3>
                </div>
                <p className="text-slate-600 text-[11px] mt-1 max-w-xl">
                  Ready to run your real packaging business? Click below to delete sample products, sample customers, suppliers, quotations, orders, and invoices. Your company profile, VAT settings, connected Google Sheet, and Chart of Accounts are securely kept intact.
                </p>
              </div>

              <button
                type="button"
                id="btn-purge-demo-data"
                onClick={() => setShowClearDemoModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl shadow-xs transition whitespace-nowrap self-start sm:self-center"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Demo Data Confirmation Modal */}
      {showClearDemoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Clear All Demo Data?</h3>
                  <p className="text-xs text-slate-500">Initialize a clean, fresh ERP database</p>
                </div>
              </div>
              <button
                onClick={() => setShowClearDemoModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-2">
              <p className="font-bold">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 dark:text-rose-300">
                <li>All demo inventory products & stock records</li>
                <li>Sample customers, CRM leads & suppliers</li>
                <li>Sample quotations, sales orders & tax invoices</li>
                <li>Purchase orders & POS register receipts</li>
              </ul>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 pt-1">
                Your company profile, logo, Google Sheet connection, and financial chart of accounts will be preserved and freshly synchronized.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearDemoModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-demo"
                disabled={isClearingDemo}
                onClick={handleClearDemoData}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearingDemo ? 'Purging Data...' : 'Yes, Purge Demo Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. APPEARANCE & DARK MODE TAB */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Appearance & Theme Settings
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize your visual workspace. Switch between high-contrast light mode and low-glare dark mode.
                  </p>
                </div>
              </div>

              {/* Instant Toggle Pill */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {resolvedTheme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Preference: <strong className="capitalize">{theme}</strong>
                  </p>
                </div>
                <button
                  id="btn-settings-toggle-theme-switch"
                  type="button"
                  onClick={toggleTheme}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                    resolvedTheme === 'dark' ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                  title="Click to toggle between Light and Dark mode"
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform">
                    {resolvedTheme === 'dark' ? (
                      <Moon className="w-3.5 h-3.5 text-emerald-800" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Theme Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Light Mode Card */}
            <div
              id="theme-card-light"
              onClick={() => setTheme('light')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                theme === 'light'
                  ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
                    <Sun className="w-5 h-5" />
                  </div>
                  {theme === 'light' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Light Mode</h4>
                  <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                    Clean, crisp white canvas with high-contrast slate typography. Optimal for well-lit UAE corporate offices, sales counters, and physical document review.
                  </p>
                </div>
              </div>

              {/* Palette dots */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Palette Preview</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-2xs" title="#ffffff" />
                  <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200" title="#f1f5f9" />
                  <span className="w-4 h-4 rounded-full bg-slate-900" title="#0f172a" />
                  <span className="w-4 h-4 rounded-full bg-emerald-600" title="#059669" />
                </div>
              </div>
            </div>

            {/* Dark Mode Card */}
            <div
              id="theme-card-dark"
              onClick={() => setTheme('dark')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shadow-2xs">
                    <Moon className="w-5 h-5" />
                  </div>
                  {theme === 'dark' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Dark Mode</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                    Engineered with deep slate backgrounds (#090d16) and soft contrast text. Drastically reduces glare during warehouse night shifts, barcode scanning, and protects eyesight.
                  </p>
                </div>
              </div>

              {/* Palette dots */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Palette Preview</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-950 border border-slate-700" title="#090d16" />
                  <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700" title="#0f172a" />
                  <span className="w-4 h-4 rounded-full bg-slate-100" title="#f1f5f9" />
                  <span className="w-4 h-4 rounded-full bg-emerald-500" title="#10b981" />
                </div>
              </div>
            </div>

            {/* System Synchronized Card */}
            <div
              id="theme-card-system"
              onClick={() => setTheme('system')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                theme === 'system'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-2xs">
                    <Monitor className="w-5 h-5" />
                  </div>
                  {theme === 'system' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" /> Auto
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">System Synchronized</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                    Follows your device operating system setting in real-time. Switches automatically when macOS, Windows, or Android changes between day and night modes.
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium">Resolving to</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {resolvedTheme} Mode
                </span>
              </div>
            </div>
          </div>

          {/* Live ERP UI Component Theme Showcase */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Live Component Preview in Active Theme
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Current: <strong className="text-emerald-700 dark:text-emerald-400 uppercase font-mono">{resolvedTheme} Mode</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Sample Metric Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total VAT Invoiced</span>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                  {formatAED(71294.50)}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>↑ +12.4%</span>
                  <span className="text-slate-400 text-[10px]">vs previous month</span>
                </div>
              </div>

              {/* Sample UAE VAT Badge Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tax Registration</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                    FTA 5% VAT
                  </span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                    100234857600003
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Compliance verified with FTA UAE</p>
              </div>

              {/* Sample Status Badges */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Status Badges</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Paid
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                    Issued
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Pending
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    Overdue
                  </span>
                </div>
              </div>

              {/* Sample Action Controls */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Action Buttons</span>
                <div className="space-y-1.5 pt-0.5">
                  <button
                    type="button"
                    className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                  >
                    Primary Action
                  </button>
                  <button
                    type="button"
                    className="w-full py-1.5 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                  >
                    Secondary Outline
                  </button>
                </div>
              </div>
            </div>

            {/* Sample Input & Table row */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Sample ERP Form Input Field
                </label>
                <input
                  type="text"
                  placeholder="E.g. INV-2025-00194 or Customer Name..."
                  defaultValue="Al Barakah General Trading LLC"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Contrast & Legibility Standards
                </label>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>WCAG AA 4.5:1 Contrast Ratio Compliant</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Optimized for anti-glare warehouse barcode scanners and high-brightness Dubai accounting screens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GOOGLE SHEETS DB TAB */}
      {activeSubTab === 'sheets' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Google Sheets Cloud Database</h3>
                  {sheetsStatus?.connectedSheetTitle && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-[11px] rounded-full">
                      {sheetsStatus.connectedSheetTitle}
                    </span>
                  )}
                </div>
                <p className="text-slate-500">
                  Automated two-way synchronization via Google Sheets API & Google Service Account.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncAllToSheets}
                disabled={syncingAll}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                <span>{syncingAll ? 'Syncing...' : 'Sync All Data Now'}</span>
              </button>

              <button
                onClick={handleTestSheets}
                disabled={testingConnection}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                onClick={handleInitAllSheets}
                disabled={initializingTables}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{initializingTables ? 'Structuring...' : 'Initialize 23 Tables'}</span>
              </button>
            </div>
          </div>

          {/* Error notification banner if any */}
          {sheetsStatus?.lastError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Synchronization Note / Access Issue</span>
                <p className="text-xs text-rose-800 leading-relaxed">{sheetsStatus.lastError}</p>
                <button
                  onClick={onOpenSheetsGuide}
                  className="text-rose-900 font-bold underline hover:text-rose-700 text-xs mt-1"
                >
                  Click here to view sharing instructions and email details →
                </button>
              </div>
            </div>
          )}

          {/* Configuration Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="font-bold text-slate-900 text-sm block">Spreadsheet & Sync Controls</span>
                <span className="text-slate-500 text-[11px]">Configure target Google Spreadsheet ID and automated streaming</span>
              </div>
              <div className="flex items-center gap-2">
                {spreadsheetInput && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetInput}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-[11px] flex items-center gap-1"
                  >
                    <span>Open Sheet</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
                <button
                  onClick={handleSaveSheetsConfig}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] transition shadow-xs"
                >
                  Save Configuration
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Google Spreadsheet ID or URL
                </label>
                <input
                  type="text"
                  value={spreadsheetInput}
                  onChange={(e) => setSpreadsheetInput(e.target.value)}
                  placeholder="e.g. 1YXgwGBc0uGz32w9p5qf9W..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Paste the ID from your sheet URL: /spreadsheets/d/<b>YOUR_ID</b>/edit
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 font-bold">
                  Automated Real-Time & Background Sync
                </label>
                <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-[11px]">
                      Enable Automatic Synchronization
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      Automatically syncs on startup, transactional events, and periodic background intervals.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold uppercase text-[10px] text-slate-400">Connection Status</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    sheetsStatus?.configured
                      ? sheetsStatus.quotaCoolingDown
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
                <span className="font-bold text-slate-900 text-sm">
                  {sheetsStatus?.configured
                    ? sheetsStatus.quotaCoolingDown
                      ? 'Quota Cooldown (Auto-Resuming)'
                      : 'Active & Synced'
                    : 'Standby / Configuration'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {sheetsStatus?.configured
                  ? sheetsStatus.quotaCoolingDown
                    ? 'Write quota (60/min) pause active; rows safely queued in memory and will sync automatically.'
                    : `Connected to "${sheetsStatus?.connectedSheetTitle || 'Google Sheet'}".`
                  : 'Ready to connect. Please share sheet with service email.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold uppercase text-[10px] text-slate-400">Last Sync Time</span>
              <p className="font-bold text-slate-900 text-sm">
                {sheetsStatus?.lastSyncTime
                  ? new Date(sheetsStatus.lastSyncTime).toLocaleTimeString('en-AE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'Just now'}
              </p>
              <p className="text-slate-500 text-[11px]">
                Total Synced Records: <strong className="text-slate-800">{sheetsStatus?.totalSyncedRows ?? '0'}</strong>
                {sheetsStatus?.pendingQueueCount ? (
                  <span className="ml-1.5 text-amber-700 font-semibold">
                    ({sheetsStatus.pendingQueueCount} queued)
                  </span>
                ) : null}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold uppercase text-[10px] text-slate-400">Service Account Email</span>
              <p className="font-mono text-slate-800 font-semibold text-[11px] truncate">
                {sheetsStatus?.serviceAccountEmail || 'maxpack-erp-sa@project.iam.gserviceaccount.com'}
              </p>
              <button
                onClick={onOpenSheetsGuide}
                className="text-emerald-700 hover:underline font-bold text-[11px] block"
              >
                View setup instructions & copy email →
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-3">All 23 Synchronized ERP Worksheets</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
              {[
                'Users',
                'Customers',
                'Suppliers',
                'Products',
                'Warehouses',
                'Stock Movements',
                'Sales Quotations',
                'Sales Orders',
                'Sales Invoices',
                'Payments',
                'POS Transactions',
                'Purchase Orders',
                'Supplier Bills',
                'Expenses',
                'Chart of Accounts',
                'Journal Entries',
                'Audit Logs',
              ].map((sheet) => (
                <div
                  key={sheet}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] flex items-center justify-between"
                >
                  <span className="truncate">{sheet}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. POSTGRESQL / SUPABASE MIGRATION TAB */}
      {activeSubTab === 'migration' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
              <Database className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Zero-Downtime Migration: Google Sheets to Supabase / PostgreSQL
              </h3>
              <p className="text-slate-500">
                The entire ERP uses the Repository Pattern (<code className="text-slate-700 font-bold">dataLayer.ts</code>).
                Swapping to SQL requires ZERO frontend UI changes.
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-950 block">Architecture Guarantee:</span>
            <p className="text-emerald-900 leading-relaxed">
              Because all components query <code className="bg-white/80 px-1 py-0.5 rounded">api.ts</code> which calls the
              Express controller routes backed by <code className="bg-white/80 px-1 py-0.5 rounded">DataStore</code>,
              the database implementation can be swapped from Google Sheets to Supabase PostgreSQL by simply implementing
              the <code className="bg-white/80 px-1 py-0.5 rounded">IDataRepository</code> interface.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">PostgreSQL / Supabase DDL SQL Blueprint</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(sqlSchemaSnippet);
                  showToast('PostgreSQL schema copied to clipboard!', 'success');
                }}
                className="text-emerald-700 hover:underline font-bold text-[11px]"
              >
                Copy SQL DDL
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed">
              {sqlSchemaSnippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
