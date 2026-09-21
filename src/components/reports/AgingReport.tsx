import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext.tsx';
import { Customer, SalesInvoice, Supplier, SupplierBill } from '../../types/erp.ts';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface AgingReportProps {
  invoices: SalesInvoice[];
  customers: Customer[];
  bills: SupplierBill[];
  suppliers: Supplier[];
}

export const AgingReport: React.FC<AgingReportProps> = ({
  invoices,
  customers,
  bills,
  suppliers,
}) => {
  const { formatAED, formatUAE } = useErp();
  const [agingType, setAgingType] = useState<'receivable' | 'payable'>('receivable');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'moderate' | 'current'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = new Date();

  // Helper to calculate days overdue
  const getDaysOverdue = (dueDateStr?: string, dateStr?: string) => {
    const targetDate = new Date(dueDateStr || dateStr || Date.now());
    const diffTime = today.getTime() - targetDate.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  // Compute Receivables Aging (Customer Invoices)
  const customerAgingMap: Record<
    string,
    {
      id: string;
      name: string;
      trn?: string;
      terms?: string;
      totalDue: number;
      current: number; // 0-30 days
      days31_60: number; // 31-60 days
      days61_90: number; // 61-90 days
      days90Plus: number; // 90+ days
      invoices: Array<{
        invoiceNumber: string;
        date: string;
        dueDate?: string;
        total: number;
        balanceDue: number;
        daysOverdue: number;
      }>;
    }
  > = {};

  customers.forEach((c) => {
    customerAgingMap[c.id] = {
      id: c.id,
      name: c.companyName,
      trn: c.trn,
      terms: c.paymentTerms,
      totalDue: 0,
      current: 0,
      days31_60: 0,
      days61_90: 0,
      days90Plus: 0,
      invoices: [],
    };
  });

  invoices.forEach((inv) => {
    const balance = inv.balanceDue || 0;
    if (balance <= 0) return; // ignore fully paid

    if (!customerAgingMap[inv.customerId]) {
      customerAgingMap[inv.customerId] = {
        id: inv.customerId,
        name: inv.customerName,
        totalDue: 0,
        current: 0,
        days31_60: 0,
        days61_90: 0,
        days90Plus: 0,
        invoices: [],
      };
    }

    const item = customerAgingMap[inv.customerId];
    item.totalDue += balance;

    const days = getDaysOverdue(inv.dueDate, inv.date);
    if (days <= 30) {
      item.current += balance;
    } else if (days <= 60) {
      item.days31_60 += balance;
    } else if (days <= 90) {
      item.days61_90 += balance;
    } else {
      item.days90Plus += balance;
    }

    item.invoices.push({
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      dueDate: inv.dueDate,
      total: inv.total,
      balanceDue: balance,
      daysOverdue: days,
    });
  });

  // Compute Payables Aging (Supplier Bills)
  const supplierAgingMap: Record<
    string,
    {
      id: string;
      name: string;
      trn?: string;
      terms?: string;
      totalDue: number;
      current: number;
      days31_60: number;
      days61_90: number;
      days90Plus: number;
      bills: Array<{
        billNumber: string;
        date: string;
        dueDate: string;
        total: number;
        balanceDue: number;
        daysOverdue: number;
      }>;
    }
  > = {};

  suppliers.forEach((s) => {
    supplierAgingMap[s.id] = {
      id: s.id,
      name: s.name,
      trn: s.trn,
      terms: s.paymentTerms,
      totalDue: 0,
      current: 0,
      days31_60: 0,
      days61_90: 0,
      days90Plus: 0,
      bills: [],
    };
  });

  bills.forEach((b) => {
    const balance = b.balanceDue || 0;
    if (balance <= 0) return;

    if (!supplierAgingMap[b.supplierId]) {
      supplierAgingMap[b.supplierId] = {
        id: b.supplierId,
        name: b.supplierName,
        totalDue: 0,
        current: 0,
        days31_60: 0,
        days61_90: 0,
        days90Plus: 0,
        bills: [],
      };
    }

    const item = supplierAgingMap[b.supplierId];
    item.totalDue += balance;

    const days = getDaysOverdue(b.dueDate, b.date);
    if (days <= 30) {
      item.current += balance;
    } else if (days <= 60) {
      item.days31_60 += balance;
    } else if (days <= 90) {
      item.days61_90 += balance;
    } else {
      item.days90Plus += balance;
    }

    item.bills.push({
      billNumber: b.billNumber,
      date: b.date,
      dueDate: b.dueDate,
      total: b.total,
      balanceDue: balance,
      daysOverdue: days,
    });
  });

  const activeDataList =
    agingType === 'receivable'
      ? Object.values(customerAgingMap).filter((c) => c.totalDue > 0)
      : Object.values(supplierAgingMap).filter((s) => s.totalDue > 0);

  // Overall totals
  const totalAgingOutstanding = activeDataList.reduce((acc, i) => acc + i.totalDue, 0);
  const totalCurrent = activeDataList.reduce((acc, i) => acc + i.current, 0);
  const total31_60 = activeDataList.reduce((acc, i) => acc + i.days31_60, 0);
  const total61_90 = activeDataList.reduce((acc, i) => acc + i.days61_90, 0);
  const total90Plus = activeDataList.reduce((acc, i) => acc + i.days90Plus, 0);

  // Filter list
  const filteredList = activeDataList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.trn && item.trn.includes(searchQuery));

    if (!matchesSearch) return false;

    if (riskFilter === 'critical') return item.days90Plus > 0;
    if (riskFilter === 'high') return item.days61_90 > 0 && item.days90Plus === 0;
    if (riskFilter === 'moderate') return item.days31_60 > 0 && item.days61_90 === 0 && item.days90Plus === 0;
    if (riskFilter === 'current') return item.current === item.totalDue;
    return true;
  });

  const getRiskBadge = (item: { days90Plus: number; days61_90: number; days31_60: number; current: number }) => {
    if (item.days90Plus > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 w-fit">
          <ShieldAlert className="w-3 h-3" /> Critical (90+d)
        </span>
      );
    }
    if (item.days61_90 > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 w-fit">
          High Risk (61-90d)
        </span>
      );
    }
    if (item.days31_60 > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 w-fit">
          Moderate (31-60d)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 w-fit">
        Current (0-30d)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setAgingType('receivable');
              setExpandedId(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              agingType === 'receivable'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Accounts Receivable Aging (Customers)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              A/R
            </span>
          </button>
          <button
            onClick={() => {
              setAgingType('payable');
              setExpandedId(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              agingType === 'payable'
                ? 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Accounts Payable Aging (Suppliers)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              A/P
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aging computed relative to official UAE payment terms and invoice due dates.
        </p>
      </div>

      {/* Summary KPI Bracket Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Outstanding
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
            {formatAED(totalAgingOutstanding)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{activeDataList.length} accounts</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
            Current (0-30 Days)
          </span>
          <p className="text-xl font-black text-emerald-800 dark:text-emerald-400 font-mono mt-1">
            {formatAED(totalCurrent)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {totalAgingOutstanding > 0 ? `${((totalCurrent / totalAgingOutstanding) * 100).toFixed(0)}% of total` : '0%'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
            31 - 60 Days
          </span>
          <p className="text-xl font-black text-blue-700 dark:text-blue-400 font-mono mt-1">
            {formatAED(total31_60)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Follow-up phase</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            61 - 90 Days
          </span>
          <p className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
            {formatAED(total61_90)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">High escalation</span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
            90+ Days Critical
          </span>
          <p className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">
            {formatAED(total90Plus)}
          </p>
          <span className="text-[10px] text-rose-500 mt-0.5 block">Legal recovery alert</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${agingType === 'receivable' ? 'customer' : 'supplier'} or TRN...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">Risk:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical (90+ Days)</option>
            <option value="high">High (61-90 Days)</option>
            <option value="moderate">Moderate (31-60 Days)</option>
            <option value="current">Current (0-30 Days)</option>
          </select>
        </div>
      </div>

      {/* Aging Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">{agingType === 'receivable' ? 'Customer Account' : 'Supplier Account'}</th>
                <th className="py-3.5 px-3 text-right">Total Due (AED)</th>
                <th className="py-3.5 px-3 text-right text-emerald-700 dark:text-emerald-400">Current (0-30d)</th>
                <th className="py-3.5 px-3 text-right text-blue-700 dark:text-blue-400">31-60d</th>
                <th className="py-3.5 px-3 text-right text-amber-700 dark:text-amber-400">61-90d</th>
                <th className="py-3.5 px-3 text-right text-rose-700 dark:text-rose-400">90+ Days</th>
                <th className="py-3.5 px-3">Aging Risk</th>
                <th className="py-3.5 px-4 text-center">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No overdue balances matching criteria</p>
                    <p className="text-[11px] text-slate-400">All accounts are settled or within terms</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((row: any) => {
                  const isExpanded = expandedId === row.id;
                  const records = row.invoices || row.bills || [];
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{row.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                TRN: {row.trn || 'Not Registered'} • Terms: {row.terms || 'Net 30'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                          {formatAED(row.totalDue)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400">
                          {row.current > 0 ? formatAED(row.current) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-blue-700 dark:text-blue-400">
                          {row.days31_60 > 0 ? formatAED(row.days31_60) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-700 dark:text-amber-400">
                          {row.days61_90 > 0 ? formatAED(row.days61_90) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-700 dark:text-rose-400 font-bold">
                          {row.days90Plus > 0 ? formatAED(row.days90Plus) : '-'}
                        </td>
                        <td className="py-3 px-3">{getRiskBadge(row)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
                            <span>{records.length}</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Sub-table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 dark:bg-slate-850/80">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                                Unsettled Documents for {row.name}:
                              </h4>
                              <div className="space-y-2">
                                {records.map((doc: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex flex-wrap items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-100 dark:border-slate-700 gap-2"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                                        {doc.invoiceNumber || doc.billNumber}
                                      </span>
                                      <span className="text-slate-400 text-[11px]">
                                        Dated: {formatUAE(doc.date)}
                                      </span>
                                      {doc.dueDate && (
                                        <span className="text-slate-400 text-[11px]">
                                          Due: {formatUAE(doc.dueDate)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 font-mono">
                                      <span className="text-slate-500">Total: {formatAED(doc.total)}</span>
                                      <span className="text-rose-700 dark:text-rose-400 font-bold">
                                        Balance Due: {formatAED(doc.balanceDue)}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        doc.daysOverdue > 90 ? 'bg-rose-100 text-rose-800' :
                                        doc.daysOverdue > 60 ? 'bg-amber-100 text-amber-800' :
                                        doc.daysOverdue > 30 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {doc.daysOverdue === 0 ? 'Due Today' : `${doc.daysOverdue} Days Overdue`}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
