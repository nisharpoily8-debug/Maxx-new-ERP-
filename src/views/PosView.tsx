import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import {
  Product,
  POSTransaction,
  CashierShift,
  InvoiceItem
} from '../types/erp.ts';

export type CartItem = InvoiceItem;
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Building,
  CheckCircle,
  Printer,
  Clock,
  Layers,
  ShoppingBag,
  ArrowRight,
  X
} from 'lucide-react';

interface PosViewProps {
  onPrintReceipt: (tx: POSTransaction) => void;
}

export const PosView: React.FC<PosViewProps> = ({ onPrintReceipt }) => {
  const { formatAED, currentUser, showToast } = useErp();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Split'>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [currentShift, setCurrentShift] = useState<CashierShift | null>(null);

  // Shift Modals
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState(500);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [actualCashCount, setActualCashCount] = useState(0);
  const [shiftClosingNotes, setShiftClosingNotes] = useState('');

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, shift] = await Promise.all([
        api.getProducts(),
        api.getCurrentShift(currentUser.id),
      ]);
      setProducts(prods);
      setCurrentShift(shift);
      if (!shift) {
        setShowOpenShiftModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenShift = async () => {
    try {
      const shift = await api.openShift({
        shiftNumber: '',
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        warehouseId: 'wh-1',
        startTime: new Date().toISOString(),
        openingFloat: Number(openingFloat) || 0,
        expectedCash: Number(openingFloat) || 0,
      });
      setCurrentShift(shift);
      setShowOpenShiftModal(false);
      showToast(`Shift ${shift.shiftNumber} opened with float of ${formatAED(shift.openingFloat)}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    try {
      const closed = await api.closeShift(
        currentShift.id,
        currentShift.openingFloat,
        Number(actualCashCount) || 0,
        shiftClosingNotes
      );
      setCurrentShift(null);
      setShowCloseShiftModal(false);
      showToast(
        `Shift ${closed.shiftNumber} closed! Cash variance: ${formatAED(closed.difference || 0)}`,
        'info'
      );
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const categories = [
    'ALL',
    'Corrugated Boxes',
    'Adhesive Tapes',
    'Protective Packaging',
    'Stretch Films',
    'Poly Bags',
    'Strapping & Edge',
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      const updated = cart.map((i) => {
        if (i.productId === product.id) {
          const qty = i.quantity + 1;
          const sub = qty * i.unitPrice;
          const vat = sub * 0.05;
          return { ...i, quantity: qty, netAmount: sub, vatAmount: vat, total: sub + vat };
        }
        return i;
      });
      setCart(updated);
    } else {
      const qty = 1;
      const sub = qty * product.sellingPrice;
      const vat = sub * 0.05;
      const newItem: CartItem = {
        id: `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: qty,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        discount: 0,
        netAmount: sub,
        vatRate: 0.05,
        vatAmount: vat,
        total: sub + vat,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    const updated = cart
      .map((i) => {
        if (i.productId === productId) {
          const newQty = Math.max(0, i.quantity + delta);
          if (newQty === 0) return null;
          const sub = newQty * i.unitPrice;
          const vat = sub * 0.05;
          return { ...i, quantity: newQty, vatAmount: vat, total: sub + vat };
        }
        return i;
      })
      .filter(Boolean) as CartItem[];
    setCart(updated);
  };

  const cartSubtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cartVat = cartSubtotal * 0.05;
  const cartTotal = cartSubtotal + cartVat;

  const changeDue = Math.max(0, cashTendered - cartTotal);

  const handleCompleteTransaction = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    if (paymentMethod === 'Cash' && cashTendered < cartTotal - 0.01) {
      showToast(`Tendered cash (${formatAED(cashTendered)}) is less than total (${formatAED(cartTotal)})`, 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const tx = await api.createPOSTransaction({
        date: new Date().toISOString().split('T')[0],
        shiftId: currentShift?.id || '',
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        warehouseId: 'wh-1',
        customerName: customerName.trim() || 'Walk-in Retail Customer',
        customerPhone,
        items: cart,
        subtotal: cartSubtotal,
        discount: 0,
        vatAmount: cartVat,
        total: cartTotal,
        paymentMethod,
        cashTendered: paymentMethod === 'Cash' ? cashTendered : cartTotal,
        changeAmount: paymentMethod === 'Cash' ? changeDue : 0,
        status: 'Completed',
      });

      showToast(`Sale completed! Receipt: ${tx.receiptNumber}`, 'success');
      setCart([]);
      setShowCheckoutModal(false);
      setCashTendered(0);
      loadData();
      onPrintReceipt(tx);
    } catch (err: any) {
      showToast(err.message || 'Transaction failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top POS Status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900">
              POS Retail & Counter Checkout
            </h1>
            <p className="text-xs text-slate-500">
              DIP Showroom Terminal • Cashier: <strong className="text-slate-800">{currentUser.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {currentShift ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Shift {currentShift.shiftNumber} (Open)</span>
              </span>
              <button
                onClick={() => {
                  setActualCashCount(currentShift.expectedCash);
                  setShowCloseShiftModal(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold border border-slate-200 transition"
              >
                Close Shift
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold shadow-xs transition"
            >
              Open Shift Till
            </button>
          )}
        </div>
      </div>

      {/* Main Dual Pane Layout: Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: Product Catalog & Search */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Scan barcode or search packaging item, carton box size, tape, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition text-[11px] ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No packaging items available in catalog</p>
                <p className="text-xs text-slate-400 mt-1">Add products in the Inventory module to begin cashier checkout.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
              const inStock = p.stockQuantity > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => inStock && addToCart(p)}
                  className={`p-3.5 bg-white rounded-xl border transition shadow-xs flex flex-col justify-between text-left ${
                    inStock
                      ? 'border-slate-200 hover:border-emerald-600 hover:shadow-md cursor-pointer'
                      : 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{p.sku}</span>
                      <span
                        className={`font-semibold ${
                          inStock ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {inStock ? `${p.stockQuantity} ${p.unit}` : 'Out of Stock'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs mt-1 line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Price</span>
                      <span className="font-mono font-black text-slate-900 text-xs">
                        {p.sellingPrice.toFixed(2)} AED
                      </span>
                    </div>
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      +
                    </span>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* RIGHT: Active Shopping Cart & Tender summary */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between min-h-[580px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                <h2 className="font-bold text-slate-900 text-sm">Counter Cart ({cart.length})</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Customer name input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Walk-in Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>

            {/* Cart line items */}
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">Cart is empty. Tap products to add items.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 text-xs">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-900 leading-tight line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.unitPrice.toFixed(2)} AED / {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => updateCartQty(item.productId, -1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-900 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.productId, 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-16 text-right font-mono font-bold text-slate-900">
                        {item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Totals & Pay trigger */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-mono font-medium text-slate-800">{formatAED(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>5% UAE VAT (ضريبة):</span>
                <span className="font-mono font-medium text-emerald-800">{formatAED(cartVat)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Due:</span>
                <span className="font-mono text-emerald-950 text-base">{formatAED(cartTotal)}</span>
              </div>
            </div>

            <button
              id="btn-pos-checkout"
              disabled={cart.length === 0}
              onClick={() => {
                setCashTendered(Math.ceil(cartTotal));
                setShowCheckoutModal(true);
              }}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Charge {formatAED(cartTotal)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CHECKOUT TENDER MODAL */}
      {/* ========================================================================= */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-sm">POS Payment Tender</h3>
                <p className="text-[11px] text-slate-400">Total: {formatAED(cartTotal)} (Incl. 5% VAT)</p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Payment Methods */}
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 uppercase text-[10px]">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'Card', 'Bank Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                        paymentMethod === m
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* If Cash, show quick tender amounts and change */}
              {paymentMethod === 'Cash' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                  <div>
                    <label className="block text-emerald-950 font-bold mb-1">Cash Tendered (AED)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-lg font-mono font-black text-slate-900"
                    />
                  </div>

                  {/* Fast currency buttons */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[cartTotal, 50, 100, 200, 500, 1000].map((amt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashTendered(Math.ceil(amt))}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-md font-mono text-[11px] font-semibold text-emerald-900"
                      >
                        {idx === 0 ? 'Exact' : `${amt} AED`}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200/80 font-bold">
                    <span className="text-slate-700">Change Due:</span>
                    <span className="font-mono text-base text-emerald-900 font-black">
                      {formatAED(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-center">
                  <CreditCard className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  <p className="font-bold">Swipe / Tap Card on POS Terminal</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Settlement will auto-post to Card Clearing Account (1030).
                  </p>
                </div>
              )}

              {paymentMethod === 'Bank Transfer' && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
                  <p className="font-bold">Emirates NBD Instant Wire</p>
                  <p className="text-[11px] mt-0.5">
                    Ensure customer verifies transfer to IBAN: AE240260001029384756001
                  </p>
                </div>
              )}

              <button
                disabled={isProcessing}
                onClick={handleCompleteTransaction}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                {isProcessing ? 'Processing Transaction...' : 'Complete Sale & Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPEN SHIFT MODAL */}
      {/* ========================================================================= */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Open POS Cashier Shift</h3>
              <p className="text-[11px] text-slate-400">Initialize till drawer for {currentUser.name}</p>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Opening Cash Float (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-base"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Typical opening change float: 500.00 AED
                </span>
              </div>
              <button
                onClick={handleOpenShift}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Confirm & Open Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLOSE SHIFT MODAL */}
      {/* ========================================================================= */}
      {showCloseShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">End of Day Cashier Shift Reconciliation</h3>
              <p className="text-[11px] text-slate-400">Shift #{currentShift.shiftNumber}</p>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span className="font-mono font-bold">{formatAED(currentShift.openingFloat)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales Today:</span>
                  <span className="font-mono font-bold">
                    {formatAED(currentShift.expectedCash - currentShift.openingFloat)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                  <span>Expected Till Cash:</span>
                  <span className="font-mono">{formatAED(currentShift.expectedCash)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Actual Counted Cash in Till (AED) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCashCount}
                  onChange={(e) => setActualCashCount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-base"
                />
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg border bg-slate-50">
                <span className="font-semibold text-slate-700">Cash Discrepancy:</span>
                <span
                  className={`font-mono font-bold ${
                    actualCashCount - currentShift.expectedCash === 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {formatAED(actualCashCount - currentShift.expectedCash)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Shift Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes on discrepancy or shift handover..."
                  value={shiftClosingNotes}
                  onChange={(e) => setShiftClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="w-1/3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseShift}
                  className="w-2/3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition"
                >
                  Reconcile & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
