import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext.tsx';
import { Customer, SalesInvoice } from '../../types/erp.ts';
import {
  Users,
  Search,
  Filter,
  DollarSign,
  Receipt,
  Building,
  CreditCard,
  ChevronRight,
  TrendingUp,
  MapPin,
  FileText
} from 'lucide-react';

interface CustomerWiseReportProps {
  customers: Customer[];
  invoices: SalesInvoice[];
}

export const CustomerWiseReport: React.FC<CustomerWiseReportProps> = ({ customers, invoices }) => {
  const { formatAED, formatUAE } = useErp();
  const [searchQuery, setSearchQuery] = useState('');
  const [emirateFilter, setEmirateFilter] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Group invoices per customer
  const customerLedger = customers.map((c) => {
    const custInvoices = invoices.filter((inv) => inv.customerId === c.id);
    const totalInvoiced = custInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const totalVat = custInvoices.reduce((acc, inv) => acc + (inv.vatAmount || 0), 0);
    const totalPaid = custInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const balanceDue = custInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

    const creditLimit = c.creditLimit || 50000;
    const creditUtilization = creditLimit > 0 ? Math.min(100, Math.round((balanceDue / creditLimit) * 100)) : 0;

    return {
      ...c,
      invoicesCount: custInvoices.length,
      totalInvoiced,
      totalVat,
      totalPaid,
      balanceDue,
      creditLimit,
      creditUtilization,
      invoices: custInvoices,
    };
  });

  // KPI Calculations
  const totalB2BRevenue = customerLedger.reduce((acc, c) => acc + c.totalInvoiced, 0);
  const totalOutstanding = customerLedger.reduce((acc, c) => acc + c.balanceDue, 0);
  const totalVatCollected = customerLedger.reduce((acc, c) => acc + c.totalVat, 0);
  const topCustomer = [...customerLedger].sort((a, b) => b.totalInvoiced - a.totalInvoiced)[0];

  // Unique Emirates for filter
  const emirates = Array.from(new Set(customers.map((c) => c.emirate || 'Dubai')));

  // Filtered List
  const filteredCustomers = customerLedger.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.trn && c.trn.includes(searchQuery)) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (emirateFilter !== 'all' && (c.emirate || 'Dubai') !== emirateFilter) {
      return false;
    }

    return true;
  });

  const selectedCustomer = customerLedger.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      {/* Top Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Customer-Wise Commercial Sales & Credit Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Account-level revenue analytics, credit utilization limits, and outstanding trade receivables.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total B2B Revenue</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            {formatAED(totalB2BRevenue)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Gross invoiced volume</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            Receivables Balance
          </span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-2">
            {formatAED(totalOutstanding)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Customer credit pending collection</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
            Output VAT Invoiced
          </span>
          <p className="text-2xl font-black text-emerald-800 dark:text-emerald-400 font-mono mt-2">
            {formatAED(totalVatCollected)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">5% UAE FTA taxable value</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Account</span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-2">
            {topCustomer?.companyName || 'N/A'}
          </p>
          <span className="text-xs font-mono font-black text-emerald-800 dark:text-emerald-400 mt-0.5 block">
            {topCustomer ? formatAED(topCustomer.totalInvoiced) : '-'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company, contact person, TRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={emirateFilter}
            onChange={(e) => setEmirateFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="all">All Emirates & Cities</option>
            {emirates.map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Customer Account</th>
                <th className="py-3.5 px-3">City / Emirate</th>
                <th className="py-3.5 px-3 text-center">Invoices</th>
                <th className="py-3.5 px-3 text-right">Gross Sales (AED)</th>
                <th className="py-3.5 px-3 text-right">VAT 5%</th>
                <th className="py-3.5 px-3 text-right">Total Paid</th>
                <th className="py-3.5 px-3 text-right">Balance Due</th>
                <th className="py-3.5 px-4">Credit Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No customers found</p>
                    <p className="text-[11px] text-slate-400">No customer records match your filter criteria</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomerId === cust.id;
                  return (
                    <React.Fragment key={cust.id}>
                      <tr
                        onClick={() => setSelectedCustomerId(isSelected ? null : cust.id)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                          isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{cust.companyName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                TRN: {cust.trn || 'Not Registered'} • Contact: {cust.contactPerson}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {cust.emirate || 'Dubai'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                            {cust.invoicesCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                          {formatAED(cust.totalInvoiced)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {formatAED(cust.totalVat)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400">
                          {formatAED(cust.totalPaid)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-700 dark:text-rose-400">
                          {formatAED(cust.balanceDue)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">
                                {cust.creditUtilization}% of {formatAED(cust.creditLimit)}
                              </span>
                              <span
                                className={`font-bold ${
                                  cust.creditUtilization > 90
                                    ? 'text-rose-600'
                                    : cust.creditUtilization > 60
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {cust.creditUtilization > 100 ? 'Limit Exceeded' : 'Active'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  cust.creditUtilization > 90
                                    ? 'bg-rose-500'
                                    : cust.creditUtilization > 60
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, cust.creditUtilization)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Invoices Breakdown for Selected Customer */}
                      {isSelected && (
                        <tr className="bg-slate-50/80 dark:bg-slate-850/80">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Invoice History for {cust.companyName}</span>
                                </h4>
                                <span className="text-xs text-slate-500 font-mono">
                                  Payment Terms: {cust.paymentTerms || 'Net 30 Days'}
                                </span>
                              </div>

                              {cust.invoices.length === 0 ? (
                                <p className="text-xs text-slate-400 py-3 text-center">No invoices issued for this customer yet.</p>
                              ) : (
                                <div className="space-y-2">
                                  {cust.invoices.map((inv) => (
                                    <div
                                      key={inv.id}
                                      className="flex flex-wrap items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-100 dark:border-slate-700 gap-2 font-mono"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-bold text-emerald-800 dark:text-emerald-400">
                                          {inv.invoiceNumber}
                                        </span>
                                        <span className="text-slate-500 text-[11px]">
                                          Date: {formatUAE(inv.date)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-slate-600 dark:text-slate-300">
                                          Total: {formatAED(inv.total)}
                                        </span>
                                        <span className="text-emerald-800 dark:text-emerald-400">
                                          Paid: {formatAED(inv.paidAmount || 0)}
                                        </span>
                                        <span className="text-rose-700 dark:text-rose-400 font-bold">
                                          Due: {formatAED(inv.balanceDue || 0)}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            inv.status === 'Paid'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : inv.status === 'Partially Paid'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}
                                        >
                                          {inv.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
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
