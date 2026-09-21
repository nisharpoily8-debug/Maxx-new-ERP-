import React from 'react';
import { POSTransaction } from '../types/erp.ts';
import { useErp } from '../context/ErpContext.tsx';
import { Printer, X, Check } from 'lucide-react';

interface ThermalReceiptModalProps {
  transaction: POSTransaction | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ transaction, onClose }) => {
  const { settings, formatAED, formatUAE } = useErp();

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none">
        {/* Action bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">POS Thermal Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (80mm)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 80mm Thermal Receipt Layout */}
        <div className="p-6 font-mono text-[12px] leading-tight text-slate-900 bg-white" id="thermal-receipt-body">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-400 pb-3">
            <h2 className="font-extrabold text-sm tracking-wider uppercase">MAXPACK PACKAGING LLC</h2>
            <p className="text-[11px] text-slate-600">DIP Showroom & Retail Counter</p>
            <p className="text-[10px] text-slate-500">Street 22, DIP 1, Dubai, UAE</p>
            <p className="text-[10px] text-slate-500">Tel: +971 4 885 9100</p>
            <div className="mt-2 font-bold text-[11px] border border-slate-300 py-0.5 rounded">
              TRN: {settings?.trn || '100234857600003'}
            </div>
            <p className="text-[10px] font-bold mt-1 text-slate-700">TAX INVOICE / فاتورة ضريبية مبسطة</p>
          </div>

          {/* Metadata */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{transaction.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{new Date(transaction.createdAt).toLocaleString('en-AE')}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{transaction.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{transaction.customerName || 'Walk-in Retail Customer'}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-2.5 border-b border-dashed border-slate-400">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-600 mb-1">
              <span>Item / Description</span>
              <span>Total</span>
            </div>
            {transaction.items.map((item, idx) => (
              <div key={idx} className="py-1">
                <div className="font-bold text-slate-900">{item.name}</div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>
                    {item.quantity} {item.unit} x {item.unitPrice.toFixed(2)}
                  </span>
                  <span className="font-bold text-slate-900">{item.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal (Excl. VAT):</span>
              <span>{transaction.subtotal.toFixed(2)} AED</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-{transaction.discount.toFixed(2)} AED</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>UAE VAT 5%:</span>
              <span>{transaction.vatAmount.toFixed(2)} AED</span>
            </div>
            <div className="flex justify-between font-black text-sm border-t border-slate-900 pt-1.5 mt-1">
              <span>TOTAL (AED):</span>
              <span>{transaction.total.toFixed(2)} AED</span>
            </div>
          </div>

          {/* Tender & Change */}
          <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Payment Tender:</span>
              <span className="font-bold">{transaction.paymentMethod}</span>
            </div>
            {transaction.paymentMethod === 'Cash' && (
              <>
                <div className="flex justify-between">
                  <span>Cash Given:</span>
                  <span>{(transaction.cashTendered || transaction.total).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Change Due:</span>
                  <span>{(transaction.changeAmount || 0).toFixed(2)} AED</span>
                </div>
              </>
            )}
          </div>

          {/* Barcode & Footer */}
          <div className="text-center pt-3 text-[10px] text-slate-500">
            {/* Visual barcode strip */}
            <div className="h-8 flex justify-center items-center gap-0.5 my-2">
              <div className="w-1 h-full bg-slate-900"></div>
              <div className="w-0.5 h-full bg-slate-900"></div>
              <div className="w-2 h-full bg-slate-900"></div>
              <div className="w-1 h-full bg-slate-900"></div>
              <div className="w-0.5 h-full bg-slate-900"></div>
              <div className="w-2 h-full bg-slate-900"></div>
              <div className="w-1 h-full bg-slate-900"></div>
              <div className="w-0.5 h-full bg-slate-900"></div>
              <div className="w-1.5 h-full bg-slate-900"></div>
              <div className="w-1 h-full bg-slate-900"></div>
            </div>
            <p className="font-mono">{transaction.receiptNumber}</p>
            <p className="mt-2 font-bold text-slate-700">Thank you for visiting Maxpack UAE!</p>
            <p className="text-[9px] mt-0.5">
              Goods once sold may be exchanged within 3 days with this receipt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
