import React, { useState } from 'react';
import { SalesInvoice, Payment } from '../types/erp.ts';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import {
  Printer,
  Share2,
  CheckCircle,
  CreditCard,
  Building2,
  FileText,
  X,
  Send,
  AlertCircle
} from 'lucide-react';

interface TaxInvoiceModalProps {
  invoice: SalesInvoice | null;
  onClose: () => void;
  onInvoiceUpdated?: () => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({
  invoice,
  onClose,
  onInvoiceUpdated,
}) => {
  const { settings, formatAED, formatUAE, showToast, can } = useErp();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(invoice?.balanceDue || 0);
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*MAXPACK PACKAGING LLC - TAX INVOICE*\n` +
      `Invoice No: ${invoice.invoiceNumber}\n` +
      `Customer: ${invoice.customerName}\n` +
      `Date: ${invoice.date}\n` +
      `Total Amount: AED ${invoice.total.toFixed(2)} (Incl. 5% UAE VAT)\n` +
      `Balance Due: AED ${invoice.balanceDue.toFixed(2)}\n` +
      `TRN: ${settings?.trn || '100234857600003'}\n` +
      `Bank: Emirates NBD (IBAN: ${settings?.bankDetails?.iban || 'AE240260001029384756001'})\n\n` +
      `Thank you for your business with Maxpack UAE!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }
    if (paymentAmount > invoice.balanceDue + 0.01) {
      showToast(`Payment exceeds invoice balance due of ${formatAED(invoice.balanceDue)}`, 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.recordInvoicePayment(invoice.id, {
        date: new Date().toISOString().split('T')[0],
        type: 'Customer Receipt',
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        amount: paymentAmount,
        paymentMethod,
        referenceNo: referenceNo || `REF-${Math.floor(Math.random() * 89999) + 10000}`,
        bankAccount: paymentMethod === 'Cash' ? '1010' : '1020',
        recordedBy: 'Accountant',
        notes: paymentNotes,
      });

      showToast(`Payment of ${formatAED(paymentAmount)} recorded successfully!`, 'success');
      setShowPaymentForm(false);
      if (onInvoiceUpdated) onInvoiceUpdated();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{invoice.invoiceNumber}</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    invoice.status === 'Paid'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : invoice.status === 'Partially Paid'
                      ? 'bg-amber-500/20 text-amber-300'
                      : invoice.status === 'Overdue'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">UAE FTA Compliant Tax Invoice / فاتورة ضريبية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice.balanceDue > 0 && can('accounting') && (
              <button
                id="btn-record-invoice-payment"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
              >
                <CreditCard className="w-4 h-4" />
                <span>{showPaymentForm ? 'Cancel Payment' : 'Record Payment'}</span>
              </button>
            )}

