import React from 'react';
import { useErp } from '../context/ErpContext.tsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  Landmark,
  BarChart3,
  Users,
  History,
  Settings,
  Boxes,
  Menu,
  X,
  FileSpreadsheet,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenSheetsGuide: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  onOpenSheetsGuide,
}) => {
  const { currentUser, can, resolvedTheme, toggleTheme } = useErp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Super Admin', 'Admin / Manager', 'Salesperson', 'Cashier', 'Accountant', 'Warehouse Staff', 'Viewer'],
    },
    {
      id: 'sales',
      label: 'Sales & Invoicing',
      icon: ShoppingCart,
      roles: ['Super Admin', 'Admin / Manager', 'Salesperson', 'Accountant', 'Viewer'],
    },
    {
      id: 'pos',
      label: 'POS Counter',
      icon: Receipt,
      roles: ['Super Admin', 'Admin / Manager', 'Cashier', 'Salesperson'],
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Package,
      roles: ['Super Admin', 'Admin / Manager', 'Warehouse Staff', 'Salesperson', 'Viewer'],
    },
    {
      id: 'purchases',
      label: 'Purchases & Bills',
      icon: Truck,
      roles: ['Super Admin', 'Admin / Manager', 'Warehouse Staff', 'Accountant', 'Viewer'],
    },
    {
      id: 'accounting',
      label: 'Accounting & VAT',
      icon: Landmark,
      roles: ['Super Admin', 'Admin / Manager', 'Accountant', 'Viewer'],
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      roles: ['Super Admin', 'Admin / Manager', 'Accountant', 'Salesperson', 'Viewer'],
    },
    {
      id: 'team',
      label: 'Team & Roles',
      icon: Users,
      roles: ['Super Admin', 'Admin / Manager', 'Viewer'],
    },
    {
      id: 'audit-logs',
      label: 'Audit Trail',
      icon: History,
      roles: ['Super Admin', 'Admin / Manager', 'Accountant', 'Viewer'],
    },
    {
      id: 'settings',
      label: 'Settings & Cloud DB',
      icon: Settings,
      roles: ['Super Admin', 'Admin / Manager'],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/60 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } print:hidden`}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
              <Boxes className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-wide flex items-center gap-1">
                MAXPACK <span className="text-[10px] text-emerald-400 font-semibold px-1 rounded bg-emerald-950 border border-emerald-800">UAE</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Enterprise ERP System</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations & Modules
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme Quick Toggle & Bottom Cloud Database Callout */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 space-y-2">
          <button
            id="btn-sidebar-theme-toggle"
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
            title="Toggle Light/Dark Theme"
          >
            <div className="flex items-center gap-2">
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span>{resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
              Toggle
            </span>
          </button>

          <button
            onClick={onOpenSheetsGuide}
            className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-600/40 text-left transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Sheets DB</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold group-hover:underline">Setup</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              23 synced tables for Maxpack UAE operations.
            </p>
          </button>
        </div>
      </aside>
    </>
  );
};
