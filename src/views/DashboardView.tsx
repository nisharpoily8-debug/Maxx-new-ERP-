import React, { useState, useEffect } from 'react';
import { useErp } from '../../src/context/ErpContext.tsx';
import { api } from '../../src/services/api.ts';
import { DashboardStats, SalesInvoice } from '../../src/types/erp.ts';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onSelectInvoice?: (invoice: SalesInvoice) => void;
  onViewInvoice?: (invoice: SalesInvoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectInvoice, onViewInvoice }) => {
  const handleSelectInvoice = onSelectInvoice || onViewInvoice || (() => {});
  const { formatAED, formatUAE, selectedWarehouse, can } = useErp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [allInvoices, setAllInvoices] = useState<SalesInvoice[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedWarehouse]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, invs, prods] = await Promise.all([
        api.getDashboardStats(selectedWarehouse),
        api.getInvoices(),
        api.getProducts(),
      ]);
      setStats(s);
      setAllInvoices(invs || []);
      setInvoices((invs || []).slice(0, 6));
      setLowStockProducts(prods.filter(p => p.stockQuantity <= p.reorderLevel).slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Loading Maxpack ERP metrics...</p>
        </div>
      </div>
    );
  }

  // Daily Sales Trends for Current Month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Map each day of the current month
  const dailySalesData = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const dayInvoices = allInvoices.filter((inv) => {
      if (!inv.date) return false;
      const invDate = new Date(inv.date);
      return (
        invDate.getFullYear() === currentYear &&
        invDate.getMonth() === currentMonth &&
        invDate.getDate() === dayNumber
      );
    });

    const dayTotal = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    return {
      day: `${dayNumber}`,
      sales: Math.round(dayTotal * 100) / 100,
      invoicesCount: dayInvoices.length,
      fullDate: `${dayNumber} ${now.toLocaleString('en-US', { month: 'short' })} ${currentYear}`,
    };
  });

  const monthSalesTotal = dailySalesData.reduce((acc, d) => acc + d.sales, 0);
  const activeDaysCount = dailySalesData.filter((d) => d.sales > 0).length || 1;
  const avgDailySales = Math.round(monthSalesTotal / activeDaysCount);
  const peakDay = dailySalesData.reduce(
    (max, d) => (d.sales > max.sales ? d : max),
    dailySalesData[0] || { day: '1', sales: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Maxpack UAE Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial metrics, inventory movement, and UAE VAT compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {can('sales') && (
            <button
              onClick={() => onNavigate('sales')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          )}

          {can('pos') && (
            <button
              onClick={() => onNavigate('pos')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Open POS Counter</span>
            </button>
          )}

          {can('inventory') && (
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition"
            >
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span>Transfer Stock</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales (AED)</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{formatAED(stats.monthlySales)}</h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-700 font-bold">Includes 5% UAE VAT</span> across B2B & POS
            </p>
          </div>
        </div>

        {/* Accounts Receivable */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receivables (Due)</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-700">{formatAED(stats.receivables)}</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Outstanding payments from {stats.unpaidInvoicesCount} invoices
            </p>
          </div>
        </div>

        {/* POS Counter Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">POS Retail Sales</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{formatAED(stats.cashSalesMonth)}</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Showroom counter transactions
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock SKUs</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-rose-700">{stats.lowStockCount}</h3>
              <span className="text-xs font-semibold text-rose-600">Requires PO Reorder</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Cartons, bubble wraps & stretch films below buffer
            </p>
          </div>
        </div>
      </div>

      {/* Daily Sales Trends - Recharts Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-xl">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Daily Sales Trends — {currentMonthName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time daily sales revenue distribution across all active commercial accounts for the current month.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block font-bold uppercase">Month Sales</span>
              <span className="font-mono font-black text-slate-900 dark:text-slate-100">{formatAED(monthSalesTotal)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block font-bold uppercase">Daily Average</span>
              <span className="font-mono font-black text-emerald-800 dark:text-emerald-400">{formatAED(avgDailySales)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block font-bold uppercase">Peak Day (Day {peakDay.day})</span>
              <span className="font-mono font-black text-amber-700 dark:text-amber-400">{formatAED(peakDay.sales)}</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailySalesData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val: number) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(5, 150, 105, 0.08)' }}
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs font-sans space-y-1">
                        <p className="text-slate-400 text-[11px] font-semibold">{data.fullDate}</p>
                        <p className="text-emerald-400 font-mono font-black text-sm">
                          {formatAED(data.sales)}
                        </p>
                        <p className="text-slate-300 text-[10px]">
                          {data.invoicesCount} {data.invoicesCount === 1 ? 'Tax Invoice' : 'Tax Invoices'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {dailySalesData.map((entry, index) => {
                  const isPeak = entry.day === peakDay.day && entry.sales > 0;
                  const hasSales = entry.sales > 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isPeak ? '#047857' : hasSales ? '#059669' : '#e2e8f0'}
                      className={!hasSales ? 'dark:fill-slate-800' : ''}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* UAE VAT 201 & Financial Summary Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VAT Snapshot Card */}
        <div className="bg-slate-950 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  VAT
                </div>
                <h3 className="font-bold text-sm">UAE Federal Tax Authority (FTA)</h3>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
                Standard 5%
              </span>
            </div>

            <div className="mt-6 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Box 1a: Output VAT (Collected on Sales):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatAED(stats.monthlySales * 0.0476)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Box 8: Input VAT (Recoverable on Buys):</span>
                <span className="font-mono font-bold text-slate-300">
                  {formatAED(stats.purchaseCostsMonth * 0.0476)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-slate-200">
                <span className="font-semibold">Net Estimated Tax Due (FTA Box 9):</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {formatAED(Math.max(0, (stats.monthlySales - stats.purchaseCostsMonth) * 0.0476))}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>TRN: 100234857600003</span>
            <button
              onClick={() => onNavigate('accounting')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>VAT 201 Return</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Low Stock Warning List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Stock Level Alerts</h3>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                View Catalog →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="font-semibold text-slate-600 text-xs">All inventory levels healthy</p>
                  <p className="text-[11px] text-slate-400">No packaging items currently below replenishment thresholds</p>
                </div>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        SKU: {p.sku} • Category: {p.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full font-bold font-mono text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
                        {p.stockQuantity} {p.unit} remaining
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Min alert threshold: {p.reorderLevel} {p.unit}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Automated replenishment logic active</span>
            <button
              onClick={() => onNavigate('purchases')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <span>Create Supplier Purchase Order</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent B2B Tax Invoices</h3>
            <p className="text-xs text-slate-500">Latest packaging dispatches and credit billing</p>
          </div>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            All Invoices ({invoices.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Total (AED)</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 text-xs">No sales invoices recorded yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Create Invoice" above or convert an approved quotation to issue your first tax invoice.</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">{inv.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">TRN: {inv.customerTrn || 'N/A'}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{formatUAE(inv.date)}</td>
                  <td className="py-3 px-3 text-slate-600">{formatUAE(inv.dueDate)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatAED(inv.total)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {formatAED(inv.balanceDue)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.status === 'Partially Paid'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : inv.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleSelectInvoice(inv)}
                      className="px-2.5 py-1 text-slate-700 hover:text-slate-900 font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      View Tax Invoice
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
