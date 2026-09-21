import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import {
  ChartOfAccount,
  JournalEntry,
  Expense,
  JournalLine
} from '../types/erp.ts';
import {
  Landmark,
  Plus,
  Search,
  FileCheck,
  Receipt,
  Scale,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Printer,
  Trash2,
  X
} from 'lucide-react';

export const AccountingView: React.FC = () => {
  const { formatAED, formatUAE, showToast, currentUser, settings, can } = useErp();

  const [activeTab, setActiveTab] = useState<'vat201' | 'journals' | 'coa' | 'expenses'>('vat201');
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Manual Journal Modal
  const [showManualJournalModal, setShowManualJournalModal] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalDescription, setJournalDescription] = useState('');
  const [journalLines, setJournalLines] = useState<JournalLine[]>([
    {
      id: 'jl-1',
      accountCode: '5030',
      accountName: 'Warehouse Utilities (DEWA Dubai & SEWA)',
      description: 'Monthly utility settlement',
      debit: 2500,
      credit: 0,
    },
    {
      id: 'jl-2',
      accountCode: '1020',
      accountName: 'Emirates NBD Main Operating (AED)',
      description: 'Paid via direct bank debit',
      debit: 0,
      credit: 2500,
    },
  ]);

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Utilities');
  const [expenseAmount, setExpenseAmount] = useState(1200);
  const [expenseVendor, setExpenseVendor] = useState('DEWA');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Card'>('Bank Transfer');
  const [expenseVatRecoverable, setExpenseVatRecoverable] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accs, jvs, exps] = await Promise.all([
        api.getChartOfAccounts(),
        api.getJournalEntries(),
        api.getExpenses(),
      ]);
      setAccounts(accs);
      setJournals(jvs);
      setExpenses(exps);
    } catch (e) {
      console.error(e);
    }
  };

  // Debit / Credit real-time balance computation
  const totalDebit = Math.round(journalLines.reduce((s, l) => s + (Number(l.debit) || 0), 0) * 100) / 100;
  const totalCredit = Math.round(journalLines.reduce((s, l) => s + (Number(l.credit) || 0), 0) * 100) / 100;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      showToast(
        `Journal entry is out of balance! Debit (${totalDebit.toFixed(2)}) != Credit (${totalCredit.toFixed(2)})`,
        'error'
      );
      return;
    }

    try {
      const created = await api.postManualJournal({
        date: journalDate,
        referenceType: 'MANUAL',
        referenceId: `REF-${Math.floor(Math.random() * 8999) + 1000}`,
        description: journalDescription || 'Manual Adjusting Journal Entry',
        lines: journalLines,
        status: 'Posted',
        postedBy: currentUser.name,
      });

      showToast(`Journal voucher ${created.entryNumber} posted successfully!`, 'success');
      setShowManualJournalModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const vatRate = expenseVatRecoverable ? 0.05 : 0;
    const subtotal = expenseAmount / (1 + vatRate);
    const vatAmount = expenseAmount - subtotal;

    try {
      const created = await api.createExpense({
        date: new Date().toISOString().split('T')[0],
        category: expenseCategory,
        vendor: expenseVendor,
        description: `Operational expenditure: ${expenseCategory} to ${expenseVendor}`,
        amount: subtotal,
        vatAmount,
        total: expenseAmount,
        paidFromAccount: expensePaymentMethod === 'Cash' ? '1010' : '1020',
        paymentMethod: expensePaymentMethod,
        recordedBy: currentUser.name,
      });

      showToast(`Expense ${created.expenseNumber} recorded and posted to GL!`, 'success');
      setShowExpenseModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // VAT 201 Return Data Calculation
  // Standard rated sales (Box 1a)
  const salesAccount = accounts.find((a) => a.code === '4000') || accounts.find((a) => a.code === '4010');
  const totalSalesRevenue = accounts
    .filter((a) => a.category === 'Revenue')
    .reduce((s, a) => s + Math.abs(a.balance), 0);

  const outputVatAccount = accounts.find((a) => a.code === '2100');
  const outputVatDue = outputVatAccount ? Math.abs(outputVatAccount.balance) : totalSalesRevenue * 0.05;

  const inputVatAccount = accounts.find((a) => a.code === '2110');
  const inputVatRecoverable = inputVatAccount ? Math.abs(inputVatAccount.balance) : 0;

  const netVatPayableToFta = Math.max(0, outputVatDue - inputVatRecoverable);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Financial Accounting & UAE VAT 201 Return
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict double-entry ledger, Chart of Accounts, automated vouchers, and Federal Tax Authority (FTA) return filing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {can('accounting') && (
            <>
              <button
                id="btn-post-manual-journal"
                onClick={() => setShowManualJournalModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Post Manual Journal (JV)</span>
              </button>

              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('vat201')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'vat201'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>UAE VAT 201 Return (FTA)</span>
        </button>

        <button
          onClick={() => setActiveTab('journals')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'journals'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>General Ledger Journals ({journals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coa')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'coa'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Chart of Accounts ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Operating Expenses ({expenses.length})</span>
        </button>
      </div>

      {/* 1. UAE VAT 201 RETURN TAB */}
      {activeTab === 'vat201' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    Form VAT 201
                  </span>
                  <h2 className="text-lg font-black tracking-tight">
                    Federal Tax Authority (FTA) - UAE Value Added Tax Return
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Taxable Person: <strong>Maxpack Packaging LLC</strong> • TRN: <strong>100234857600003</strong> • Period: Q3 2026 (Monthly)
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export / Print Return</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Output Tax (Box 1a)</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">{formatAED(outputVatDue)}</p>
                <span className="text-[11px] text-slate-500">Collected on taxable supplies at 5%</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Input Tax (Box 8)</span>
                <p className="text-2xl font-black text-slate-300 mt-1">{formatAED(inputVatRecoverable)}</p>
                <span className="text-[11px] text-slate-500">Recoverable on purchases & expenses</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[11px] text-amber-400 uppercase font-bold">Net Tax Payable (Box 9)</span>
                <p className="text-2xl font-black text-amber-300 mt-1">{formatAED(netVatPayableToFta)}</p>
                <span className="text-[11px] text-slate-400">Due to FTA by 28th of following month</span>
              </div>
            </div>
          </div>

          {/* Detailed FTA Box Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                VAT on Sales and other Outputs (Sections 1 & 2)
              </h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">1a. Standard rated supplies in Dubai (5%)</p>
                  <p className="text-[11px] text-slate-500">Taxable packaging products and custom carton runs</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{formatAED(totalSalesRevenue)}</span>
                  <span className="block font-mono text-emerald-700 font-semibold mt-0.5">
                    VAT: {formatAED(outputVatDue)}
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">1b. Standard rated supplies in Abu Dhabi & Other Emirates</p>
                  <p className="text-[11px] text-slate-500">Fulfillment to branches in Sharjah, Ajman, RAK</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-500">AED 0.00</span>
                  <span className="block font-mono text-slate-400 mt-0.5">VAT: AED 0.00</span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">4. Zero-rated supplies (Exports outside GCC)</p>
                  <p className="text-[11px] text-slate-500">Export container shipments outside UAE customs territory</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-500">AED 0.00</span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between bg-slate-50 font-bold">
                <span>Total Value of Output Tax Due to FTA:</span>
                <span className="font-mono text-emerald-800 text-sm">{formatAED(outputVatDue)}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-y border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                VAT on Expenses and other Inputs (Sections 8 & 9)
              </h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">8. Standard rated expenses (5% Recoverable)</p>
                  <p className="text-[11px] text-slate-500">Kraft paper roll imports, tape adhesive supplies, utilities</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{formatAED(inputVatRecoverable * 20)}</span>
                  <span className="block font-mono text-slate-600 font-semibold mt-0.5">
                    Recoverable: {formatAED(inputVatRecoverable)}
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between bg-emerald-50/50 font-black text-sm">
                <span className="text-slate-900">Box 9: Net Tax Due to FTA (AED):</span>
                <span className="font-mono text-emerald-950">{formatAED(netVatPayableToFta)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GENERAL LEDGER JOURNALS TAB */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">JV #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-3 text-right">Debit (AED)</th>
                    <th className="py-3 px-3 text-right">Credit (AED)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4">Posted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-sm">No journal vouchers posted yet</p>
                        <p className="text-xs text-slate-400 mt-1">Automatic vouchers from sales and purchases or manual entries will appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    journals.map((jv) => (
                    <tr key={jv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{jv.entryNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{formatUAE(jv.date)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{jv.referenceId}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{jv.description}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatAED(jv.totalDebit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatAED(jv.totalCredit)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {jv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{jv.postedBy}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. CHART OF ACCOUNTS TAB */}
      {activeTab === 'coa' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-3">Classification</th>
                  <th className="py-3 px-3 text-center">Currency</th>
                  <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{acc.name}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          acc.category === 'Asset'
                            ? 'bg-blue-50 text-blue-700'
                            : acc.category === 'Liability'
                            ? 'bg-amber-50 text-amber-700'
                            : acc.category === 'Revenue'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {acc.category} ({acc.subcategory})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{acc.currency}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatAED(acc.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Expense #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category & Vendor</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">5% VAT</th>
                  <th className="py-3 px-4 text-right">Total (AED)</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">No operational expenses recorded</p>
                      <p className="text-xs text-slate-400 mt-1">Record utility bills, warehouse rent, fuel, and petty cash disbursements above.</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{exp.expenseNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatUAE(exp.date)}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{exp.vendor}</p>
                      <p className="text-[10px] text-slate-500">{exp.category}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{exp.description}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatAED(exp.amount)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-800">{formatAED(exp.vatAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatAED(exp.total)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold text-slate-700">
                        {exp.paymentMethod}
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL JOURNAL MODAL WITH REAL-TIME BALANCE ENFORCEMENT */}
      {/* ========================================================================= */}
      {showManualJournalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-sm">Post Manual Journal Voucher (JV)</h3>
                <p className="text-[11px] text-slate-400">
                  Strict accounting enforcement: Total Debits must equal Total Credits
                </p>
              </div>
              <button
                onClick={() => setShowManualJournalModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostJournal} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Voucher Date</label>
                  <input
                    type="date"
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Voucher Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Month-end depreciation or accrual entry"
                    value={journalDescription}
                    onChange={(e) => setJournalDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Journal Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px]">Ledger Account Lines</span>
                  <button
                    type="button"
                    onClick={() =>
                      setJournalLines([
                        ...journalLines,
                        {
                          id: `jl-${Date.now()}`,
                          accountCode: accounts[0]?.code || '5030',
                          accountName: accounts[0]?.name || 'Expense',
                          description: '',
                          debit: 0,
                          credit: 0,
                        },
                      ])
                    }
                    className="text-emerald-700 font-bold hover:text-emerald-800"
                  >
                    + Add Ledger Line
                  </button>
                </div>

                <div className="space-y-2">
                  {journalLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <select
                        value={line.accountCode}
                        onChange={(e) => {
                          const acc = accounts.find((a) => a.code === e.target.value);
                          if (acc) {
                            const updated = [...journalLines];
                            updated[idx].accountCode = acc.code;
                            updated[idx].accountName = acc.name;
                            setJournalLines(updated);
                          }
                        }}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-semibold"
                      >
                        {accounts.map((a) => (
                          <option key={a.code} value={a.code}>
                            {a.code} - {a.name} ({a.category})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Line note"
                        value={line.description}
                        onChange={(e) => {
                          const updated = [...journalLines];
                          updated[idx].description = e.target.value;
                          setJournalLines(updated);
                        }}
                        className="w-36 px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit"
                          value={line.debit || ''}
                          onChange={(e) => {
                            const updated = [...journalLines];
                            updated[idx].debit = parseFloat(e.target.value) || 0;
                            if (updated[idx].debit > 0) updated[idx].credit = 0;
                            setJournalLines(updated);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit"
                          value={line.credit || ''}
                          onChange={(e) => {
                            const updated = [...journalLines];
                            updated[idx].credit = parseFloat(e.target.value) || 0;
                            if (updated[idx].credit > 0) updated[idx].debit = 0;
                            setJournalLines(updated);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-slate-900"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setJournalLines(journalLines.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance Summary Box */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                  isBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {isBalanced ? 'Journal is Balanced' : 'Unbalanced Entry (Blocked)'}
                    </span>
                    <span className="text-[11px]">
                      {isBalanced
                        ? `Total: ${totalDebit.toFixed(2)} AED`
                        : `Discrepancy: ${(totalDebit - totalCredit).toFixed(2)} AED`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 font-mono font-bold text-sm">
                  <span>Dr: {totalDebit.toFixed(2)}</span>
                  <span>Cr: {totalCredit.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualJournalModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl shadow-md transition"
                >
                  Post to General Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECORD EXPENSE MODAL */}
      {/* ========================================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Record Operational Expense</h3>
              <p className="text-[11px] text-slate-400">Posts to General Ledger with 5% VAT recovery</p>
            </div>

            <form onSubmit={handleRecordExpense} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Expense Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="Utilities">Utilities (DEWA & SEWA)</option>
                    <option value="Rent & Warehouse">Warehouse DIP Rent</option>
                    <option value="Maintenance">Forklift & Machine Repairs</option>
                    <option value="Transportation & Fuel">Delivery Fleet Diesel/Fuel</option>
                    <option value="Packaging Raw Materials">Packaging Raw Materials</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEWA or ENOC"
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Gross Expense Amount (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="Bank Transfer">Bank Transfer (Emirates NBD)</option>
                    <option value="Cash">Cash (Petty Cash Till)</option>
                    <option value="Card">Corporate Credit Card</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenseVatRecoverable}
                      onChange={(e) => setExpenseVatRecoverable(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">5% Input VAT Recoverable</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
