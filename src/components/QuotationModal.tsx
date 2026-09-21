import React, { useState } from 'react';
import { SalesQuotation, SalesInvoice } from '../types/erp.ts';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import {
  Printer,
  Share2,
  CheckCircle,
  FileText,
  X,
  Send,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';

interface QuotationModalProps {
  quotation: SalesQuotation | null;
  onClose: () => void;
  onQuoteConverted?: () => void;
  onViewInvoice?: (invoice: SalesInvoice) => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  quotation,
  onClose,
  onQuoteConverted,
  onViewInvoice,
}) => {
  const { settings, formatAED, formatUAE, showToast } = useErp();
  const [isConvertingOrder, setIsConvertingOrder] = useState(false);
  const [isConvertingInvoice, setIsConvertingInvoice] = useState(false);

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*${settings?.companyName || 'MAXPACK PACKAGING LLC'} - SALES QUOTATION*\n` +
      `Quote No: ${quotation.quoteNumber}\n` +
      `Customer: ${quotation.customerName}\n` +
      `Date: ${quotation.date}\n` +
      `Valid Until: ${quotation.expiryDate}\n` +
      `Total Estimate: AED ${quotation.total.toFixed(2)} (Incl. 5% UAE VAT)\n` +
      `Prepared By: ${quotation.salespersonName}\n\n` +
      `Thank you for considering our commercial proposal!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleConvertToOrder = async () => {
    try {
      setIsConvertingOrder(true);
      await api.convertQuotationToOrder(quotation.id);
      showToast(`Quotation ${quotation.quoteNumber} converted to Sales Order successfully!`, 'success');
      if (onQuoteConverted) onQuoteConverted();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to convert quotation to order', 'error');
    } finally {
      setIsConvertingOrder(false);
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      setIsConvertingInvoice(true);
      const invoice = await api.convertQuotationToInvoice(quotation.id);
      showToast(`Quotation ${quotation.quoteNumber} converted to Tax Invoice ${invoice.invoiceNumber}!`, 'success');
      if (onQuoteConverted) onQuoteConverted();
      onClose();
      if (onViewInvoice) {
        onViewInvoice(invoice);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to convert quotation to invoice', 'error');
    } finally {
      setIsConvertingInvoice(false);
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
                <span className="font-mono font-bold text-sm text-emerald-400">
                  {quotation.quoteNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  quotation.status === 'Converted'
                    ? 'bg-blue-900/80 text-blue-300 border border-blue-700'
                    : quotation.status === 'Approved'
                    ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-900/80 text-amber-300 border border-amber-700'
                }`}>
                  {quotation.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{quotation.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quotation.status !== 'Converted' && (
              <>
                <button
                  id="btn-convert-quote-order"
                  onClick={handleConvertToOrder}
                  disabled={isConvertingOrder}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700 disabled:opacity-50"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{isConvertingOrder ? 'Converting...' : 'Convert to Order'}</span>
                </button>

                <button
                  id="btn-convert-quote-invoice"
                  onClick={handleConvertToInvoice}
                  disabled={isConvertingInvoice}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{isConvertingInvoice ? 'Generating Invoice...' : 'Generate Tax Invoice'}</span>
                </button>
              </>
            )}

            <button
              id="btn-whatsapp-quote-share"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition"
              title="Share quotation via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              id="btn-print-quotation"
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

        {/* PRINTABLE QUOTATION CONTENT */}
        <div className="p-8 sm:p-12 text-slate-900 bg-white" id="printable-quotation">
          {/* Header & Company Logo */}
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
                <p>Tel: {settings?.phone || '+971 4 885 9100'} | Email: {settings?.email || 'sales@maxpack.ae'}</p>
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
                <span className="text-sm font-black tracking-widest uppercase">SALES QUOTATION</span>
                <span className="block text-[11px] font-medium text-emerald-300 font-sans">عرض أسعار تجاري</span>
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <p>
                  <span className="text-slate-500">Quotation No:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">{quotation.quoteNumber}</span>
                </p>
                <p>
                  <span className="text-slate-500">Date:</span>{' '}
                  <span className="font-medium text-slate-900">{formatUAE(quotation.date)}</span>
                </p>
                <p>
                  <span className="text-slate-500">Valid Until:</span>{' '}
                  <span className="font-medium text-emerald-700 font-semibold">{formatUAE(quotation.expiryDate)}</span>
                </p>
                <p>
                  <span className="text-slate-500">Prepared By:</span>{' '}
                  <span className="font-medium text-slate-900">{quotation.salespersonName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Customer / Bill To Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                QUOTATION ISSUED TO / العميل
              </span>
              <p className="text-sm font-black text-slate-900">{quotation.customerName}</p>
              {quotation.customerAddress && (
                <p className="text-slate-600 mt-1 whitespace-pre-line">{quotation.customerAddress}</p>
              )}
              {quotation.customerPhone && (
                <p className="text-slate-600 mt-1">Contact: {quotation.customerPhone}</p>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                CUSTOMER TAX & COMMERCIAL
              </span>
              <p>
                <span className="text-slate-500">Customer TRN:</span>{' '}
                <span className="font-mono font-bold text-slate-900">
                  {quotation.customerTrn || 'Unregistered / Non-VAT'}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Currency:</span>{' '}
                <span className="font-bold text-slate-900">UAE Dirham (AED)</span>
              </p>
              <p>
                <span className="text-slate-500">Status:</span>{' '}
                <span className="font-bold text-emerald-800">{quotation.status}</span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto my-6">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description / الوصف</th>
                  <th className="py-2.5 px-2 text-center w-16">Unit</th>
                  <th className="py-2.5 px-2 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
                  <th className="py-2.5 px-2 text-center w-16">Disc %</th>
                  <th className="py-2.5 px-3 text-right w-24">Net (AED)</th>
                  <th className="py-2.5 px-2 text-center w-16">VAT</th>
                  <th className="py-2.5 px-3 text-right w-24">Total (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                {quotation.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</p>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-500">
                      {item.discount > 0 ? `${item.discount}%` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      {item.netAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-emerald-700 font-medium">5%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Calculations */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 my-6">
            <div className="w-full sm:w-1/2 space-y-3 text-xs">
              {quotation.terms && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Commercial Terms & Conditions:</span>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line text-[11px]">{quotation.terms}</p>
                </div>
              )}

              {quotation.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Special Instructions / Remarks:</span>
                  <p className="text-slate-600 text-[11px]">{quotation.notes}</p>
                </div>
              )}

              {/* Bank Details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-0.5">
                <p className="font-bold text-slate-800">Bank Details for Wire Transfers:</p>
                <p className="text-slate-600">Bank: {settings?.bankDetails?.bankName || 'Emirates NBD'}</p>
                <p className="text-slate-600">Account: {settings?.bankDetails?.accountName || 'Maxpack Packaging LLC'}</p>
                <p className="font-mono text-slate-900 font-bold">IBAN: {settings?.bankDetails?.iban || 'AE240260001029384756001'}</p>
              </div>
            </div>

            <div className="w-full sm:w-80 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-mono font-bold text-slate-900">{formatAED(quotation.subtotal)}</span>
              </div>

              {quotation.discount > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Special Discount:</span>
                  <span className="font-mono font-bold">-{formatAED(quotation.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>UAE VAT (5% FTA Standard):</span>
                <span className="font-mono font-bold text-emerald-800">{formatAED(quotation.vatAmount)}</span>
              </div>

              {quotation.deliveryCharge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery & Handling:</span>
                  <span className="font-mono font-bold text-slate-900">{formatAED(quotation.deliveryCharge)}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center">
                <span className="font-black text-sm text-slate-900">Total Estimate (AED):</span>
                <span className="font-mono font-black text-lg text-emerald-800">{formatAED(quotation.total)}</span>
              </div>
            </div>
          </div>

          {/* Authorization & Acceptance Signatures */}
          <div className="pt-10 mt-10 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-center">
            <div>
              <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-900">Authorized Signature & Stamp</p>
              <p className="text-[11px] text-slate-500">{settings?.companyName || 'Maxpack Packaging LLC'}</p>
            </div>
            <div>
              <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-900">Customer Confirmation & Acceptance</p>
              <p className="text-[11px] text-slate-500">Sign & Stamp to confirm order acceptance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
