import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import { PurchaseOrder, SupplierBill, Supplier, Product, PurchaseItem } from '../types/erp.ts';
import {
  Truck,
  Plus,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  Building,
  Building2,
  CreditCard,
  FileText,
  Boxes,
  Receipt,
  X,
  Trash2
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const { formatAED, formatUAE, warehouses, showToast, can } = useErp();

  const [activeTab, setActiveTab] = useState<'orders' | 'bills' | 'suppliers'>('orders');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modals
  const [showNewPOModal, setShowNewPOModal] = useState(false);
  const [showPayBillModal, setShowPayBillModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');

  // New Supplier State
  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, 'id' | 'createdAt' | 'balance'>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    trn: '',
    address: '',
    emirate: 'Dubai',
    paymentTerms: 'Net 30 Days',
    category: 'Paper Mills & Raw Materials',
    notes: '',
  });

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('wh-1');
  const [poItems, setPoItems] = useState<PurchaseItem[]>([]);
  const [poNotes, setPoNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pos, bills, sups, prods] = await Promise.all([
        api.getPurchaseOrders(),
        api.getSupplierBills(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setPurchaseOrders(pos);
      setSupplierBills(bills);
      setSuppliers(sups);
      setProducts(prods);

      if (sups.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(sups[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceivePO = async (poId: string) => {
    try {
      const received = await api.receivePurchaseOrder(poId);
      showToast(
        `PO ${received.poNumber} received! Stock updated and Supplier Bill generated.`,
        'success'
      );
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddPOItem = (productId: string) => {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return;

    const unitCost = p.costPrice;
    const quantity = 50;
    const vatRate = 0.05;
    const vatAmount = unitCost * quantity * vatRate;
    const total = unitCost * quantity + vatAmount;

    setPoItems([
      ...poItems,
      {
        id: `poi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity,
        receivedQuantity: 0,
        unit: p.unit,
        unitCost,
        vatRate,
        vatAmount,
        total,
      },
    ]);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      showToast('Please add items to purchase order', 'error');
      return;
    }

    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    if (!sup) return;

    const subtotal = poItems.reduce((s, i) => s + i.unitCost * i.quantity, 0);
    const vatAmount = subtotal * 0.05;
    const total = subtotal + vatAmount;

    try {
      const created = await api.createPurchaseOrder({
        supplierId: sup.id,
        supplierName: sup.name,
        supplierTrn: sup.trn,
        warehouseId: destWarehouseId,
        date: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        items: poItems,
        subtotal,
        vatAmount,
        total,
        status: 'Sent',
        notes: poNotes || 'Standard supplier supply order',
      });

      showToast(`Purchase Order ${created.poNumber} dispatched to ${sup.name}!`, 'success');
      setShowNewPOModal(false);
      setPoItems([]);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handlePaySupplierBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      await api.paySupplierBill(selectedBill.id, {
        date: new Date().toISOString().split('T')[0],
        type: 'Supplier Payment',
        supplierId: selectedBill.supplierId,
        supplierName: selectedBill.supplierName,
        amount: Number(paymentAmount),
        paymentMethod,
        referenceNo: paymentRef || `ENBD-${Math.floor(Math.random() * 89999) + 10000}`,
        bankAccount: '1020',
        recordedBy: 'Accountant',
        notes: `Settlement for ${selectedBill.billNumber}`,
      });

      showToast(`Disbursed ${formatAED(paymentAmount)} to ${selectedBill.supplierName}!`, 'success');
      setShowPayBillModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) {
      showToast('Supplier/Vendor name is required', 'error');
      return;
    }

    try {
      const created = await api.createSupplier(newSupplier);
      showToast(`Supplier ${created.name} registered successfully!`, 'success');
      setShowNewSupplierModal(false);
      setNewSupplier({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        trn: '',
        address: '',
        emirate: 'Dubai',
        paymentTerms: 'Net 30 Days',
        category: 'Paper Mills & Raw Materials',
        notes: '',
      });
      await loadData();
      setSelectedSupplierId(created.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to create supplier', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Purchases, Goods Receipt (GRN) & Vendor Bills
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage paper mill purchase orders, receiving inspection, vendor masters, and supplier trade liabilities.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {can('purchases') && (
            <button
              onClick={() => setShowNewSupplierModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>+ Add Vendor / Supplier</span>
            </button>
          )}

          {can('purchases') && (
            <button
              onClick={() => {
                setShowNewPOModal(true);
                if (poItems.length === 0 && products.length > 0) {
                  handleAddPOItem(products[0].id);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'bills'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Supplier Bills & Payables ({supplierBills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Suppliers & Mills ({suppliers.length})</span>
        </button>
      </div>

      {/* 1. PURCHASE ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">PO #</th>
                  <th className="py-3 px-4">Supplier & TRN</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Expected Date</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">5% VAT</th>
                  <th className="py-3 px-4 text-right">Total (AED)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">GRN Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">No purchase orders issued yet</p>
                      <p className="text-xs text-slate-400 mt-1">Click "New Purchase Order" to procure raw materials or finished packaging from mills.</p>
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{po.poNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{po.supplierName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">TRN: {po.supplierTrn}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{formatUAE(po.date)}</td>
                    <td className="py-3 px-3 text-slate-600">{formatUAE(po.expectedDeliveryDate)}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatAED(po.subtotal)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-800">{formatAED(po.vatAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatAED(po.total)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === 'Received'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {po.status !== 'Received' ? (
                        <button
                          onClick={() => handleReceivePO(po.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs shadow-xs transition"
                        >
                          Receive Goods (GRN)
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">Stock Received</span>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SUPPLIER BILLS TAB */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Bill #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-3">Bill Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Total (AED)</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierBills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">No supplier bills recorded</p>
                      <p className="text-xs text-slate-400 mt-1">Vendor invoices and payable bills will appear here when goods are received.</p>
                    </td>
                  </tr>
                ) : (
                  supplierBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.billNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{b.supplierName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Inv: {b.supplierInvoiceNo}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{formatUAE(b.date)}</td>
                    <td className="py-3 px-3 text-slate-600">{formatUAE(b.dueDate)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatAED(b.total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700">
                      {formatAED(b.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                      {formatAED(b.balanceDue)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'Partially Paid'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.balanceDue > 0 && can('accounting') ? (
                        <button
                          onClick={() => {
                            setSelectedBill(b);
                            setPaymentAmount(b.balanceDue);
                            setShowPayBillModal(true);
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-xs transition"
                        >
                          Disburse Wire
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">Cleared</span>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Approved Paper Mills & Raw Material Vendors</h3>
              <p className="text-xs text-slate-500">Official suppliers with Federal Tax Authority TRN and settlement terms.</p>
            </div>
            {can('purchases') && (
              <button
                onClick={() => setShowNewSupplierModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vendor / Mill</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {suppliers.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No suppliers registered yet</p>
                <p className="text-xs text-slate-400 mt-1">Register paper mills, corrugated sheet manufacturers, and poly resin suppliers.</p>
                {can('purchases') && (
                  <button
                    onClick={() => setShowNewSupplierModal(true)}
                    className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    + Register First Vendor
                  </button>
                )}
              </div>
            ) : (
              suppliers.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">TRN: {s.trn || 'Pending TRN'}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {s.emirate}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>Category: <span className="font-medium text-slate-800">{s.category || 'Packaging Supplies'}</span></p>
                  <p>Contact: {s.contactPerson} {s.phone ? `(${s.phone})` : ''}</p>
                  <p>Terms: <strong>{s.paymentTerms}</strong></p>
                  {s.email && <p className="text-slate-500 text-[11px]">Email: {s.email}</p>}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Payable Balance:</span>
                  <span className="font-mono font-bold text-rose-700">{formatAED(s.balance)}</span>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW PURCHASE ORDER MODAL */}
      {/* ========================================================================= */}
      {showNewPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Issue Supplier Purchase Order</h3>
              <button
                onClick={() => setShowNewPOModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Supplier / Paper Mill</label>
                    <button
                      type="button"
                      onClick={() => setShowNewSupplierModal(true)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] underline"
                    >
                      + Add New Vendor
                    </button>
                  </div>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    required
                  >
                    {suppliers.length === 0 && (
                      <option value="">No suppliers registered - click + Add New Vendor</option>
                    )}
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.trn ? `TRN: ${s.trn}` : 'No TRN'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Receiving Warehouse</label>
                  <select
                    value={destWarehouseId}
                    onChange={(e) => setDestWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase text-[11px] text-slate-900">PO Items</span>
                  <button
                    type="button"
                    onClick={() => handleAddPOItem(products[0]?.id)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold"
                  >
                    + Add Product
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const p = products.find((pr) => pr.id === e.target.value);
                          if (p) {
                            const updated = [...poItems];
                            updated[idx] = {
                              ...updated[idx],
                              productId: p.id,
                              name: p.name,
                              sku: p.sku,
                              unitCost: p.costPrice,
                            };
                            setPoItems(updated);
                          }
                        }}
                        className="flex-1 bg-transparent font-medium"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].quantity = parseInt(e.target.value) || 1;
                          setPoItems(updated);
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-right"
                      />

                      <span className="text-slate-500 font-mono">{item.unitCost.toFixed(2)} AED</span>

                      <button
                        type="button"
                        onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPOModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md"
                >
                  Dispatch Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAY SUPPLIER BILL MODAL */}
      {/* ========================================================================= */}
      {showPayBillModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Disburse Supplier Payment</h3>
              <p className="text-[11px] text-slate-400">{selectedBill.supplierName} • {selectedBill.billNumber}</p>
            </div>

            <form onSubmit={handlePaySupplierBill} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Disbursement Amount (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedBill.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-base"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Remaining due: {formatAED(selectedBill.balanceDue)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Disbursement Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Bank Transfer">Bank Wire (Emirates NBD)</option>
                  <option value="Cheque">Corporate Cheque</option>
                  <option value="Cash">Cash Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Wire Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. ENBD-WT-92144"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayBillModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Wire Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW VENDOR / SUPPLIER MODAL */}
      {/* ========================================================================= */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Register New Vendor / Paper Mill</h3>
                  <p className="text-[11px] text-slate-400">Add raw material supplier for Purchase Orders and GRN</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewSupplierModal(false)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-5 space-y-4 text-xs max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Company / Mill Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gulf Paper Mills & Corrugated Sheets LLC"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Supplier Category</label>
                    <select
                      value={newSupplier.category}
                      onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      <option value="Paper Mills & Raw Materials">Paper Mills & Fluting</option>
                      <option value="Corrugated Board Manufacturers">Corrugated Sheets</option>
                      <option value="Adhesive & Tape Formulators">Adhesives & Tapes</option>
                      <option value="Poly & Film Extruders">Poly & Stretch Films</option>
                      <option value="Packaging Hardware & Strapping">Strapping & Tools</option>
                      <option value="General Packaging Vendor">General Supplier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">UAE FTA TRN (15 Digits)</label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 100492817200003"
                      value={newSupplier.trn}
                      onChange={(e) => setNewSupplier({ ...newSupplier, trn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Nair / Sales Head"
                      value={newSupplier.contactPerson}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone / Mobile</label>
                    <input
                      type="text"
                      placeholder="+971 4 888 1234"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Official Email</label>
                    <input
                      type="email"
                      placeholder="orders@gulfpaper.ae"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Emirate</label>
                    <select
                      value={newSupplier.emirate}
                      onChange={(e) => setNewSupplier({ ...newSupplier, emirate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
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
                    <label className="block text-slate-700 font-bold mb-1">Payment / Trade Terms</label>
                    <select
                      value={newSupplier.paymentTerms}
                      onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    >
                      <option value="Immediate / Advance">Immediate / Advance</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Net 45 Days">Net 45 Days</option>
                      <option value="Net 60 Days">Net 60 Days</option>
                      <option value="PDC 30 Days">PDC 30 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Warehouse / Mill Address</label>
                    <input
                      type="text"
                      placeholder="Plot 42, Industrial Area 3"
                      value={newSupplier.address}
                      onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Special Notes / Specifications</label>
                  <textarea
                    rows={2}
                    placeholder="GSM ratings, minimum order quantities, delivery lead times..."
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-xs transition"
                >
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
