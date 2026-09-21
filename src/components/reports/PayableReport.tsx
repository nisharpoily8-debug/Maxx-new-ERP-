import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext.tsx';
import { Supplier, SupplierBill } from '../../types/erp.ts';
import {
  CreditCard,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  DollarSign,
  Clock,
  ArrowDownRight,
  Receipt
} from 'lucide-react';

interface PayableReportProps {
  bills: SupplierBill[];
  suppliers: Supplier[];
}

export const PayableReport: React.FC<PayableReportProps> = ({ bills, suppliers }) => {
  const { formatAED, formatUAE } = useErp();
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all');

  const today = new Date();

  // Helper for overdue calculation
  const getDueStatus = (bill: SupplierBill) => {
    if (bill.status === 'Paid') return { label: 'Paid in Full', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300' };
    
    const dueDate = new Date(bill.dueDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)}d`,
        color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300',
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due Today',
        color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300',
      };
    }
    if (diffDays <= 7) {
      return {
        label: `Due in ${diffDays}d`,
        color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300',
        dueSoon: true,
      };
    }
    return {
      label: `Due in ${diffDays}d`,
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300',
    };
  };

  // KPI Calculations
  const totalBillsAmount = bills.reduce((acc, b) => acc + (b.total || 0), 0);
  const totalOutstanding = bills.reduce((acc, b) => acc + (b.balanceDue || 0), 0);
  const totalPaid = bills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);

  const overdueBills = bills.filter((b) => {
    if (b.status === 'Paid' || (b.balanceDue || 0) <= 0) return false;
    const dueDate = new Date(b.dueDate);
    return dueDate.getTime() < today.getTime();
  });
  const totalOverdueAmount = overdueBills.reduce((acc, b) => acc + (b.balanceDue || 0), 0);

  const dueSoonBills = bills.filter((b) => {
    if (b.status === 'Paid' || (b.balanceDue || 0) <= 0) return false;
    const dueDate = new Date(b.dueDate);
    const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  });
  const totalDueSoonAmount = dueSoonBills.reduce((acc, b) => acc + (b.balanceDue || 0), 0);

  // Filtered List
  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.notes && bill.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (supplierFilter !== 'all' && bill.supplierId !== supplierFilter) {
      return false;
    }

    if (statusFilter === 'unpaid') return (bill.balanceDue || 0) > 0;
    if (statusFilter === 'overdue') {
      const isOverdue = new Date(bill.dueDate).getTime() < today.getTime() && (bill.balanceDue || 0) > 0;
      return isOverdue;
    }
    if (statusFilter === 'paid') return bill.status === 'Paid' || (bill.balanceDue || 0) === 0;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Accounts Payable & Supplier Liabilities Register
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time track of vendor purchase bills, pending disbursements, and credit timelines.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payables</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            {formatAED(totalOutstanding)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Across {bills.filter((b) => (b.balanceDue || 0) > 0).length} unpaid purchase bills
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Overdue Liabilities
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-2">
            {formatAED(totalOverdueAmount)}
          </p>
          <span className="text-[10px] text-rose-600 mt-1 block">
            {overdueBills.length} bills passed due date
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Due Within 7 Days
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono mt-2">
            {formatAED(totalDueSoonAmount)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {dueSoonBills.length} upcoming supplier settlements
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Disbursed / Paid
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800 dark:text-emerald-400 font-mono mt-2">
            {formatAED(totalPaid)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Settled to paper & resin mills
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Bill #, supplier name, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="all">All Suppliers ({suppliers.length})</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="unpaid">Unpaid / Outstanding</option>
            <option value="overdue">Overdue Only</option>
            <option value="paid">Settled / Paid</option>
          </select>
        </div>
      </div>

      {/* Payables Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Bill Ref</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-3">Bill Date</th>
                <th className="py-3.5 px-3">Due Date</th>
                <th className="py-3.5 px-3 text-right">Bill Total (AED)</th>
                <th className="py-3.5 px-3 text-right">Paid (AED)</th>
                <th className="py-3.5 px-3 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No payable bills found</p>
                    <p className="text-[11px] text-slate-400">No records match your selected filter criteria</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const dueInfo = getDueStatus(bill);
                  const supplier = suppliers.find((s) => s.id === bill.supplierId);
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {bill.billNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{bill.supplierName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          TRN: {supplier?.trn || 'Registered UAE Supplier'}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                        {formatUAE(bill.date)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                        {formatUAE(bill.dueDate)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatAED(bill.total)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400">
                        {formatAED(bill.paidAmount || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-700 dark:text-rose-400">
                        {formatAED(bill.balanceDue || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${dueInfo.color}`}
                        >
                          {dueInfo.label}
                        </span>
                      </td>
                    </tr>
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
