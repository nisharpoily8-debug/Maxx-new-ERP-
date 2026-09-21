import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext.tsx';
import { api } from '../services/api.ts';
import { Product, StockMovement, Warehouse } from '../types/erp.ts';
import {
  Package,
  Plus,
  ArrowRightLeft,
  SlidersHorizontal,
  Search,
  AlertTriangle,
  Boxes,
  Layers,
  History,
  CheckCircle,
  Building2,
  X,
  Tag,
  Trash2,
  FolderPlus
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { formatAED, formatUAE, warehouses, showToast, currentUser, can } = useErp();

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'Corrugated Boxes',
    'Adhesive Tapes',
    'Protective Packaging',
    'Stretch Films',
    'Poly Bags',
    'Strapping & Edge',
  ]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'movements' | 'warehouses'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Category Manager State
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  // Transfer Form State
  const [transferProductId, setTransferProductId] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState('wh-1');
  const [toWarehouse, setToWarehouse] = useState('wh-2');
  const [transferQty, setTransferQty] = useState(50);
  const [transferNotes, setTransferNotes] = useState('');

  // Adjust Form State
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustWarehouse, setAdjustWarehouse] = useState('wh-1');
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT' | 'DAMAGE'>('ADJUSTMENT');
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustNotes, setAdjustNotes] = useState('');

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'Corrugated Boxes',
    unit: 'pcs',
    costPrice: 5.0,
    sellingPrice: 8.5,
    minStockThreshold: 50,
    specifications: {
      dimensions: '40x30x25 cm',
      ply: 'Double Wall (5 Ply)',
      gsm: '150 GSM',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, movs, cats] = await Promise.all([
        api.getProducts(),
        api.getStockMovements(),
        api.getCategories().catch((): string[] => []),
      ]);
      setProducts(prods);
      setMovements(movs);
      if (cats && cats.length > 0) {
        setCategories(cats);
        setNewProduct((prev) => ({
          ...prev,
          category: cats.includes(prev.category) ? prev.category : cats[0],
        }));
      }
      if (prods.length > 0) {
        if (!transferProductId) setTransferProductId(prods[0].id);
        if (!adjustProductId) setAdjustProductId(prods[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async (nameToPass?: string) => {
    const trimmed = (nameToPass || newCategoryName).trim();
    if (!trimmed) {
      showToast('Please enter a valid category name', 'error');
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Category "${trimmed}" already exists`, 'info');
      setNewProduct((prev) => ({ ...prev, category: trimmed }));
      setNewCategoryName('');
      return;
    }

    setIsAddingCategory(true);
    try {
      const updated = await api.addCategory(trimmed);
      setCategories(updated);
      setNewProduct((prev) => ({ ...prev, category: trimmed }));
      setNewCategoryName('');
      showToast(`Category "${trimmed}" added successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add category', 'error');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleRemoveCategory = async (catName: string) => {
    const productsInCat = products.filter((p) => p.category === catName).length;
    if (productsInCat > 0) {
      const proceed = window.confirm(
        `Category "${catName}" currently contains ${productsInCat} product(s). Are you sure you want to remove it from the master list?`
      );
      if (!proceed) return;
    }

    setDeletingCategory(catName);
    try {
      const updated = await api.removeCategory(catName);
      setCategories(updated);
      if (newProduct.category === catName) {
        setNewProduct((prev) => ({
          ...prev,
          category: updated[0] || 'Packaging',
        }));
      }
      if (selectedCategory === catName) {
        setSelectedCategory('ALL');
      }
      showToast(`Category "${catName}" removed successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove category', 'error');
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleStockTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWarehouse === toWarehouse) {
      showToast('Source and destination warehouses cannot be the same', 'error');
      return;
    }

    const prod = products.find((p) => p.id === transferProductId);
    if (!prod) return;

    const availableInSource = prod.warehouseStocks[fromWarehouse] || 0;
    if (availableInSource < transferQty) {
      showToast(
        `Insufficient stock in source warehouse (${availableInSource} available, trying to transfer ${transferQty})`,
        'error'
      );
      return;
    }

    try {
      await api.recordStockMovement({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'TRANSFER',
        quantity: transferQty,
        fromWarehouseId: fromWarehouse,
        fromWarehouseName: warehouses.find((w) => w.id === fromWarehouse)?.name || 'Central',
        toWarehouseId: toWarehouse,
        toWarehouseName: warehouses.find((w) => w.id === toWarehouse)?.name || 'Branch',
        unitCost: prod.costPrice,
        totalCost: prod.costPrice * transferQty,
        referenceType: 'TRANSFER',
        referenceId: `TRF-${Math.floor(Math.random() * 8999) + 1000}`,
        performedBy: currentUser.name,
        notes: transferNotes || `Inter-facility stock transfer`,
      });

      showToast(`Transferred ${transferQty} ${prod.unit} of ${prod.name}!`, 'success');
      setShowTransferModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === adjustProductId);
    if (!prod) return;

    try {
      await api.recordStockMovement({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: adjustType,
        quantity: adjustQty,
        fromWarehouseId: adjustType === 'DAMAGE' ? adjustWarehouse : undefined,
        toWarehouseId: adjustType === 'ADJUSTMENT' ? adjustWarehouse : undefined,
        fromWarehouseName: warehouses.find((w) => w.id === adjustWarehouse)?.name,
        toWarehouseName: warehouses.find((w) => w.id === adjustWarehouse)?.name,
        unitCost: prod.costPrice,
        totalCost: prod.costPrice * adjustQty,
        referenceType: 'MANUAL',
        referenceId: `ADJ-${Math.floor(Math.random() * 8999) + 1000}`,
        performedBy: currentUser.name,
        notes: adjustNotes || 'Physical count inventory adjustment',
      });

      showToast(`Stock adjustment recorded for ${prod.name}!`, 'success');
      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createProduct({
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category,
        barcode: `629${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        unit: 'Pcs',
        costPrice: Number(newProduct.costPrice) || 0,
        sellingPrice: Number(newProduct.sellingPrice) || 0,
        vatRate: 0.05,
        stockQuantity: 0,
        reorderLevel: Number(newProduct.minStockThreshold) || 50,
        warehouseStocks: { 'wh-1': 0, 'wh-2': 0, 'wh-3': 0 },
        specs: `${newProduct.specifications.dimensions}, ${newProduct.specifications.ply}, ${newProduct.specifications.gsm}`,
      });

      showToast(`New product ${created.sku} (${created.name}) created!`, 'success');
      setShowNewProductModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Inventory & Multi-Warehouse Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Packaging catalog specifications, stock levels across DIP, Al Quoz, and Sharjah, and automated replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {can('inventory') && (
            <>
              <button
                id="btn-stock-transfer"
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Inter-Warehouse Transfer</span>
              </button>

              <button
                id="btn-stock-adjust"
                onClick={() => setShowAdjustModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>Adjust Stock</span>
              </button>

              <button
                onClick={() => setShowNewProductModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Product Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Stock Movement Audit Log ({movements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'warehouses'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>UAE Facilities & Hubs ({warehouses.length})</span>
        </button>
      </div>

      {/* 1. CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search products by SKU, name, dimensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs py-1">
              <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Category:</span>
              {['ALL', ...categories].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                    selectedCategory === c
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCategoryManager(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 transition shrink-0 cursor-pointer ml-1"
                title="Manage Product Categories"
              >
                <Tag className="w-3 h-3 text-emerald-700" />
                <span>+ Manage Categories</span>
              </button>
            </div>
          </div>

          {/* Product Catalog Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">SKU & Item</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Specifications</th>
                    <th className="py-3 px-3 text-right">Cost (AED)</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-3 text-center">DIP Central</th>
                    <th className="py-3 px-3 text-center">Al Quoz</th>
                    <th className="py-3 px-3 text-center">Sharjah</th>
                    <th className="py-3 px-4 text-right">Total UAE Stock</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-sm">No products found</p>
                        <p className="text-xs text-slate-400 mt-1">Click "+ New Product" above to add packaging items or raw materials to your catalog.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                    const isLow = p.stockQuantity <= p.reorderLevel;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</p>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">{p.category}</td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          {p.specs ? (
                            <span className="block font-mono">{p.specs}</span>
                          ) : (
                            <span className="text-slate-400">Standard packaging</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {p.costPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {p.sellingPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {p.warehouseStocks['wh-1'] || 0}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {p.warehouseStocks['wh-2'] || 0}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {p.warehouseStocks['wh-3'] || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-black text-slate-900 text-xs">
                            {p.stockQuantity} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isLow
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isLow ? 'Low Stock' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MOVEMENTS AUDIT TAB */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">SKU & Item</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-4">From Location</th>
                  <th className="py-3 px-4">To Location</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">No stock movements recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1">Receipts, sales dispatches, and warehouse transfers will be logged here in real-time.</p>
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(m.date).toLocaleString('en-AE')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          m.type === 'IN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.type === 'OUT'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : m.type === 'TRANSFER'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {m.productName} ({m.sku})
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {m.quantity}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.fromWarehouseName || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{m.toWarehouseName || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{m.referenceId}</td>
                    <td className="py-3 px-3 text-slate-600">{m.performedBy}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{m.notes}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. WAREHOUSES TAB */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {warehouses.map((w) => (
            <div key={w.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">{w.code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {w.isDefault ? 'Central Fulfillment' : 'Distribution Branch'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{w.name}</h3>
              <p className="text-xs text-slate-500">{w.location}</p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Manager: <strong>{w.manager}</strong></span>
                <span>Active 24/7</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTER-WAREHOUSE TRANSFER MODAL */}
      {/* ========================================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Inter-Warehouse Stock Transfer</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockTransfer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Product</label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Total: {p.stockQuantity} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">From Warehouse</label>
                  <select
                    value={fromWarehouse}
                    onChange={(e) => setFromWarehouse(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">To Warehouse</label>
                  <select
                    value={toWarehouse}
                    onChange={(e) => setToWarehouse(e.target.value)}
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

              <div>
                <label className="block text-slate-700 font-bold mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Transfer Manifest / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Replenishment dispatch by Maxpack Truck #4"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADJUST STOCK MODAL */}
      {/* ========================================================================= */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Physical Stock Adjustment</h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Product</label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="ADJUSTMENT">Stock Increase (Count Fix)</option>
                    <option value="DAMAGE">Damage / Write-off (Decrease)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Warehouse</label>
                  <select
                    value={adjustWarehouse}
                    onChange={(e) => setAdjustWarehouse(e.target.value)}
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

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason / Audit Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Damaged in transit or physical stock recount"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW PRODUCT MODAL */}
      {/* ========================================================================= */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Add New Packaging Product Item</h3>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BX-604040-DW"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryManager(!showCategoryManager)}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Tag className="w-3 h-3 text-emerald-700" />
                      <span>{showCategoryManager ? 'Close Manager' : '+ Add / Remove Category'}</span>
                    </button>
                  </div>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* INLINE CATEGORY ADD / REMOVE PANEL */}
              {showCategoryManager && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5 text-emerald-700" />
                      Manage Product Categories (Add / Remove)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCategoryManager(false)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add category input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter new category name (e.g. Wooden Pallets, Air Bubble Roll)..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCategory()}
                      disabled={isAddingCategory || !newCategoryName.trim()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingCategory ? 'Adding...' : 'Add Category'}</span>
                    </button>
                  </div>

                  {/* Existing categories list with removal */}
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                      Existing Categories ({categories.length}) — Click '×' to remove:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {categories.map((cat) => {
                        const count = products.filter((p) => p.category === cat).length;
                        const isSelected = newProduct.category === cat;
                        return (
                          <div
                            key={cat}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setNewProduct({ ...newProduct, category: cat })}
                              className="text-left cursor-pointer hover:underline"
                              title="Select this category"
                            >
                              {cat}
                              <span className="ml-1 text-[10px] text-slate-400 font-normal">
                                ({count})
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              disabled={deletingCategory === cat}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
                              title={`Remove category "${cat}"`}
                            >
                              {deletingCategory === cat ? (
                                <span className="text-[10px]">...</span>
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Shipping Carton 60x40x40 cm (Double Wall)"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unit</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="rolls">Rolls</option>
                    <option value="cartons">Cartons</option>
                    <option value="kg">Kilograms (kg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cost (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.costPrice}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Selling Price (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.sellingPrice}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dimensions (LxWxH)</label>
                  <input
                    type="text"
                    placeholder="e.g. 50x40x30 cm"
                    value={newProduct.specifications.dimensions}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        specifications: { ...newProduct.specifications, dimensions: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Min Buffer Threshold</label>
                  <input
                    type="number"
                    value={newProduct.minStockThreshold}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, minStockThreshold: parseInt(e.target.value) || 20 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Product Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STANDALONE CATEGORY MANAGEMENT MODAL */}
      {showCategoryManager && !showNewProductModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCategoryManager(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Product Categories Master</h3>
                  <p className="text-xs text-slate-500">
                    Add new categories or remove unused categories across the catalog
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Category form */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-700">Add New Category</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Wooden Pallets, Air Bubble Roll, Edge Protectors..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddCategory()}
                  disabled={isAddingCategory || !newCategoryName.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingCategory ? 'Adding...' : 'Add Category'}</span>
                </button>
              </div>
            </div>

            {/* Current Categories List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Categories ({categories.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  Total Catalog Products: {products.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat).length;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900">{cat}</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-mono">
                          {count} item{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        disabled={deletingCategory === cat}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        title={`Remove "${cat}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deletingCategory === cat ? 'Deleting...' : 'Remove'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryManager(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
