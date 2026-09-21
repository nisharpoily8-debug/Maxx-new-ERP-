import React, { useState, useEffect } from 'react';
import { SalesOrder } from '../types/erp.ts';
import { useErp } from '../context/ErpContext.tsx';
import {
  Printer,
  Share2,
  FileText,
  X,
  Building2,
  Calendar,
  Truck,
  CheckCircle,
  Package
} from 'lucide-react';

interface SalesOrderModalProps {
  order: SalesOrder | null;
  onClose: () => void;
  onGenerateInvoice?: (orderId: string) => void;
}

export const SalesOrderModal: React.FC<SalesOrderModalProps> = ({
  order,
  onClose,
  onGenerateInvoice,
}) => {
  const { settings, formatAED, formatUAE, showToast } = useErp();
  const [scaleMode, setScaleMode] = useState<'normal' | 'compact' | 'fit'>('compact');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*MAXPACK PACKAGING LLC - SALES ORDER*\n` +
      `Order No: ${order.orderNumber}\n` +
      `Customer: ${order.customerName}\n` +
      `Date: ${order.date}\n` +
      `Expected Delivery: ${order.deliveryDate || 'Standard 24-48h'}\n` +
      `Total: AED ${order.total.toFixed(2)} (Incl. 5% UAE VAT)\n` +
      `Status: ${order.status}\n\n` +
      `Thank you for ordering with Maxpack UAE!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white"
    >
      {/* Floating Quick Close Button */}
      <button
        onClick={onClose}
        className="fixed top-3 right-4 z-[70] bg-slate-900/90 text-white hover:bg-rose-600 shadow-xl rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold transition border border-slate-700 hover:border-rose-500 cursor-pointer print:hidden"
        title="Close order preview (Esc)"
      >
        <X className="w-4 h-4" />
        <span className="hidden sm:inline">Close (Esc)</span>
      </button>

      <div
        className={`relative w-full ${
          scaleMode === 'fit'
            ? 'max-w-xl'
            : scaleMode === 'compact'
            ? 'max-w-2xl lg:max-w-3xl'
            : 'max-w-3xl'
        } bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none my-4`}
      >
        {/* Sticky Modal Toolbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 shadow-md print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm sm:text-base text-blue-400 truncate">
                  {order.orderNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                  order.status === 'Invoiced'
                    ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                    : order.status === 'Dispatched'
                    ? 'bg-blue-900/80 text-blue-300 border border-blue-700'
                    : 'bg-amber-900/80 text-amber-300 border border-amber-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">{order.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sizing Toggles */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={() => setScaleMode('fit')}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  scaleMode === 'fit' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Fit to screen (Compact)"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() => setScaleMode('compact')}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  scaleMode === 'compact' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Default Compact Width"
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => setScaleMode('normal')}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  scaleMode === 'normal' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Full Size"
              >
                100%
              </button>
            </div>

            {order.status !== 'Invoiced' && onGenerateInvoice && (
              <button
                onClick={() => {
                  onGenerateInvoice(order.id);
                  onClose();
                }}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition"
              >
                To Invoice
              </button>
            )}

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition"
              title="Share on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold transition border border-rose-500/40 cursor-pointer"
              title="Close order (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE SALES ORDER CONTENT */}
        <div
          className={`p-5 sm:p-7 print:p-6 text-slate-900 bg-white transition-all ${
            scaleMode === 'fit' ? 'text-[11px]' : 'text-xs'
          }`}
          id="printable-sales-order"
        >
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-3">
                {settings?.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.companyName || 'Company Logo'}
                    className="h-12 max-w-[170px] object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-extrabold text-lg">
                    {settings?.companyName ? settings.companyName.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black text-slate-900">
                    {settings?.companyName || 'MAXPACK PACKAGING LLC'}
                  </h1>
                  <p className="text-[11px] font-semibold text-emerald-800 tracking-wider">
                    {settings?.tradingName || 'Industrial & Retail Packaging Solutions'}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                <p>{settings?.address || 'Street 22, Dubai Investment Park 1, Jebel Ali'}</p>
                <p>TRN / الرقم الضريبي: <span className="font-mono font-bold text-slate-900">{settings?.trn || '100234857600003'}</span></p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-5">
              <div className="inline-block bg-blue-900 text-white px-3 py-1 rounded text-sm font-black tracking-wider uppercase mb-1.5">
                Sales Order / أمر مبيعات
              </div>
              <p className="font-mono text-base font-bold text-slate-900">{order.orderNumber}</p>
              <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5">
                <p><span className="font-medium text-slate-500">Order Date:</span> {formatUAE(order.date)}</p>
                <p><span className="font-medium text-slate-500">Delivery Date:</span> {order.deliveryDate ? formatUAE(order.deliveryDate) : 'Standard'}</p>
                <p><span className="font-medium text-slate-500">Fulfillment Status:</span> <span className="font-bold text-blue-700">{order.status}</span></p>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Customer Details</p>
              <p className="font-bold text-slate-900">{order.customerName}</p>
              <p className="text-[11px] text-slate-600">{order.customerAddress || 'Dubai, UAE'}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Customer TRN: <span className="font-mono font-semibold text-slate-900">{order.customerTrn || 'Unregistered'}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Order Details</p>
              <p className="text-[11px] text-slate-700">Salesperson: <span className="font-semibold text-slate-900">{order.salespersonName || 'Direct'}</span></p>
              <p className="text-[11px] text-slate-700">Dispatch Location: <span className="font-semibold text-slate-900">Main Warehouse (DIP)</span></p>
              {order.notes && <p className="text-[11px] text-slate-600 italic mt-1">Note: {order.notes}</p>}
            </div>
          </div>

          {/* Order Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden my-4">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-semibold">
                  <th className="py-2 px-3 w-8 text-center">#</th>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-center">Unit</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-3 text-right">VAT (5%)</th>
                  <th className="py-2 px-3 text-right">Total (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {order.items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="py-2 px-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">SKU: {item.sku}</p>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">{formatAED(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-800">{formatAED(item.vatAmount)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatAED(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Signatures */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t border-slate-200">
            <div className="text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Terms & Delivery:</p>
              <p>• Goods will be dispatched strictly according to agreed packaging specifications.</p>
              <p>• Offloading by customer unless delivery with offload has been agreed.</p>
            </div>

            <div className="w-full sm:w-72 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-mono font-bold text-slate-900">{formatAED(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>UAE VAT (5%):</span>
                <span className="font-mono font-bold text-emerald-800">{formatAED(order.vatAmount)}</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center">
                <span className="font-black text-sm text-slate-900">Total (AED):</span>
                <span className="font-mono font-black text-base text-blue-900">{formatAED(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between p-3 bg-slate-100 border-t border-slate-200 print:hidden text-xs">
          <span className="text-slate-500 font-medium">Sales Order • {order.orderNumber}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Document</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
