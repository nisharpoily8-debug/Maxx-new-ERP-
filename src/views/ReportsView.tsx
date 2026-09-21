import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import {
  Product,
  Customer,
  SalesInvoice,
  Warehouse,
  SupplierBill,
  Supplier,
  Expense
} from '../types/erp.ts';
import {
  TrendingUp,
  Download,
  Building2,
  Package,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Clock,
  CreditCard,
  Users,
  Printer,
  FileText
} from 'lucide-react';
import { AgingReport } from '../components/reports/AgingReport.tsx';
import { PayableReport } from '../components/reports/PayableReport.tsx';
import { CustomerWiseReport } from '../components/reports/CustomerWiseReport.tsx';
import { DateWiseReport } from '../components/reports/DateWiseReport.tsx';
import { exportToCSV } from '../utils/exportUtils.ts';

type ReportTab = 'aging' | 'payable' | 'customer-wise' | 'date-wise' | 'overview';

export const ReportsView: React.FC = () => {
  const { formatAED, formatUAE } = useErp();
  const [activeTab, setActiveTab] = useState<ReportTab>('aging');
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bills, setBills] = useState<SupplierBill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllReportData();
  }, []);

  const loadAllReportData = async () => {
    try {
      setLoading(true);
      const [st, invs, prods, custs, whs, blls, sups, exps] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getInvoices().catch(() => []),
        api.getProducts().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getWarehouses().catch(() => []),
        api.getSupplierBills().catch(() => []),
        api.getSuppliers().catch(() => []),
        api.getExpenses().catch(() => []),
      ]);
      setStats(st);
      setInvoices(invs || []);
      setProducts(prods || []);
      setCustomers(custs || []);
      setWarehouses(whs || []);
      setBills(blls || []);
      setSuppliers(sups || []);
      setExpenses(exps || []);
    } catch (e) {
      console.error('Error loading reports data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Executive Overview Calculations
  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const paidRevenue = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0);
  const averageOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

  // Monthly breakdown from real invoices
  const monthsMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    const d = new Date(inv.date);
    const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    monthsMap[key] = (monthsMap[key] || 0) + inv.total;
  });
  const monthlySalesData = Object.entries(monthsMap).map(([month, sales]) => ({
    month,
    sales,
  }));

  // Category breakdown from products
  const categoryMap: Record<string, number> = {};
  products.forEach((p) => {
    const val = p.stockQuantity * p.sellingPrice;
    categoryMap[p.category] = (categoryMap[p.category] || 0) + val;
  });
  const totalCatVal = Object.values(categoryMap).reduce((a, b) => a + b, 0);
  const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
    pct: totalCatVal > 0 ? Math.round((value / totalCatVal) * 100) : 0,
    color: 'bg-emerald-600',
  }));

  // Warehouse valuation from real products
  const warehouseValuation = warehouses.map((wh) => {
    let whValue = 0;
    let whItems = 0;
    products.forEach((p) => {
      const stock = p.warehouseStocks?.[wh.id] || 0;
      whItems += stock;
      whValue += stock * p.costPrice;
    });
    return {
      name: wh.name,
      location: wh.location,
      value: whValue,
      items: whItems,
    };
  });

  // Top customers by invoice totals
  const customerSpendMap: Record<string, { name: string; revenue: number; orders: number; balance: number }> = {};
  invoices.forEach((inv) => {
    if (!customerSpendMap[inv.customerId]) {
      customerSpendMap[inv.customerId] = {
        name: inv.customerName,
        revenue: 0,
        orders: 0,
        balance: 0,
      };
    }
    customerSpendMap[inv.customerId].revenue += inv.total;
    customerSpendMap[inv.customerId].orders += 1;
    customerSpendMap[inv.customerId].balance += inv.balanceDue;
  });
  const topCustomers = Object.values(customerSpendMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // --- Dynamic Export Handler ---
  const handleExportCSV = () => {
    const today = new Date();

    if (activeTab === 'aging') {
      const headers = [
        'Customer / Supplier',
        'Type',
        'TRN',
        'Total Due (AED)',
        'Current (0-30 Days)',
        '31-60 Days',
        '61-90 Days',
        '90+ Days Critical',
        'Payment Terms',
      ];

      const rows: (string | number)[][] = [];

      // Receivables Aging
      customers.forEach((c) => {
        const custInvoices = invoices.filter((i) => i.customerId === c.id && (i.balanceDue || 0) > 0);
        if (custInvoices.length === 0) return;

        let cur = 0, d30 = 0, d60 = 0, d90 = 0, tot = 0;
        custInvoices.forEach((inv) => {
          const diff = Math.max(
            0,
            Math.floor((today.getTime() - new Date(inv.dueDate || inv.date).getTime()) / (1000 * 60 * 60 * 24))
          );
          const bal = inv.balanceDue || 0;
          tot += bal;
          if (diff <= 30) cur += bal;
          else if (diff <= 60) d30 += bal;
          else if (diff <= 90) d60 += bal;
          else d90 += bal;
        });

        rows.push([
          c.companyName,
          'Customer (A/R)',
          c.trn || 'N/A',
          tot.toFixed(2),
          cur.toFixed(2),
          d30.toFixed(2),
          d60.toFixed(2),
          d90.toFixed(2),
          c.paymentTerms || 'Net 30',
        ]);
      });

      // Payables Aging
      suppliers.forEach((s) => {
        const supBills = bills.filter((b) => b.supplierId === s.id && (b.balanceDue || 0) > 0);
        if (supBills.length === 0) return;

        let cur = 0, d30 = 0, d60 = 0, d90 = 0, tot = 0;
        supBills.forEach((b) => {
          const diff = Math.max(
            0,
            Math.floor((today.getTime() - new Date(b.dueDate || b.date).getTime()) / (1000 * 60 * 60 * 24))
          );
          const bal = b.balanceDue || 0;
          tot += bal;
          if (diff <= 30) cur += bal;
          else if (diff <= 60) d30 += bal;
          else if (diff <= 90) d60 += bal;
          else d90 += bal;
        });

        rows.push([
          s.name,
          'Supplier (A/P)',
          s.trn || 'N/A',
          tot.toFixed(2),
          cur.toFixed(2),
          d30.toFixed(2),
          d60.toFixed(2),
          d90.toFixed(2),
          s.paymentTerms || 'Net 30',
        ]);
      });

      exportToCSV('Maxpack_Aging_Report', headers, rows, {
        title: 'Accounts Receivable & Accounts Payable Aging Schedule',
      });
    } else if (activeTab === 'payable') {
      const headers = [
        'Bill Number',
        'Supplier Name',
        'Bill Date',
        'Due Date',
        'Total Amount (AED)',
        'Paid Amount (AED)',
        'Balance Due (AED)',
        'Status',
      ];

      const rows = bills.map((b) => [
        b.billNumber,
        b.supplierName,
        b.date,
        b.dueDate,
        b.total.toFixed(2),
        (b.paidAmount || 0).toFixed(2),
        (b.balanceDue || 0).toFixed(2),
        b.status,
      ]);

      exportToCSV('Maxpack_Accounts_Payable_Report', headers, rows, {
        title: 'Supplier Payables & Vendor Liabilities Register',
      });
    } else if (activeTab === 'customer-wise') {
      const headers = [
        'Customer Name',
        'TRN',
        'City / Location',
        'Invoices Count',
        'Gross Invoiced (AED)',
        'Output VAT (AED)',
        'Paid Amount (AED)',
        'Balance Due (AED)',
        'Credit Limit (AED)',
        'Credit Utilization %',
        'Payment Terms',
      ];

      const rows = customers.map((c) => {
        const custInvoices = invoices.filter((i) => i.customerId === c.id);
        const invoiced = custInvoices.reduce((a, b) => a + (b.total || 0), 0);
        const vat = custInvoices.reduce((a, b) => a + (b.vatAmount || 0), 0);
        const paid = custInvoices.reduce((a, b) => a + (b.paidAmount || 0), 0);
        const bal = custInvoices.reduce((a, b) => a + (b.balanceDue || 0), 0);
        const limit = c.creditLimit || 50000;
        const util = limit > 0 ? ((bal / limit) * 100).toFixed(1) : '0';

        return [
          c.companyName,
          c.trn || 'N/A',
          c.emirate || 'Dubai',
          custInvoices.length,
          invoiced.toFixed(2),
          vat.toFixed(2),
          paid.toFixed(2),
          bal.toFixed(2),
          limit.toFixed(2),
          `${util}%`,
          c.paymentTerms || 'Net 30',
        ];
      });

      exportToCSV('Maxpack_Customer_Wise_Report', headers, rows, {
        title: 'Customer-Wise Commercial Sales & Receivables Ledger',
      });
    } else if (activeTab === 'date-wise') {
      const headers = [
        'Date',
        'Invoices Count',
        'Gross Sales (AED)',
        'Output VAT 5% (AED)',
        'Supplier Purchases (AED)',
        'Operating Expenses (AED)',
        'Net Daily Margin (AED)',
      ];

      const dateMap: Record<
        string,
        { count: number; sales: number; vat: number; purchases: number; expenses: number }
      > = {};

      invoices.forEach((i) => {
        if (!i.date) return;
        const d = i.date.slice(0, 10);
        if (!dateMap[d]) dateMap[d] = { count: 0, sales: 0, vat: 0, purchases: 0, expenses: 0 };
        dateMap[d].count += 1;
        dateMap[d].sales += i.total || 0;
        dateMap[d].vat += i.vatAmount || 0;
      });

      bills.forEach((b) => {
        if (!b.date) return;
        const d = b.date.slice(0, 10);
        if (!dateMap[d]) dateMap[d] = { count: 0, sales: 0, vat: 0, purchases: 0, expenses: 0 };
        dateMap[d].purchases += b.total || 0;
      });

      expenses.forEach((e) => {
        if (!e.date) return;
        const d = e.date.slice(0, 10);
        if (!dateMap[d]) dateMap[d] = { count: 0, sales: 0, vat: 0, purchases: 0, expenses: 0 };
        dateMap[d].expenses += e.amount || 0;
      });

      const rows = Object.entries(dateMap)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([date, d]) => [
          date,
          d.count,
          d.sales.toFixed(2),
          d.vat.toFixed(2),
          d.purchases.toFixed(2),
          d.expenses.toFixed(2),
          (d.sales - d.purchases - d.expenses).toFixed(2),
        ]);

      exportToCSV('Maxpack_Date_Wise_Report', headers, rows, {
        title: 'Date-Wise Operational Sales & Financial Performance',
      });
    } else {
      // Overview
      const headers = ['Metric', 'Value', 'Details'];
      const rows = [
        ['Total Gross Revenue', totalRevenue.toFixed(2), 'AED from all tax invoices'],
        ['Total Collected', paidRevenue.toFixed(2), 'AED settled revenue'],
        ['Total Receivables', (totalRevenue - paidRevenue).toFixed(2), 'AED uncollected client balances'],
        ['Warehouse Inventory Holding', totalInventoryValue.toFixed(2), 'AED asset valuation'],
        ['Average Order Value', averageOrderValue.toFixed(2), 'AED average invoice ticket'],
      ];

      exportToCSV('Maxpack_Financial_Overview', headers, rows, {
        title: 'Executive Financial & Operational Summary',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Generating live financial reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              UAE Commercial Financial & Operational Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compliant with UAE Federal Tax Authority (FTA) requirements. Real-time ledger, aging, payables, customer turnover, and date-wise performance.
          </p>
        </div>

        {/* Global Export Options */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            title="Export this report to Excel-compatible CSV format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel / CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Reports Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('aging')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'aging'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Aging Report (A/R & A/P)</span>
        </button>

        <button
          onClick={() => setActiveTab('payable')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'payable'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Accounts Payable (Bills)</span>
        </button>

        <button
          onClick={() => setActiveTab('customer-wise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'customer-wise'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customer-Wise Sales</span>
        </button>

        <button
          onClick={() => setActiveTab('date-wise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'date-wise'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Date-Wise Performance</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Executive Overview</span>
        </button>
      </div>

      {/* Tab Content Rendering */}
      {activeTab === 'aging' && (
        <AgingReport
          invoices={invoices}
          customers={customers}
          bills={bills}
          suppliers={suppliers}
        />
      )}

      {activeTab === 'payable' && (
        <PayableReport bills={bills} suppliers={suppliers} />
      )}

      {activeTab === 'customer-wise' && (
        <CustomerWiseReport customers={customers} invoices={invoices} />
      )}

      {activeTab === 'date-wise' && (
        <DateWiseReport invoices={invoices} bills={bills} expenses={expenses} />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
                {formatAED(totalRevenue)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {invoices.length} billed invoices
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Collected Payments</span>
              <p className="text-2xl font-black text-emerald-800 dark:text-emerald-400 mt-1 font-mono">
                {formatAED(paidRevenue)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {totalRevenue > 0 ? `${((paidRevenue / totalRevenue) * 100).toFixed(1)}% recovery rate` : '0% recovery rate'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Warehouse Inventory Holding</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
                {formatAED(totalInventoryValue)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {products.length} catalog items across hubs
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Order Value (AOV)</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
                {formatAED(averageOrderValue)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Live invoice mean</span>
            </div>
          </div>

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sales Trend Bar Visualizer */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Revenue Growth Trend</h2>
                  <p className="text-[11px] text-slate-500">Monthly wholesale & retail invoice receipts in AED</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
                  Live Audit Log
                </span>
              </div>

              {/* Clean Responsive Bar Chart */}
              <div className="pt-4 pb-2 space-y-4">
                {monthlySalesData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No sales records to plot</p>
                    <p className="text-xs text-slate-400 mt-1">Generate invoices or POS sales to view month-on-month trendlines.</p>
                  </div>
                ) : (
                  monthlySalesData.map((d) => {
                    const maxSales = Math.max(...monthlySalesData.map((m) => m.sales), 1000);
                    const barWidth = `${Math.min(100, Math.max(5, (d.sales / maxSales) * 100))}%`;
                    return (
                      <div key={d.month} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700 dark:text-slate-300">{d.month}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatAED(d.sales)}</span>
                        </div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                          <div
                            style={{ width: barWidth }}
                            className="bg-emerald-800 hover:bg-emerald-600 transition-all rounded-lg"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Product Category Revenue Breakdown */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Category Valuation</h2>
                <p className="text-[11px] text-slate-500">Holding asset allocation across categories</p>
              </div>

              <div className="space-y-3 pt-2">
                {categoryBreakdown.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No product inventory</p>
                    <p className="text-xs text-slate-400 mt-1">Categories will populate automatically as items are added.</p>
                  </div>
                ) : (
                  categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                        <span className="font-mono font-bold">{cat.pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${cat.pct}%` }}
                          className="h-full rounded-full bg-emerald-600"
                        />
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-mono">
                        {formatAED(cat.value)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Warehouse Holding & Top Customers Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouse Holdings */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Warehouse Stock Valuation</h2>
              </div>

              <div className="space-y-3">
                {warehouseValuation.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No warehouses found</p>
                ) : (
                  warehouseValuation.map((wh) => (
                    <div
                      key={wh.name}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{wh.name}</p>
                        <p className="text-[11px] text-slate-500">{wh.items} physical units stored</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatAED(wh.value)}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                          {wh.location}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top UAE Corporate Accounts */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Top Corporate Packaging Accounts</h2>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {topCustomers.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No customer transactions</p>
                    <p className="text-xs text-slate-400 mt-1">Top buyers will rank here as invoices are issued.</p>
                  </div>
                ) : (
                  topCustomers.map((cust) => (
                    <div key={cust.name} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{cust.name}</p>
                        <p className="text-[10px] text-slate-500">{cust.orders} fulfilled shipments</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{formatAED(cust.revenue)}</p>
                        <p className="text-[10px] text-slate-400">Bal: {formatAED(cust.balance)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
