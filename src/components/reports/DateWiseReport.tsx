import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext.tsx';
import { Expense, SalesInvoice, SupplierBill } from '../../types/erp.ts';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

interface DateWiseReportProps {
  invoices: SalesInvoice[];
  bills: SupplierBill[];
  expenses: Expense[];
}

export const DateWiseReport: React.FC<DateWiseReportProps> = ({ invoices, bills, expenses }) => {
  const { formatAED, formatUAE } = useErp();
  const [rangePreset, setRangePreset] = useState<'7days' | '14days' | 'thisMonth' | 'lastMonth' | 'all' | 'custom'>('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const now = new Date();

  // Determine effective start and end dates
  const { filterStart, filterEnd } = useMemo(() => {
    let start = new Date(0);
    let end = new Date();

    if (rangePreset === '7days') {
      start = new Date();
      start.setDate(end.getDate() - 7);
    } else if (rangePreset === '14days') {
      start = new Date();
      start.setDate(end.getDate() - 14);
    } else if (rangePreset === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (rangePreset === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (rangePreset === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59);
    }

    return { filterStart: start, filterEnd: end };
  }, [rangePreset, startDate, endDate]);

  // Aggregate data by unique date
  const dateMap: Record<
    string,
    {
      date: string;
      invoicesCount: number;
      sales: number;
      vat: number;
      purchases: number;
      expenses: number;
      netMargin: number;
    }
  > = {};

  // Group Invoices
  invoices.forEach((inv) => {
    if (!inv.date) return;
    const invDate = new Date(inv.date);
    if (rangePreset !== 'all' && (invDate < filterStart || invDate > filterEnd)) return;

    const dateKey = inv.date.slice(0, 10);
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {
        date: dateKey,
        invoicesCount: 0,
        sales: 0,
        vat: 0,
        purchases: 0,
        expenses: 0,
        netMargin: 0,
      };
    }
    dateMap[dateKey].invoicesCount += 1;
    dateMap[dateKey].sales += inv.total || 0;
    dateMap[dateKey].vat += inv.vatAmount || 0;
  });

  // Group Supplier Bills (Purchases)
  bills.forEach((b) => {
    if (!b.date) return;
    const billDate = new Date(b.date);
    if (rangePreset !== 'all' && (billDate < filterStart || billDate > filterEnd)) return;

    const dateKey = b.date.slice(0, 10);
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {
        date: dateKey,
        invoicesCount: 0,
        sales: 0,
        vat: 0,
        purchases: 0,
        expenses: 0,
        netMargin: 0,
      };
    }
    dateMap[dateKey].purchases += b.total || 0;
  });

  // Group Expenses
  expenses.forEach((e) => {
    if (!e.date) return;
    const expDate = new Date(e.date);
    if (rangePreset !== 'all' && (expDate < filterStart || expDate > filterEnd)) return;

    const dateKey = e.date.slice(0, 10);
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {
        date: dateKey,
        invoicesCount: 0,
        sales: 0,
        vat: 0,
        purchases: 0,
        expenses: 0,
        netMargin: 0,
      };
    }
    dateMap[dateKey].expenses += e.amount || 0;
  });

  // Sort dates descending (newest first)
  const sortedDateRows = Object.values(dateMap)
    .map((row) => ({
      ...row,
      netMargin: row.sales - row.purchases - row.expenses,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Period Aggregates
  const totalPeriodSales = sortedDateRows.reduce((acc, r) => acc + r.sales, 0);
  const totalPeriodVat = sortedDateRows.reduce((acc, r) => acc + r.vat, 0);
  const totalPeriodPurchases = sortedDateRows.reduce((acc, r) => acc + r.purchases, 0);
  const totalPeriodExpenses = sortedDateRows.reduce((acc, r) => acc + r.expenses, 0);
  const totalPeriodNetMargin = totalPeriodSales - totalPeriodPurchases - totalPeriodExpenses;

  return (
    <div className="space-y-6">
      {/* Top Header & Range Selection */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Date-Wise Commercial Performance & Daily Profitability
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological breakdown of sales, 5% VAT, procurement outlays, and net cashflow.
          </p>
        </div>

        {/* Date Filter Presets */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setRangePreset('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              rangePreset === '7days'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setRangePreset('14days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              rangePreset === '14days'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Last 14 Days
          </button>
          <button
            onClick={() => setRangePreset('thisMonth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              rangePreset === 'thisMonth'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setRangePreset('lastMonth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              rangePreset === 'lastMonth'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setRangePreset('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              rangePreset === 'all'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setRangePreset('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              rangePreset === 'custom'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Input Bar if Selected */}
      {rangePreset === 'custom' && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
          <span className="font-semibold text-slate-700 dark:text-slate-300">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Revenue</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            {formatAED(totalPeriodSales)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Across {sortedDateRows.reduce((a, b) => a + b.invoicesCount, 0)} tax invoices
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
            Output VAT 5%
          </span>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono mt-2">
            {formatAED(totalPeriodVat)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Taxable liability to FTA</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            Purchases & Expenses
          </span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-2">
            {formatAED(totalPeriodPurchases + totalPeriodExpenses)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Raw materials: {formatAED(totalPeriodPurchases)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
            Net Daily Margin
          </span>
          <p className="text-2xl font-black text-emerald-800 dark:text-emerald-400 font-mono mt-2">
            {formatAED(totalPeriodNetMargin)}
          </p>
          <span className="text-[10px] text-emerald-600 mt-1 block">
            {totalPeriodSales > 0 ? `${((totalPeriodNetMargin / totalPeriodSales) * 100).toFixed(1)}% operating margin` : '0%'}
          </span>
        </div>
      </div>

      {/* Date Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Operating Date</th>
                <th className="py-3.5 px-3 text-center">Invoices</th>
                <th className="py-3.5 px-3 text-right">Gross Sales (AED)</th>
                <th className="py-3.5 px-3 text-right">Output VAT 5%</th>
                <th className="py-3.5 px-3 text-right">Supplier Purchases</th>
                <th className="py-3.5 px-3 text-right">Operating Expenses</th>
                <th className="py-3.5 px-4 text-right">Daily Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {sortedDateRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No activity in selected period</p>
                    <p className="text-[11px] text-slate-400">Try selecting a broader date range above</p>
                  </td>
                </tr>
              ) : (
                sortedDateRows.map((row) => {
                  const isPositive = row.netMargin >= 0;
                  return (
                    <tr key={row.date} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition font-mono">
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatUAE(row.date)}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                          {row.invoicesCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                        {formatAED(row.sales)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-500">
                        {formatAED(row.vat)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-amber-700 dark:text-amber-400">
                        {row.purchases > 0 ? formatAED(row.purchases) : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-500">
                        {row.expenses > 0 ? formatAED(row.expenses) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-black text-sm ${
                            isPositive ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {formatAED(row.netMargin)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sortedDateRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 font-mono font-bold text-xs">
                  <td className="py-3 px-4 font-sans uppercase text-slate-900 dark:text-slate-100">Period Total</td>
                  <td className="py-3 px-3 text-center">
                    {sortedDateRows.reduce((a, b) => a + b.invoicesCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                    {formatAED(totalPeriodSales)}
                  </td>
                  <td className="py-3 px-3 text-right">{formatAED(totalPeriodVat)}</td>
                  <td className="py-3 px-3 text-right text-amber-700 dark:text-amber-400">
                    {formatAED(totalPeriodPurchases)}
                  </td>
                  <td className="py-3 px-3 text-right">{formatAED(totalPeriodExpenses)}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-800 dark:text-emerald-400 text-sm">
                    {formatAED(totalPeriodNetMargin)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
