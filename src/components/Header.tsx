import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import { UserRole } from '../types/erp.ts';
import {
  Building2,
  Clock,
  FileSpreadsheet,
  ChevronDown,
  User,
  Shield,
  Layers,
  Bell,
  Search,
  CheckCircle,
  AlertTriangle,
  Sun,
  Moon,
  Mail,
  LogOut,
  KeyRound,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  onOpenSheetsGuide: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSheetsGuide, activeTab }) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    switchRole,
    warehouses,
    selectedWarehouse,
    setSelectedWarehouse,
    settings,
    theme,
    resolvedTheme,
    toggleTheme,
    setShowAuthModal,
    logout,
  } = useErp();

  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [uaeTime, setUaeTime] = useState('');

  // UAE Time live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setUaeTime(`${timeStr} GST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll sheets status
  useEffect(() => {
    api.getSheetsStatus().then(setSheetsStatus).catch(() => {});
  }, []);

  const roles: UserRole[] = [
    'Super Admin',
    'Admin / Manager',
    'Salesperson',
    'Cashier',
    'Accountant',
    'Warehouse Staff',
    'Viewer',
  ];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0 print:hidden shadow-xs transition-colors duration-150">
      {/* Left: Active Location & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm hidden sm:inline capitalize">
            {activeTab.replace('-', ' ')}
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          {/* Branch / Warehouse selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <select
              id="header-warehouse-selector"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-slate-800 dark:text-slate-100 cursor-pointer pr-1"
            >
              <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All UAE Locations (Consolidated)</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Dubai Time */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Dubai: <strong className="text-slate-800 dark:text-slate-200 font-mono">{uaeTime}</strong></span>
        </div>
      </div>

      {/* Right: Theme Toggle, Google Sheets Status pill, UAE VAT indicator, and Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Theme Toggle Button */}
        <button
          id="btn-header-theme-toggle"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs"
          title={`Active: ${resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}. Click to toggle.`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
          <span className="text-[11px] font-bold hidden md:inline">
            {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* Google Sheets Status Pill */}
        <button
          id="btn-open-sheets-guide"
          onClick={onOpenSheetsGuide}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            sheetsStatus?.configured
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40'
          }`}
          title="Click to view Google Sheets Integration Status & Instructions"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span className="hidden md:inline font-semibold">
            {sheetsStatus?.configured ? 'Google Sheets: Live' : 'Google Sheets: Setup'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              sheetsStatus?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
        </button>

        {/* UAE VAT 5% Badge */}
        <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-700 dark:text-slate-300">
          <span className="text-slate-400 dark:text-slate-500">TRN:</span>
          <strong className="text-slate-900 dark:text-slate-100">{settings?.trn || '100234857600003'}</strong>
          <span className="ml-1 px-1 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">5% VAT</span>
        </div>

        {/* Role Switcher & Active User Profile Dropdown */}
        <div className="relative">
          <button
            id="btn-role-switcher-dropdown"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{currentUser.name}</p>
              <div className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">{currentUser.role}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role selection dropdown */}
          {showRoleMenu && (
            <div
              id="role-switcher-menu"
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs animate-in fade-in"
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100">Switch Role (Live Testing)</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select any ERP role to test tailored permissions and views:
                </p>
              </div>

              <div className="py-1">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      switchRole(role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                      currentUser.role === role ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`w-3.5 h-3.5 ${
                          currentUser.role === role ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{role}</span>
                    </div>
                    {currentUser.role === role && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-1.5">
                <div className="px-2 py-1">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-mono font-medium truncate">{currentUser.email}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 ml-5">{currentUser.branch || 'Dubai Branch'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center justify-between font-semibold transition text-xs"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Login with Email ID</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.5 rounded">Switch</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    logout();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold transition text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
