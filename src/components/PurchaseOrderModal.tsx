import React, { useState, useEffect } from 'react';
import { PurchaseOrder } from '../types/erp.ts';
import { useErp } from '../context/ErpContext.tsx';
import {
  Printer,
  Share2,
  FileText,
  X,
  Truck,
  Building2,
  Calendar,
  CheckCircle,
  PackageCheck
} from 'lucide-react';

interface PurchaseOrderModalProps {
  po: PurchaseOrder | null;
  onClose: () => void;
  onReceivePO?: (poId: string) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  po,
  onClose,
  onReceivePO,
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

  if (!po) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*MAXPACK PACKAGING LLC - PURCHASE ORDER*\n` +
      `PO Number: ${po.poNumber}\n` +
      `Supplier: ${po.supplierName}\n` +
      `Date: ${po.date}\n` +
      `Expected Delivery: ${po.expectedDeliveryDate || 'Immediate'}\n` +
      `Total: AED ${po.total.toFixed(2)} (Incl. 5% UAE VAT)\n` +
      `TRN: ${settings?.trn || '100234857600003'}\n\n` +
      `Official Procurement Order from Maxpack Packaging LLC`
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
        title="Close purchase order preview (Esc)"
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
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm sm:text-base text-emerald-400 truncate">
                  {po.poNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                  po.status === 'Received'
                    ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                    : 'bg-blue-900/80 text-blue-300 border border-blue-700'
                }`}>
                  {po.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">{po.supplierName}</p>
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

            {po.status !== 'Received' && onReceivePO && (
              <button
                onClick={() => {
                  onReceivePO(po.id);
                  onClose();
                }}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition shadow-xs"
              >
                Receive Goods
              </button>
            )}

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition"
              title="Share PO via WhatsApp"
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
              title="Close PO (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE PO CONTENT */}
        <div
          className={`p-5 sm:p-7 print:p-6 text-slate-900 bg-white transition-all ${
            scaleMode === 'fit' ? 'text-[11px]' : 'text-xs'
          }`}
          id="printable-purchase-order"
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
                    Official Procurement Order
                  </p>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                <p>{settings?.address || 'Street 22, Dubai Investment Park 1, Jebel Ali'}</p>
                <p>Company TRN: <span className="font-mono font-bold text-slate-900">{settings?.trn || '100234857600003'}</span></p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-5">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-sm font-black tracking-wider uppercase mb-1.5">
                Purchase Order / أمر شراء
              </div>
              <p className="font-mono text-base font-bold text-slate-900">{po.poNumber}</p>
              <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5">
                <p><span className="font-medium text-slate-500">Date:</span> {formatUAE(po.date)}</p>
                <p><span className="font-medium text-slate-500">Expected Delivery:</span> {formatUAE(po.expectedDeliveryDate)}</p>
                <p><span className="font-medium text-slate-500">Status:</span> <span className="font-bold text-emerald-800">{po.status}</span></p>
              </div>
            </div>
          </div>

          {/* Supplier and Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Vendor / Supplier</p>
              <p className="font-bold text-slate-900">{po.supplierName}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Supplier TRN: <span className="font-mono font-semibold text-slate-900">{po.supplierTrn}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Delivery Destination</p>
              <p className="font-bold text-slate-900">Maxpack DIP Central Warehouse</p>
              <p className="text-[11px] text-slate-600">Street 22, Dubai Investment Park 1, Dubai, UAE</p>
              <p className="text-[11px] text-slate-600">Contact: Warehouse Incharge (+971 4 885 9100)</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="border border-slate-200 rounded-lg overflow-hidden my-4">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-semibold">
                  <th className="py-2 px-3 w-8 text-center">#</th>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-center">Unit</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Cost</th>
                  <th className="py-2 px-3 text-right">VAT (5%)</th>
                  <th className="py-2 px-3 text-right">Total (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {po.items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="py-2 px-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">SKU: {item.sku}</p>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">{item.unit}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">{formatAED(item.unitCost)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-800">{formatAED(item.vatAmount)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatAED(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary and Signatures */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t border-slate-200">
            <div className="text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Procurement Instructions:</p>
              <p>• Supplier Tax Invoice must reference this PO number: <span className="font-mono font-bold text-slate-800">{po.poNumber}</span></p>
              <p>• Quality inspection and mill test certificate required upon offloading.</p>
            </div>

            <div className="w-full sm:w-72 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-mono font-bold text-slate-900">{formatAED(po.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>UAE VAT (5% Input Tax):</span>
                <span className="font-mono font-bold text-emerald-800">{formatAED(po.vatAmount)}</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center">
                <span className="font-black text-sm text-slate-900">Total (AED):</span>
                <span className="font-mono font-black text-base text-slate-900">{formatAED(po.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between p-3 bg-slate-100 border-t border-slate-200 print:hidden text-xs">
          <span className="text-slate-500 font-medium">Purchase Order • {po.poNumber}</span>
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
