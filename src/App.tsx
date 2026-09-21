import React, { useState } from 'react';
import { ErpProvider, useErp } from './context/ErpContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TaxInvoiceModal } from './components/TaxInvoiceModal.tsx';
import { ThermalReceiptModal } from './components/ThermalReceiptModal.tsx';
import { GoogleSheetsGuideModal } from './components/GoogleSheetsGuideModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';

// Views
import { DashboardView } from './views/DashboardView.tsx';
import { SalesView } from './views/SalesView.tsx';
import { PosView } from './views/PosView.tsx';
import { InventoryView } from './views/InventoryView.tsx';
import { PurchasesView } from './views/PurchasesView.tsx';
import { AccountingView } from './views/AccountingView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { TeamView } from './views/TeamView.tsx';
import { AuditLogsView } from './views/AuditLogsView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

import { SalesInvoice, POSTransaction } from './types/erp.ts';
import { Menu, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { toast, showAuthModal, setShowAuthModal } = useErp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<POSTransaction | null>(null);
  const [showSheetsGuide, setShowSheetsGuide] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
          />
        );
      case 'sales':
        return (
          <SalesView
            onViewInvoice={(inv) => setSelectedInvoice(inv)}
          />
        );
      case 'pos':
        return (
          <PosView
            onPrintReceipt={(tx) => setSelectedReceipt(tx)}
          />
        );
      case 'inventory':
        return <InventoryView />;
      case 'purchases':
        return <PurchasesView />;
      case 'accounting':
        return <AccountingView />;
      case 'reports':
        return <ReportsView />;
      case 'team':
        return <TeamView />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'settings':
        return (
          <SettingsView
            onOpenSheetsGuide={() => setShowSheetsGuide(true)}
          />
        );
      default:
        return (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-150">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white ${
              toast.type === 'success'
                ? 'bg-emerald-600'
                : toast.type === 'error'
                ? 'bg-rose-600'
                : 'bg-slate-900 dark:bg-slate-800 border border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            ) : (
              <Info className="w-4 h-4 text-slate-300" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onOpenSheetsGuide={() => setShowSheetsGuide(true)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <div className="flex items-center">
          {/* Mobile menu trigger button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <Header
              activeTab={activeTab}
              onOpenSheetsGuide={() => setShowSheetsGuide(true)}
            />
          </div>
        </div>

        {/* View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <TaxInvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onInvoiceUpdated={() => {
          // invoice updated trigger
        }}
      />

      <ThermalReceiptModal
        transaction={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      <GoogleSheetsGuideModal
        isOpen={showSheetsGuide}
        onClose={() => setShowSheetsGuide(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErpProvider>
      <MainLayout />
    </ErpProvider>
  );
}
