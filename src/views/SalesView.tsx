import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import {
  SalesInvoice,
  SalesOrder,
  SalesQuotation,
  Customer,
  Product,
  InvoiceItem
} from '../types/erp.ts';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  Printer,
  CheckCircle,
  Clock,
  UserCheck,
  Building,
  Phone,
  Users,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import { QuotationModal } from '../components/QuotationModal.tsx';

interface SalesViewProps {
  onViewInvoice: (invoice: SalesInvoice) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onViewInvoice }) => {
  const { formatAED, formatUAE, showToast, currentUser, can } = useErp();

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'orders' | 'quotes' | 'customers'>('invoices');
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [quotes, setQuotes] = useState<SalesQuotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Quotation Preview & Making State
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<SalesQuotation | null>(null);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [quoteCustomerId, setQuoteCustomerId] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [quoteExpiryDate, setQuoteExpiryDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [quoteItems, setQuoteItems] = useState<InvoiceItem[]>([]);
  const [quoteDiscount, setQuoteDiscount] = useState(0);
  const [quoteDeliveryCharge, setQuoteDeliveryCharge] = useState(0);
  const [quoteTerms, setQuoteTerms] = useState(
    '1. Quotation validity: 30 calendar days from issue.\n2. Payment terms: 30 days credit upon delivery.\n3. Delivery within 2-3 business days across UAE.\n4. Prices subject to 5% standard UAE VAT.'
  );
  const [quoteNotes, setQuoteNotes] = useState('Thank you for considering our commercial packaging proposal.');
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  // New Invoice Modal
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<any>('30 Days Credit');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);

  // New Customer Modal
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    companyName: '',
    trn: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    emirate: 'Dubai' as any,
    creditLimit: 50000,
    paymentTerms: 'Net 30 Days' as any,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [invs, ords, qts, custs, prods] = await Promise.all([
        api.getInvoices(),
        api.getOrders(),
        api.getQuotations(),
        api.getCustomers(),
        api.getProducts(),
      ]);
      setInvoices(invs);
      setOrders(ords);
      setQuotes(qts);
      setCustomers(custs);
      setProducts(prods);

      if (custs.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custs[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Convert Quote to Order
  const handleConvertQuote = async (quoteId: string) => {
    try {
      const order = await api.convertQuotationToOrder(quoteId);
      showToast(`Quotation converted to Sales Order ${order.orderNumber}!`, 'success');
      loadAllData();
      setActiveSubTab('orders');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Convert Quote to Invoice
  const handleConvertQuoteToInvoice = async (quoteId: string) => {
    try {
      const invoice = await api.convertQuotationToInvoice(quoteId);
      showToast(`Quotation converted to Tax Invoice ${invoice.invoiceNumber}!`, 'success');
      loadAllData();
      onViewInvoice(invoice);
    } catch (err: any) {
      showToast(err.message || 'Failed to convert quotation to invoice', 'error');
    }
  };

  // Add Item to New Quote
  const handleAddItemToQuote = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const unitPrice = prod.sellingPrice;
    const quantity = 10;
    const discount = 0;
    const netAmount = unitPrice * quantity - discount;
    const vatRate = 0.05;
    const vatAmount = netAmount * vatRate;
    const total = netAmount + vatAmount;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      quantity,
      unit: prod.unit,
      unitPrice,
      discount,
      netAmount,
      vatRate,
      vatAmount,
      total,
    };

    setQuoteItems((prev) => [...prev, newItem]);
  };

  const handleUpdateQuoteItem = (index: number, updates: Partial<InvoiceItem>) => {
    const updated = [...quoteItems];
    const item = { ...updated[index], ...updates };

    const net = item.unitPrice * item.quantity - (item.discount || 0);
    item.netAmount = Math.max(0, net);
    item.vatAmount = item.netAmount * (item.vatRate || 0.05);
    item.total = item.netAmount + item.vatAmount;

    updated[index] = item;
    setQuoteItems(updated);
  };

  const handleRemoveQuoteItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Quotation Submission
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteItems.length === 0) {
      showToast('Please add at least one line item to the quotation', 'error');
      return;
    }

    const cust = customers.find((c) => c.id === quoteCustomerId) || customers[0];
    if (!cust) {
      showToast('Please select or create a customer first', 'error');
      return;
    }

    const subtotal = quoteItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const lineDiscount = quoteItems.reduce((s, i) => s + (i.discount || 0), 0);
    const totalDiscount = lineDiscount + Number(quoteDiscount || 0);
    const taxableAmount = Math.max(0, subtotal - totalDiscount) + Number(quoteDeliveryCharge || 0);
    const vatAmount = taxableAmount * 0.05;
    const total = taxableAmount + vatAmount;

    try {
      setIsCreatingQuote(true);
      const created = await api.createQuotation({
        customerId: cust.id,
        customerName: cust.companyName,
        customerTrn: cust.trn,
        customerAddress: `${cust.address}, ${cust.emirate}, UAE`,
        customerPhone: cust.phone,
        date: quoteDate,
        expiryDate: quoteExpiryDate,
        warehouseId: 'wh-1',
        salespersonId: currentUser.id,
        salespersonName: currentUser.name,
        items: quoteItems,
        subtotal,
        discount: totalDiscount,
        deliveryCharge: Number(quoteDeliveryCharge || 0),
        vatAmount,
        total,
        status: 'Draft',
        terms: quoteTerms,
        notes: quoteNotes,
      });

      showToast(`Quotation ${created.quoteNumber} created successfully!`, 'success');
      setShowNewQuoteModal(false);
      setQuoteItems([]);
      await loadAllData();
      setSelectedQuoteForPreview(created);
    } catch (err: any) {
      showToast(err.message || 'Failed to create quotation', 'error');
    } finally {
      setIsCreatingQuote(false);
    }
  };

  // Convert Order to Invoice
  const handleConvertOrder = async (orderId: string) => {
    try {
      const invoice = await api.convertOrderToInvoice(orderId);
      showToast(`Sales Order fulfilled and Tax Invoice ${invoice.invoiceNumber} created!`, 'success');
      loadAllData();
      onViewInvoice(invoice);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Add Item to New Invoice
  const handleAddItemToInvoice = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const unitPrice = prod.sellingPrice;
    const quantity = 10; // default initial qty
    const discount = 0;
    const netAmount = unitPrice * quantity - discount;
    const vatRate = 0.05;
    const vatAmount = netAmount * vatRate;
    const total = netAmount + vatAmount;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      quantity,
      unit: prod.unit,
      unitPrice,
      discount,
      netAmount,
      vatRate,
      vatAmount,
      total,
    };

    setInvoiceItems([...invoiceItems, newItem]);
  };

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const updated = [...invoiceItems];
    const item = { ...updated[index], ...updates };

    const net = item.unitPrice * item.quantity - (item.discount || 0);
    item.netAmount = Math.max(0, net);
    item.vatAmount = item.netAmount * (item.vatRate || 0.05);
    item.total = item.netAmount + item.vatAmount;

    updated[index] = item;
    setInvoiceItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Create Invoice Submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItems.length === 0) {
      showToast('Please add at least one line item to the invoice', 'error');
      return;
    }

    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    const subtotal = invoiceItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const lineDiscount = invoiceItems.reduce((s, i) => s + (i.discount || 0), 0);
    const totalDiscount = lineDiscount + Number(invoiceDiscount || 0);
    const taxableAmount = subtotal - totalDiscount + Number(deliveryCharge || 0);
    const vatAmount = taxableAmount * 0.05;
    const total = taxableAmount + vatAmount;

    try {
      const invoiceNumber = `INV-2026-${String(invoices.length + 89).padStart(4, '0')}`;
      const today = new Date().toISOString().split('T')[0];

      const created = await api.createInvoice({
        invoiceNumber,
        customerId: cust.id,
        customerName: cust.companyName,
        customerTrn: cust.trn,
        customerAddress: `${cust.address}, ${cust.emirate}, UAE`,
        customerPhone: cust.phone,
        date: today,
        supplyDate: today,
        dueDate,
        paymentTerms,
        salespersonId: currentUser.id,
        salespersonName: currentUser.name,
        warehouseId: 'wh-1',
        items: invoiceItems,
        subtotal,
        discount: totalDiscount,
        deliveryCharge: Number(deliveryCharge || 0),
        vatAmount,
        total,
        paidAmount: 0,
        balanceDue: total,
        status: 'Sent',
        notes: 'Thank you for your packaging order with Maxpack UAE.',
      });

      showToast(`Tax Invoice ${created.invoiceNumber} created & posted to General Ledger!`, 'success');
      setShowNewInvoiceModal(false);
      setInvoiceItems([]);
      loadAllData();
      onViewInvoice(created);
    } catch (err: any) {
      showToast(err.message || 'Failed to create invoice', 'error');
    }
  };

  // Create Customer Submission
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createCustomer(newCustomer as any);
      showToast(`Customer ${created.companyName} added successfully!`, 'success');
      setShowNewCustomerModal(false);
      loadAllData();
      setSelectedCustomerId(created.id);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerTrn && inv.customerTrn.includes(searchQuery));
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Quotations
  const filteredQuotes = quotes.filter((qt) => {
    const matchesSearch =
      qt.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qt.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || qt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Sales & UAE VAT Invoicing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage quotations, confirmed sales orders, tax invoices, and customer credit ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {can('sales') && (
            <>
              {activeSubTab === 'quotes' ? (
                <button
                  id="btn-open-create-quote"
                  onClick={() => {
                    setShowNewQuoteModal(true);
                    if (quoteItems.length === 0 && products.length > 0) {
                      handleAddItemToQuote(products[0].id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Quotation</span>
                </button>
              ) : (
                <button
                  id="btn-open-create-invoice"
                  onClick={() => {
                    setShowNewInvoiceModal(true);
                    if (invoiceItems.length === 0 && products.length > 0) {
                      handleAddItemToInvoice(products[0].id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Tax Invoice</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeSubTab === 'invoices'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tax Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeSubTab === 'orders'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Sales Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quotes')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeSubTab === 'quotes'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Quotations ({quotes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('customers')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeSubTab === 'customers'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Customer Directory ({customers.length})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, TRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {activeSubTab === 'invoices' && (
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
            <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Status:</span>
            {['ALL', 'Sent', 'Paid', 'Partially Paid', 'Overdue'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg font-medium text-xs transition ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. INVOICES TAB */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer & TRN</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">5% VAT</th>
                  <th className="py-3 px-4 text-right">Total (AED)</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <p className="font-semibold text-slate-700 text-sm">No sales invoices found</p>
                      <p className="text-xs text-slate-400 mt-1">Click "New Tax Invoice" above to generate your first official invoice.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{inv.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {inv.customerTrn ? `TRN: ${inv.customerTrn}` : 'Unregistered'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatUAE(inv.date)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatUAE(inv.dueDate)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{formatAED(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-800">{formatAED(inv.vatAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatAED(inv.total)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-700">
                      {formatAED(inv.balanceDue)}
                    </td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs shadow-xs transition"
                      >
                        Tax Invoice
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SALES ORDERS TAB */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4 text-right">Total (AED)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <p className="font-semibold text-slate-700 text-sm">No sales orders found</p>
                      <p className="text-xs text-slate-400 mt-1">Confirmed customer orders will appear here for fulfillment and conversion.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{ord.customerName}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatUAE(ord.date)}</td>
                    <td className="py-3 px-4 text-slate-600">{ord.deliveryDate ? formatUAE(ord.deliveryDate) : '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatAED(ord.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ord.status !== 'Invoiced' ? (
                        <button
                          onClick={() => handleConvertOrder(ord.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-medium text-xs shadow-xs transition"
                        >
                          Generate Tax Invoice
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">Invoiced</span>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. QUOTATIONS TAB */}
      {activeSubTab === 'quotes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Commercial Quotations & Estimates</h3>
              <p className="text-[11px] text-slate-500">Formal price proposals with automatic 5% UAE VAT calculation and logo branding</p>
            </div>
            {can('sales') && (
              <button
                onClick={() => {
                  setShowNewQuoteModal(true);
                  if (quoteItems.length === 0 && products.length > 0) {
                    handleAddItemToQuote(products[0].id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Quote</span>
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Quote #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Estimated Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No quotations found. Click "Create Quote" above to prepare a new commercial estimate.
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((qt) => (
                    <tr key={qt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <button
                          onClick={() => setSelectedQuoteForPreview(qt)}
                          className="hover:text-emerald-700 hover:underline flex items-center gap-1.5 text-left"
                          title="Click to view & print quote"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{qt.quoteNumber}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{qt.customerName}</td>
                      <td className="py-3 px-4 text-slate-600">{formatUAE(qt.date)}</td>
                      <td className="py-3 px-4 text-slate-600">{formatUAE(qt.expiryDate)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatAED(qt.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          qt.status === 'Converted'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : qt.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {qt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedQuoteForPreview(qt)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                            title="View / Print Quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {qt.status !== 'Converted' ? (
                            <>
                              <button
                                onClick={() => handleConvertQuote(qt.id)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-medium text-[11px] transition"
                                title="Convert to confirmed Sales Order"
                              >
                                To Order
                              </button>
                              <button
                                onClick={() => handleConvertQuoteToInvoice(qt.id)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md font-medium text-[11px] transition"
                                title="Convert straight to UAE Tax Invoice"
                              >
                                To Invoice
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 font-medium text-[11px]">Converted</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CUSTOMERS DIRECTORY TAB */}
      {activeSubTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">No customers registered yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your B2B packaging clients or retail accounts using the "Add Customer" button above.</p>
            </div>
          ) : (
            customers.map((cust) => (
            <div key={cust.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{cust.companyName}</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    TRN: {cust.trn || 'Not Registered'}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {cust.emirate}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cust.contactPerson}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cust.phone}</span>
                </p>
                <p className="text-slate-500 text-[11px]">{cust.address}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Credit Limit</span>
                  <p className="font-mono font-bold text-slate-800">{formatAED(cust.creditLimit)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Outstanding Due</span>
                  <p className="font-mono font-black text-rose-700">{formatAED(cust.currentBalance)}</p>
                </div>
              </div>
            </div>
          )))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW TAX INVOICE MODAL */}
      {/* ========================================================================= */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
              <div>
                <h2 className="text-lg font-bold">Create UAE Tax Invoice / فاتورة ضريبية</h2>
                <p className="text-xs text-slate-400">
                  Standard 5% VAT rate applied with automatic General Ledger posting
                </p>
              </div>
              <button
                onClick={() => setShowNewInvoiceModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-6 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} {c.trn ? `(TRN: ${c.trn})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="Immediate">Immediate / Cash on Delivery</option>
                    <option value="15 Days Credit">15 Days Credit</option>
                    <option value="30 Days Credit">30 Days Credit (Standard)</option>
                    <option value="60 Days Credit">60 Days Credit</option>
                    <option value="PDC 30 Days">Post-Dated Cheque 30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                    Invoice Line Items
                  </span>
                  {products.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddItemToInvoice(products[0].id)}
                      className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product Item</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">Product / SKU</th>
                        <th className="py-2.5 px-2 text-center">Unit</th>
                        <th className="py-2.5 px-2 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Price (AED)</th>
                        <th className="py-2.5 px-2 text-right">Discount</th>
                        <th className="py-2.5 px-3 text-right">Net Taxable</th>
                        <th className="py-2.5 px-2 text-center">VAT</th>
                        <th className="py-2.5 px-3 text-right">Total (AED)</th>
                        <th className="py-2.5 px-2 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <select
                              value={item.productId}
                              onChange={(e) => {
                                const p = products.find((pr) => pr.id === e.target.value);
                                if (p) {
                                  handleUpdateItem(idx, {
                                    productId: p.id,
                                    name: p.name,
                                    sku: p.sku,
                                    unit: p.unit,
                                    unitPrice: p.sellingPrice,
                                  });
                                }
                              }}
                              className="w-full bg-transparent font-semibold text-slate-900 border-none outline-none"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2 text-center text-slate-500">{item.unit}</td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(idx, { quantity: parseInt(e.target.value) || 1 })
                              }
                              className="w-16 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                              }
                              className="w-20 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-mono"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) =>
                                handleUpdateItem(idx, { discount: parseFloat(e.target.value) || 0 })
                              }
                              className="w-16 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-mono text-slate-600"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                            {item.netAmount.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center text-emerald-800 font-bold">5%</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {item.total.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adjustments & Totals Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Delivery / Freight Charge (AED)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                      className="w-full sm:w-48 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Extra Trade Discount (AED)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceDiscount}
                      onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full sm:w-48 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">
                      {formatAED(invoiceItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Taxable Base:</span>
                    <span className="font-mono">
                      {formatAED(
                        invoiceItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0) -
                          invoiceDiscount +
                          deliveryCharge
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>5% UAE VAT:</span>
                    <span className="font-mono">
                      {formatAED(
                        (invoiceItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0) -
                          invoiceDiscount +
                          deliveryCharge) *
                          0.05
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2">
                    <span>Total Tax Invoice (AED):</span>
                    <span className="font-mono text-emerald-900">
                      {formatAED(
                        (invoiceItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0) -
                          invoiceDiscount +
                          deliveryCharge) *
                          1.05
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  Create & Post Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
              <h2 className="text-base font-bold">Register New Customer / العميل</h2>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs text-slate-800">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company / Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Khaleej Retail LLC"
                  value={newCustomer.companyName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">UAE TRN (15 digits)</label>
                  <input
                    type="text"
                    placeholder="100XXXXXXXXX003"
                    value={newCustomer.trn}
                    onChange={(e) => setNewCustomer({ ...newCustomer, trn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Emirate</label>
                  <select
                    value={newCustomer.emirate}
                    onChange={(e) => setNewCustomer({ ...newCustomer, emirate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={newCustomer.contactPerson}
                    onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+971 4 XXXXXXX"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Street, Industrial Area / Zone"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Credit Limit (AED)</label>
                  <input
                    type="number"
                    value={newCustomer.creditLimit}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, creditLimit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Terms</label>
                  <select
                    value={newCustomer.paymentTerms}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, paymentTerms: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="Immediate">Immediate / Cash</option>
                    <option value="15 Days Credit">15 Days Credit</option>
                    <option value="30 Days Credit">30 Days Credit</option>
                    <option value="60 Days Credit">60 Days Credit</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW COMMERCIAL QUOTATION MAKER MODAL */}
      {/* ========================================================================= */}
      {showNewQuoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
              <div>
                <h2 className="text-lg font-bold">New Commercial Quotation / إنشاء عرض أسعار</h2>
                <p className="text-xs text-slate-400">
                  Prepare professional packaging proposal with 5% UAE VAT and company branding
                </p>
              </div>
              <button
                onClick={() => setShowNewQuoteModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-6 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer / Client *</label>
                  <select
                    value={quoteCustomerId}
                    onChange={(e) => setQuoteCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    required
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} {c.trn ? `(TRN: ${c.trn})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Quotation Date</label>
                  <input
                    type="date"
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valid Until / Expiry Date</label>
                  <input
                    type="date"
                    value={quoteExpiryDate}
                    onChange={(e) => setQuoteExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                    Quotation Line Items & Specifications
                  </span>
                  {products.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddItemToQuote(products[0].id)}
                      className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product Item</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">Product / SKU</th>
                        <th className="py-2.5 px-2 text-center">Unit</th>
                        <th className="py-2.5 px-2 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Price (AED)</th>
                        <th className="py-2.5 px-2 text-right">Disc %</th>
                        <th className="py-2.5 px-3 text-right">Net Taxable</th>
                        <th className="py-2.5 px-2 text-center">VAT</th>
                        <th className="py-2.5 px-3 text-right">Total (AED)</th>
                        <th className="py-2.5 px-2 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quoteItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-slate-400">
                            No items added yet. Click "Add Product Item" to select products.
                          </td>
                        </tr>
                      ) : (
                        quoteItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">
                              <select
                                value={item.productId}
                                onChange={(e) => {
                                  const p = products.find((pr) => pr.id === e.target.value);
                                  if (p) {
                                    handleUpdateQuoteItem(idx, {
                                      productId: p.id,
                                      name: p.name,
                                      sku: p.sku,
                                      unit: p.unit,
                                      unitPrice: p.sellingPrice,
                                    });
                                  }
                                }}
                                className="w-full bg-transparent font-semibold text-slate-900 border-none outline-none"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2 text-center text-slate-500">{item.unit}</td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuoteItem(idx, { quantity: parseInt(e.target.value) || 1 })
                                }
                                className="w-16 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-bold"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleUpdateQuoteItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                                }
                                className="w-20 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-mono"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={(e) =>
                                  handleUpdateQuoteItem(idx, { discount: parseFloat(e.target.value) || 0 })
                                }
                                className="w-14 px-1 py-1 text-right bg-white border border-slate-300 rounded text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                              {item.netAmount.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-center text-emerald-700 font-bold">5%</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {item.total.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveQuoteItem(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms, Notes & Summary Calculations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Commercial Terms & Conditions</label>
                    <textarea
                      rows={3}
                      value={quoteTerms}
                      onChange={(e) => setQuoteTerms(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Special Remarks / Client Notes</label>
                    <input
                      type="text"
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatAED(quoteItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Special Discount (AED):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={quoteDiscount}
                      onChange={(e) => setQuoteDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-right bg-white border border-slate-300 rounded font-mono text-rose-700 font-bold"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Delivery & Logistics (AED):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={quoteDeliveryCharge}
                      onChange={(e) => setQuoteDeliveryCharge(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-right bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>

                  <div className="flex justify-between items-center text-emerald-800">
                    <span className="font-semibold">Mandated UAE VAT (5%):</span>
                    <span className="font-mono font-bold">
                      {formatAED(
                        Math.max(
                          0,
                          quoteItems.reduce((s, i) => s + i.netAmount, 0) -
                            quoteDiscount +
                            quoteDeliveryCharge
                        ) * 0.05
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900">Estimated Total (AED):</span>
                    <span className="font-mono font-black text-base text-emerald-800">
                      {formatAED(
                        (Math.max(
                          0,
                          quoteItems.reduce((s, i) => s + i.netAmount, 0) -
                            quoteDiscount +
                            quoteDeliveryCharge
                        ) * 1.05)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewQuoteModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-create-quote"
                  disabled={isCreatingQuote}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50"
                >
                  {isCreatingQuote ? 'Creating Quotation...' : 'Generate Commercial Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotation Preview & Print Modal */}
      {selectedQuoteForPreview && (
        <QuotationModal
          quotation={selectedQuoteForPreview}
          onClose={() => setSelectedQuoteForPreview(null)}
          onQuoteConverted={loadAllData}
          onViewInvoice={onViewInvoice}
        />
      )}
    </div>
  );
};