            <button
              id="btn-whatsapp-invoice-share"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition"
              title="Share invoice breakdown directly on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              id="btn-print-tax-invoice"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Payment Record Drawer */}
        {showPaymentForm && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 print:hidden animate-in fade-in">
            <form onSubmit={handleRecordPayment} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Amount (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  max={invoice.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-bold text-slate-900"
                  required
                />
                <span className="text-[11px] text-slate-500">Max: {formatAED(invoice.balanceDue)}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-900"
                >
                  <option value="Bank Transfer">Bank Transfer (Emirates NBD)</option>
                  <option value="Cheque">Cheque / PDC</option>
                  <option value="Cash">Cash (Showroom Till)</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reference / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. ENBD-94821 or CHQ-00124"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PRINTABLE INVOICE CONTENT (conforming to UAE FTA Tax Invoice requirements) */}
        <div className="p-8 sm:p-12 text-slate-900 bg-white" id="printable-tax-invoice">
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-3">
                {settings?.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.companyName || 'Company Logo'}
                    className="h-14 max-w-[190px] object-contain rounded-lg shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                    {settings?.companyName ? settings.companyName.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    {settings?.companyName || 'MAXPACK PACKAGING LLC'}
                  </h1>
                  {settings?.tradingName && (
                    <p className="text-xs font-semibold text-emerald-800 tracking-wider">
                      {settings.tradingName}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p>{settings?.address || 'Street 22, Dubai Investment Park 1, Jebel Ali'}</p>
                <p>{settings?.poBox ? `${settings.poBox}, ` : ''}{settings?.city || 'Dubai'}, {settings?.country || 'United Arab Emirates'}</p>
                <p>Tel: {settings?.phone || '+971 4 885 9100'} | Email: {settings?.email || 'accounts@maxpack.ae'}</p>
                <p className="font-bold text-slate-900 mt-1">
                  Company TRN / الرقم الضريبي:{' '}
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-emerald-950 font-bold border border-slate-200">
                    {settings?.trn || '100234857600003'}
                  </span>
                </p>
              </div>
            </div>

            <div className="text-right sm:min-w-[260px]">
              <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-lg mb-2">
                <span className="text-sm font-black tracking-widest uppercase">TAX INVOICE</span>
                <span className="block text-[11px] font-medium text-emerald-300 font-sans">فاتورة ضريبية</span>
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <p>
                  <span className="text-slate-500">Invoice No:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </p>
                <p>
                  <span className="text-slate-500">Invoice Date:</span>{' '}
                  <span className="font-medium text-slate-900">{formatUAE(invoice.date)}</span>
                </p>
                <p>
                  <span className="text-slate-500">Date of Supply:</span>{' '}
                  <span className="font-medium text-slate-900">{formatUAE(invoice.supplyDate || invoice.date)}</span>
                </p>
                <p>
                  <span className="text-slate-500">Payment Due:</span>{' '}
                  <span className="font-medium text-slate-900">{formatUAE(invoice.dueDate)}</span>
                </p>
                <p>
                  <span className="text-slate-500">Payment Terms:</span>{' '}
                  <span className="font-medium text-slate-900">{invoice.paymentTerms}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Customer / Billed To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Customer Details / تفاصيل العميل
              </span>
              <p className="text-sm font-bold text-slate-900">{invoice.customerName}</p>
              <p className="text-xs text-slate-600 mt-0.5">{invoice.customerAddress}</p>
              <p className="text-xs text-slate-600">{invoice.customerPhone}</p>
              <div className="mt-2 text-xs">
                <span className="text-slate-500">Customer TRN / الرقم الضريبي للعميل: </span>
                <span className="font-mono font-bold text-slate-900">
                  {invoice.customerTrn ? invoice.customerTrn : 'Unregistered (End Consumer)'}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right sm:border-l border-slate-200 sm:pl-6">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Fulfillment & Salesperson
              </span>
              <p className="text-xs text-slate-600">
                <span className="text-slate-500">Sales Representative:</span>{' '}
                <span className="font-semibold text-slate-900">{invoice.salespersonName}</span>
              </p>
              <p className="text-xs text-slate-600">
                <span className="text-slate-500">Dispatch Location:</span>{' '}
                <span className="font-semibold text-slate-900">DIP Central Warehouse</span>
              </p>
              {invoice.orderId && (
                <p className="text-xs text-slate-600 mt-1">
                  <span className="text-slate-500">Order Reference:</span>{' '}
                  <span className="font-mono font-semibold text-slate-900">{invoice.orderId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto my-6">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold">
                  <th className="py-2.5 px-3 rounded-l-lg">#</th>
                  <th className="py-2.5 px-3">Item Description / الوصف</th>
                  <th className="py-2.5 px-2 text-center">Unit</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Price (AED)</th>
                  <th className="py-2.5 px-2 text-right">Disc.</th>
                  <th className="py-2.5 px-3 text-right">Net Taxable</th>
                  <th className="py-2.5 px-2 text-center">VAT</th>
                  <th className="py-2.5 px-3 text-right">VAT (AED)</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Total (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</p>
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-slate-600">{item.unit}</td>
                    <td className="py-3 px-2 text-right font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">{item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-500">
                      {item.discount > 0 ? item.discount.toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                      {item.netAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600">5%</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700">
                      {item.vatAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 my-6 pt-4 border-t border-slate-200">
            {/* FTA QR Code & Terms */}
            <div className="sm:col-span-7 flex items-start gap-4">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
                {/* Visual SVG QR representation for FTA e-invoicing */}
                <div className="w-24 h-24 bg-white border border-slate-300 p-1 flex items-center justify-center">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-slate-900">
                    <div className="bg-white col-span-2 row-span-2"></div>
                    <div className="bg-slate-900 col-span-2"></div>
                    <div className="bg-white col-span-2 row-span-2"></div>
                    <div className="bg-white col-span-2"></div>
                    <div className="bg-slate-900 col-span-2"></div>
                    <div className="bg-white col-span-2 row-span-2"></div>
                    <div className="bg-slate-900 col-span-2"></div>
                    <div className="bg-white col-span-2"></div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-semibold uppercase">FTA QR e-Invoice</span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Wire Transfer & Payment Terms:</p>
                <p>Bank: <span className="font-semibold text-slate-900">{settings?.bankDetails?.bankName || 'Emirates NBD'}</span></p>
                <p>Account Name: <span className="font-semibold text-slate-900">{settings?.bankDetails?.accountName || 'Maxpack Packaging LLC'}</span></p>
                <p className="font-mono text-[11px]">IBAN: <span className="font-bold text-slate-900">{settings?.bankDetails?.iban || 'AE240260001029384756001'}</span></p>
                <p className="font-mono text-[11px]">SWIFT: {settings?.bankDetails?.swiftCode || 'EBILAEADXXX'}</p>
                <p className="text-[11px] text-slate-500 pt-1 italic">
                  * All supplies subject to standard UAE packaging commercial terms. Goods once sold are returnable only within 7 days in undamaged original packaging.
                </p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="sm:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-mono font-medium text-slate-900">{formatAED(invoice.subtotal)}</span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Trade Discount:</span>
                  <span className="font-mono font-medium">-{formatAED(invoice.discount)}</span>
                </div>
              )}

              {invoice.deliveryCharge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery & Freight:</span>
                  <span className="font-mono font-medium text-slate-900">{formatAED(invoice.deliveryCharge)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-1.5">
                <span>Net Taxable Amount (AED):</span>
                <span className="font-mono">
                  {formatAED(invoice.subtotal - invoice.discount + invoice.deliveryCharge)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-800 font-bold">
                <span>Total 5% UAE VAT (ضريبة القيمة المضافة):</span>
                <span className="font-mono">{formatAED(invoice.vatAmount)}</span>
              </div>

              <div className="flex justify-between text-sm font-black text-slate-900 border-t-2 border-slate-900 pt-2 text-base">
                <span>Total Due / المجموع الإجمالي:</span>
                <span className="font-mono text-emerald-900">{formatAED(invoice.total)}</span>
              </div>

              {invoice.paidAmount > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Paid to Date:</span>
                    <span className="font-mono">{formatAED(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatAED(invoice.balanceDue)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Authorized Signature Block */}
          <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Received By (Customer Seal & Signature):</p>
              <div className="h-14 border-b border-dashed border-slate-300 w-48 mt-2"></div>
              <p className="text-[11px] text-slate-400 mt-1">Date: ____/____/2026</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">For Maxpack Packaging LLC:</p>
              <div className="h-14 border-b border-dashed border-slate-300 w-48 ml-auto mt-2 flex items-center justify-center">
                <span className="text-[11px] font-serif italic text-emerald-800 font-semibold tracking-wide">
                  Authorized Signatory
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Dubai, United Arab Emirates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
