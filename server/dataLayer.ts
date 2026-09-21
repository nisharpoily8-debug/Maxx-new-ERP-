import {
  User,
  Customer,
  Supplier,
  Warehouse,
  Product,
  StockMovement,
  SalesQuotation,
  SalesOrder,
  SalesInvoice,
  InvoiceItem,
  Payment,
  POSTransaction,
  CashierShift,
  PurchaseOrder,
  SupplierBill,
  Expense,
  ChartOfAccount,
  JournalEntry,
  JournalLine,
  AuditLog,
  BusinessSettings,
  DashboardStats,
  AutoSyncStatus,
} from '../src/types/erp.ts';

import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_WAREHOUSES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_CHART_OF_ACCOUNTS,
  INITIAL_INVOICES,
  INITIAL_QUOTATIONS,
  INITIAL_ORDERS,
  INITIAL_POS_TRANSACTIONS,
  INITIAL_SHIFTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIER_BILLS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_AUDIT_LOGS,
} from './seedData.ts';

import { googleSheetsService } from './googleSheetsService.ts';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

function getDatabaseFilePath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'data', 'erp-database.json'),
    path.resolve(process.cwd(), '..', 'data', 'erp-database.json'),
    path.resolve(currentDir, '..', 'data', 'erp-database.json'),
    path.resolve(currentDir, 'data', 'erp-database.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  const targetDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch {}
  }
  return path.join(targetDir, 'erp-database.json');
}

export interface IDataStore {
  // Settings & Status
  getSettings(): Promise<BusinessSettings>;
  updateSettings(settings: Partial<BusinessSettings>, user: string): Promise<BusinessSettings>;
  getDashboardStats(warehouseId?: string, dateFrom?: string, dateTo?: string): Promise<DashboardStats>;

  // Users & Auth
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: Partial<User> & { email: string; name: string }, adminUser: string): Promise<User>;
  deleteUser(id: string, adminUser: string): Promise<{ success: boolean; message: string; deletedUser: User }>;
  
  // Customers & Suppliers
  getCustomers(): Promise<Customer[]>;
  createCustomer(cust: Omit<Customer, 'id' | 'createdAt'>, user: string): Promise<Customer>;
  updateCustomer(id: string, cust: Partial<Customer>, user: string): Promise<Customer>;
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(sup: Omit<Supplier, 'id' | 'createdAt'>, user: string): Promise<Supplier>;
  updateSupplier(id: string, sup: Partial<Supplier>, user: string): Promise<Supplier>;

  // Inventory & Warehouses
  getWarehouses(): Promise<Warehouse[]>;
  getProducts(): Promise<Product[]>;
  getCategories(): Promise<string[]>;
  addCategory(category: string, user: string): Promise<string[]>;
  removeCategory(category: string, user: string): Promise<string[]>;
  createProduct(prod: Omit<Product, 'id' | 'createdAt'>, user: string): Promise<Product>;
  updateProduct(id: string, prod: Partial<Product>, user: string): Promise<Product>;
  getStockMovements(): Promise<StockMovement[]>;
  recordStockMovement(movement: Omit<StockMovement, 'id' | 'date'>, user: string): Promise<StockMovement>;

  // Sales Pipeline
  getQuotations(): Promise<SalesQuotation[]>;
  createQuotation(quote: Omit<SalesQuotation, 'id' | 'createdAt'>, user: string): Promise<SalesQuotation>;
  convertQuotationToOrder(quoteId: string, user: string): Promise<SalesOrder>;
  convertQuotationToInvoice(quoteId: string, user: string): Promise<SalesInvoice>;
  getOrders(): Promise<SalesOrder[]>;
  createOrder(order: Omit<SalesOrder, 'id' | 'createdAt'>, user: string): Promise<SalesOrder>;
  convertOrderToInvoice(orderId: string, user: string): Promise<SalesInvoice>;

  // Invoicing & Receipts
  getInvoices(): Promise<SalesInvoice[]>;
  createInvoice(inv: Omit<SalesInvoice, 'id' | 'createdAt'>, user: string): Promise<SalesInvoice>;
  updateInvoiceStatus(id: string, status: SalesInvoice['status'], user: string): Promise<SalesInvoice>;
  recordInvoicePayment(invoiceId: string, payment: Omit<Payment, 'id' | 'createdAt'>, user: string): Promise<{ payment: Payment; invoice: SalesInvoice }>;

  // POS
  getPOSTransactions(): Promise<POSTransaction[]>;
  createPOSTransaction(tx: Omit<POSTransaction, 'id' | 'createdAt'>, user: string): Promise<POSTransaction>;
  getCurrentShift(cashierId: string): Promise<CashierShift | undefined>;
  openShift(shift: Omit<CashierShift, 'id' | 'transactionCount' | 'totalSales' | 'totalCard' | 'totalBank' | 'status'>, user: string): Promise<CashierShift>;
  closeShift(shiftId: string, closingFloat: number, actualCash: number, notes: string, user: string): Promise<CashierShift>;

  // Purchases
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'createdAt'>, user: string): Promise<PurchaseOrder>;
  receivePurchaseOrder(poId: string, user: string): Promise<PurchaseOrder>;
  getSupplierBills(): Promise<SupplierBill[]>;
  createSupplierBill(bill: Omit<SupplierBill, 'id' | 'createdAt'>, user: string): Promise<SupplierBill>;
  paySupplierBill(billId: string, payment: Omit<Payment, 'id' | 'createdAt'>, user: string): Promise<SupplierBill>;

  // Accounting & Ledger
  getChartOfAccounts(): Promise<ChartOfAccount[]>;
  getJournalEntries(): Promise<JournalEntry[]>;
  postManualJournalEntry(entry: Omit<JournalEntry, 'id' | 'postedAt'>, user: string): Promise<JournalEntry>;
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: Omit<Expense, 'id' | 'createdAt'>, user: string): Promise<Expense>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;

  // Google Sheets Sync
  syncAllToGoogleSheets(): Promise<{
    success: boolean;
    syncedTables: Record<string, number>;
    totalRows: number;
    message: string;
  }>;
  clearDemoData(user: string): Promise<{ success: boolean; message: string }>;
  eraseAllDataWithPassword(
    passwordInput: string,
    resetMode?: 'transactions_only' | 'factory_reset',
    adminUser?: string
  ): Promise<{ success: boolean; message: string; erasedCounts: Record<string, number> }>;
}

export class DataStore implements IDataStore {
  private settings: BusinessSettings = { ...INITIAL_SETTINGS };
  private users: User[] = [...INITIAL_USERS];
  private warehouses: Warehouse[] = [...INITIAL_WAREHOUSES];
  private customers: Customer[] = [...INITIAL_CUSTOMERS];
  private suppliers: Supplier[] = [...INITIAL_SUPPLIERS];
  private products: Product[] = [...INITIAL_PRODUCTS];
  private quotations: SalesQuotation[] = [...INITIAL_QUOTATIONS];
  private orders: SalesOrder[] = [...INITIAL_ORDERS];
  private invoices: SalesInvoice[] = [...INITIAL_INVOICES];
  private payments: Payment[] = [];
  private posTransactions: POSTransaction[] = [...INITIAL_POS_TRANSACTIONS];
  private shifts: CashierShift[] = [...INITIAL_SHIFTS];
  private purchaseOrders: PurchaseOrder[] = [...INITIAL_PURCHASE_ORDERS];
  private supplierBills: SupplierBill[] = [...INITIAL_SUPPLIER_BILLS];
  private stockMovements: StockMovement[] = [...INITIAL_STOCK_MOVEMENTS];
  private chartOfAccounts: ChartOfAccount[] = [...INITIAL_CHART_OF_ACCOUNTS];
  private journalEntries: JournalEntry[] = [...INITIAL_JOURNAL_ENTRIES];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private expenses: Expense[] = [];
  private categories: string[] = [
    'Corrugated Boxes',
    'Adhesive Tapes',
    'Protective Packaging',
    'Stretch Films',
    'Poly Bags',
    'Strapping & Edge',
    'Paper Rolls & Kraft',
    'Thermal Labels',
    'Custom Packaging',
  ];

  // Disk persistence state
  private dbFilePath: string = getDatabaseFilePath();
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  // Automatic synchronization engine state
  private autoSyncTimeout: NodeJS.Timeout | null = null;
  private isAutoSyncing: boolean = false;
  private lastAutoSyncTrigger: string = 'System initialization';
  private lastAutoSyncTime: string | null = null;
  private autoSyncIntervalSeconds: number = 60;
  private bidirectionalSyncEnabled: boolean = true;
  private autoSyncHistory: Array<{ timestamp: string; trigger: string; rows: number; status: 'Success' | 'Warning' }> = [];

  constructor() {
    const loaded = this.loadFromDisk();
    if (!loaded) {
      console.log(`[DataStore] Initializing fresh persistent database at ${this.dbFilePath}...`);
      this.persistToDisk(true);
    }
  }

  // --- Disk Persistence Engine ---
  private loadFromDisk(): boolean {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        if (!raw || raw.trim().length === 0) return false;
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          if (data.settings && typeof data.settings === 'object') {
            this.settings = { ...this.settings, ...data.settings };
          }
          if (Array.isArray(data.users) && data.users.length > 0) this.users = data.users;
          if (Array.isArray(data.warehouses) && data.warehouses.length > 0) this.warehouses = data.warehouses;
          if (Array.isArray(data.customers)) this.customers = data.customers;
          if (Array.isArray(data.suppliers)) this.suppliers = data.suppliers;
          if (Array.isArray(data.products)) this.products = data.products;
          if (Array.isArray(data.quotations)) this.quotations = data.quotations;
          if (Array.isArray(data.orders)) this.orders = data.orders;
          if (Array.isArray(data.invoices)) this.invoices = data.invoices;
          if (Array.isArray(data.payments)) this.payments = data.payments;
          if (Array.isArray(data.posTransactions)) this.posTransactions = data.posTransactions;
          if (Array.isArray(data.shifts)) this.shifts = data.shifts;
          if (Array.isArray(data.purchaseOrders)) this.purchaseOrders = data.purchaseOrders;
          if (Array.isArray(data.supplierBills)) this.supplierBills = data.supplierBills;
          if (Array.isArray(data.stockMovements)) this.stockMovements = data.stockMovements;
          if (Array.isArray(data.chartOfAccounts) && data.chartOfAccounts.length > 0) this.chartOfAccounts = data.chartOfAccounts;
          if (Array.isArray(data.journalEntries)) this.journalEntries = data.journalEntries;
          if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
          if (Array.isArray(data.expenses)) this.expenses = data.expenses;
          if (Array.isArray(data.categories) && data.categories.length > 0) this.categories = data.categories;

          console.log(`[DataStore] Successfully loaded persistent ERP database from ${this.dbFilePath} (Invoices: ${this.invoices.length}, Customers: ${this.customers.length}, Bills: ${this.supplierBills.length})`);
          return true;
        }
      }
    } catch (err: any) {
      console.error('[DataStore Error] Failed to load persistent database from disk:', err.message);
    }
    return false;
  }

  public persistToDisk(immediate: boolean = false): void {
    const doSave = () => {
      try {
        const targetDir = path.dirname(this.dbFilePath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const state = {
          version: 1,
          lastSaved: new Date().toISOString(),
          settings: this.settings,
          users: this.users,
          warehouses: this.warehouses,
          customers: this.customers,
          suppliers: this.suppliers,
          products: this.products,
          quotations: this.quotations,
          orders: this.orders,
          invoices: this.invoices,
          payments: this.payments,
          posTransactions: this.posTransactions,
          shifts: this.shifts,
          purchaseOrders: this.purchaseOrders,
          supplierBills: this.supplierBills,
          stockMovements: this.stockMovements,
          chartOfAccounts: this.chartOfAccounts,
          journalEntries: this.journalEntries,
          auditLogs: this.auditLogs,
          expenses: this.expenses,
          categories: this.categories,
        };
        const tempPath = `${this.dbFilePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
        fs.renameSync(tempPath, this.dbFilePath);
      } catch (err: any) {
        console.error('[DataStore Error] Failed to persist database to disk:', err.message);
      }
    };

    if (immediate) {
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
        this.saveDebounceTimer = null;
      }
      doSave();
    } else {
      if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = setTimeout(() => {
        this.saveDebounceTimer = null;
        doSave();
      }, 250);
    }
  }

  // --- Automatic Synchronization Engine ---
  public getAutoSyncStatus(): AutoSyncStatus {
    const status = googleSheetsService.getStatus();
    return {
      configured: status.configured,
      enabled: this.settings.googleSheets?.autoSync !== false,
      intervalSeconds: this.autoSyncIntervalSeconds,
      bidirectional: this.bidirectionalSyncEnabled,
      isSyncing: this.isAutoSyncing,
      lastSyncTime: this.lastAutoSyncTime || status.lastSyncTime || null,
      lastSyncTrigger: this.lastAutoSyncTrigger,
      totalSyncedRows: status.totalSyncedRows || 0,
      connectedSheetTitle: status.connectedSheetTitle || 'Packwell erp',
      spreadsheetId: status.spreadsheetId || '',
      history: this.autoSyncHistory.slice(0, 15),
    };
  }

  public getAutoSyncHistory() {
    return this.autoSyncHistory.slice(0, 20);
  }

  public setAutoSyncConfig(enabled?: boolean, intervalSeconds?: number, bidirectional?: boolean): AutoSyncStatus {
    if (enabled !== undefined) {
      this.settings.googleSheets.autoSync = enabled;
    }
    if (intervalSeconds !== undefined && intervalSeconds >= 10) {
      this.autoSyncIntervalSeconds = intervalSeconds;
      this.settings.googleSheets.syncIntervalSeconds = intervalSeconds;
    }
    if (bidirectional !== undefined) {
      this.bidirectionalSyncEnabled = bidirectional;
      this.settings.googleSheets.bidirectionalSync = bidirectional;
    }
    return this.getAutoSyncStatus();
  }

  /**
   * Unified debounced auto-sync to Google Sheets.
   * Runs automatically in background on ANY create, update, or delete mutation.
   * Batches rapid operations within 1200ms into a single atomic Google Sheets API update.
   */
  public triggerAutoSync(reason: string = 'Data mutation') {
    this.persistToDisk(false);
    this.lastAutoSyncTrigger = reason;
    const status = googleSheetsService.getStatus();
    if (!status.configured) {
      return;
    }
    if (this.settings.googleSheets?.autoSync === false) {
      return;
    }

    if (this.autoSyncTimeout) {
      clearTimeout(this.autoSyncTimeout);
    }

    this.autoSyncTimeout = setTimeout(async () => {
      this.autoSyncTimeout = null;
      if (this.isAutoSyncing) return;
      this.isAutoSyncing = true;
      try {
        console.log(`[AutoSync] Executing debounced auto-sync to Google Sheets (Trigger: ${reason})...`);
        const res = await this.syncAllToGoogleSheets();
        this.lastAutoSyncTime = new Date().toISOString();
        this.autoSyncHistory.unshift({
          timestamp: this.lastAutoSyncTime,
          trigger: reason,
          rows: res.totalRows,
          status: 'Success',
        });
        if (this.autoSyncHistory.length > 30) this.autoSyncHistory.pop();
        console.log(`[AutoSync] Successfully synced ${res.totalRows} rows to Google Sheets ("${status.connectedSheetTitle || 'Packwell erp'}").`);
      } catch (err: any) {
        console.warn(`[AutoSync] Auto-sync notice (${reason}):`, err.message);
        this.autoSyncHistory.unshift({
          timestamp: new Date().toISOString(),
          trigger: reason,
          rows: 0,
          status: 'Warning',
        });
      } finally {
        this.isAutoSyncing = false;
      }
    }, 1200);
  }

  // --- Audit Logging ---
  public async logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);

    // Also mirror to Google Sheets if configured (queued and batched to respect API quotas)
    googleSheetsService.appendRow('Audit Logs', log).catch(() => {
      // background mirror best effort
    });
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogs;
  }

  // --- Settings ---
  public async getSettings(): Promise<BusinessSettings> {
    const status = googleSheetsService.getStatus();
    this.settings.googleSheets.status = status.configured ? 'Connected' : (status.hasServiceAccount ? 'Not Configured' : 'Error');
    if (status.spreadsheetId) {
      this.settings.googleSheets.spreadsheetId = status.spreadsheetId;
    }
    if (status.serviceAccountEmail) {
      this.settings.googleSheets.serviceAccountEmail = status.serviceAccountEmail;
    }
    if (status.lastSyncTime) {
      this.settings.googleSheets.lastSyncTime = status.lastSyncTime;
    }
    this.settings.googleSheets.syncIntervalSeconds = this.autoSyncIntervalSeconds;
    this.settings.googleSheets.bidirectionalSync = this.bidirectionalSyncEnabled;
    return this.settings;
  }

  public async updateSettings(newSettings: Partial<BusinessSettings>, user: string): Promise<BusinessSettings> {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.googleSheets?.spreadsheetId) {
      googleSheetsService.setSpreadsheetId(newSettings.googleSheets.spreadsheetId);
    }
    if (newSettings.googleSheets?.serviceAccountEmail) {
      googleSheetsService.updateCredentials({
        spreadsheetId: newSettings.googleSheets.spreadsheetId,
        clientEmail: newSettings.googleSheets.serviceAccountEmail,
      });
    }
    if (newSettings.googleSheets?.syncIntervalSeconds) {
      this.autoSyncIntervalSeconds = newSettings.googleSheets.syncIntervalSeconds;
    }
    if (newSettings.googleSheets?.bidirectionalSync !== undefined) {
      this.bidirectionalSyncEnabled = newSettings.googleSheets.bidirectionalSync;
    }
    if (this.settings.googleSheets.autoSync && googleSheetsService.getStatus().configured) {
      this.triggerAutoSync('Settings & Auto-Sync Configuration Updated');
    }
    await this.logAudit({
      userId: 'usr-admin',
      userName: user,
      userRole: 'Super Admin',
      action: 'UPDATE',
      module: 'Settings',
      recordId: 'business-settings',
      details: 'Updated Maxpack ERP business settings, TRN, or Google Sheets credentials.',
    });
    return this.settings;
  }

  // --- Dashboard Stats ---
  public async getDashboardStats(warehouseId?: string, dateFrom?: string, dateTo?: string): Promise<DashboardStats> {
    const todayStr = '2026-09-20'; // Current simulation local date
    const currentMonth = '2026-09';

    // Filter invoices
    let relevantInvoices = this.invoices;
    if (warehouseId && warehouseId !== 'all') {
      relevantInvoices = relevantInvoices.filter(i => i.warehouseId === warehouseId);
    }

    const salesToday = this.posTransactions
      .filter(p => p.date.startsWith(todayStr))
      .reduce((sum, p) => sum + p.total, 0) +
      relevantInvoices
        .filter(i => i.date === todayStr && i.status !== 'Cancelled')
        .reduce((sum, i) => sum + i.total, 0);

    const monthlySales = relevantInvoices
      .filter(i => i.date.startsWith(currentMonth) && i.status !== 'Cancelled')
      .reduce((sum, i) => sum + i.total, 0) +
      this.posTransactions
        .filter(p => p.date.startsWith(currentMonth) && p.status === 'Completed')
        .reduce((sum, p) => sum + p.total, 0);

    const unpaidInvoices = relevantInvoices.filter(i => i.status === 'Sent' || i.status === 'Partially Paid' || i.status === 'Overdue');
    const unpaidInvoicesCount = unpaidInvoices.length;
    const unpaidInvoicesAmount = unpaidInvoices.reduce((sum, i) => sum + i.balanceDue, 0);
    const receivables = unpaidInvoicesAmount;

    const purchaseCostsMonth = this.supplierBills
      .filter(b => b.date.startsWith(currentMonth) && b.status !== 'Draft')
      .reduce((sum, b) => sum + b.total, 0);

    // Inventory value calculation
    const inventoryValue = this.products.reduce((sum, p) => {
      let qty = p.stockQuantity;
      if (warehouseId && warehouseId !== 'all' && p.warehouseStocks[warehouseId] !== undefined) {
        qty = p.warehouseStocks[warehouseId];
      }
      return sum + (qty * p.costPrice);
    }, 0);

    const lowStockCount = this.products.filter(p => p.stockQuantity <= p.reorderLevel).length;

    // Top selling products
    const topSellingProducts = this.products.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      soldQty: Math.floor(Math.random() * 80) + 120,
      revenue: Math.floor(Math.random() * 8000) + 9500,
    })).sort((a, b) => b.revenue - a.revenue);

    const cashSalesMonth = this.posTransactions
      .filter(p => p.date.startsWith(currentMonth) && p.paymentMethod === 'Cash')
      .reduce((sum, p) => sum + p.total, 0);

    const grossProfitMonth = Math.max(0, monthlySales - (purchaseCostsMonth * 0.82));
    const netProfitMonth = Math.max(0, grossProfitMonth - 32000); // minus operating expenses

    // Sales Performance Chart (Last 6 Months in AED)
    const salesPerformanceChart = [
      { month: 'Apr 2026', sales: 112000, purchases: 84000 },
      { month: 'May 2026', sales: 135000, purchases: 98000 },
      { month: 'Jun 2026', sales: 148000, purchases: 104000 },
      { month: 'Jul 2026', sales: 129000, purchases: 91000 },
      { month: 'Aug 2026', sales: 162000, purchases: 115000 },
      { month: 'Sep 2026', sales: Math.round(monthlySales) || 178000, purchases: Math.round(purchaseCostsMonth) || 120000 },
    ];

    // Sales by customer
    const salesByCustomerChart = this.customers.slice(0, 5).map((c, i) => ({
      customer: c.companyName.split(' ')[0] + ' ' + (c.companyName.split(' ')[1] || ''),
      amount: [48500, 32400, 28100, 19800, 14200][i] || 10000,
    }));

    // Category performance
    const categoryPerformanceChart = [
      { category: 'Stretch Wrap', amount: 62000 },
      { category: 'Cartons', amount: 54000 },
      { category: 'Packaging Tape', amount: 28000 },
      { category: 'Bubble Wrap', amount: 18500 },
      { category: 'Strapping', amount: 15500 },
    ];

    // Stock Movement Chart
    const stockMovementChart = [
      { date: '14 Sep', inQty: 180, outQty: 120 },
      { date: '15 Sep', inQty: 400, outQty: 310 },
      { date: '16 Sep', inQty: 250, outQty: 280 },
      { date: '17 Sep', inQty: 120, outQty: 190 },
      { date: '18 Sep', inQty: 320, outQty: 240 },
      { date: '19 Sep', inQty: 150, outQty: 210 },
      { date: '20 Sep', inQty: 80, outQty: 145 },
    ];

    // Payment methods
    const paymentMethodsChart = [
      { method: 'Bank Transfer', amount: 98000 },
      { method: 'Cheque / PDC', amount: 52000 },
      { method: 'Card / POS', amount: 28000 },
      { method: 'Cash', amount: 14000 },
    ];

    return {
      salesToday: Math.round(salesToday * 100) / 100,
      monthlySales: Math.round(monthlySales * 100) / 100,
      unpaidInvoicesCount,
      unpaidInvoicesAmount: Math.round(unpaidInvoicesAmount * 100) / 100,
      receivables: Math.round(receivables * 100) / 100,
      purchaseCostsMonth: Math.round(purchaseCostsMonth * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      lowStockCount,
      topSellingProducts,
      cashSalesMonth: Math.round(cashSalesMonth * 100) / 100,
      grossProfitMonth: Math.round(grossProfitMonth * 100) / 100,
      netProfitMonth: Math.round(netProfitMonth * 100) / 100,
      salesPerformanceChart,
      salesByCustomerChart,
      categoryPerformanceChart,
      stockMovementChart,
      paymentMethodsChart,
    };
  }

  // --- Users ---
  public async getUsers(): Promise<User[]> {
    return this.users;
  }

  public async getUserById(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  public async getUserByEmail(email: string): Promise<User | undefined> {
    const clean = (email || '').toLowerCase().trim();
    return this.users.find(u => u.email.toLowerCase().trim() === clean);
  }

  public async createUser(data: Partial<User> & { email: string; name: string }, adminUser: string): Promise<User> {
    const existing = await this.getUserByEmail(data.email);
    if (existing) {
      return existing;
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email.trim(),
      role: data.role || 'Salesperson',
      branch: data.branch || 'Dubai Investment Park (DIP)',
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    await this.logAudit({
      userId: 'usr-admin',
      userName: adminUser,
      userRole: 'Super Admin',
      action: 'CREATE',
      module: 'Users',
      recordId: newUser.id,
      details: `Created user account ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
    });
    return newUser;
  }

  public async deleteUser(id: string, adminUser: string): Promise<{ success: boolean; message: string; deletedUser: User }> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found.`);
    }
    if (this.users.length <= 1) {
      throw new Error('Cannot delete the only remaining user in the system.');
    }
    const [deletedUser] = this.users.splice(index, 1);
    await this.logAudit({
      userId: 'usr-admin',
      userName: adminUser,
      userRole: 'Super Admin',
      action: 'DELETE',
      module: 'Users',
      recordId: deletedUser.id,
      details: `Removed user account ${deletedUser.name} (${deletedUser.email})`,
    });
    this.triggerAutoSync(`Deleted user ${deletedUser.name}`);
    return {
      success: true,
      message: `User ${deletedUser.name} (${deletedUser.email}) removed successfully.`,
      deletedUser,
    };
  }

  // --- Customers ---
  public async getCustomers(): Promise<Customer[]> {
    return this.customers;
  }

  public async createCustomer(data: Omit<Customer, 'id' | 'createdAt'>, user: string): Promise<Customer> {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      ...data,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
    };
    this.customers.unshift(newCust);
    await this.logAudit({
      userId: 'usr-sales',
      userName: user,
      userRole: 'Salesperson',
      action: 'CREATE',
      module: 'Sales',
      recordId: newCust.id,
      details: `Created Customer ${newCust.companyName} (TRN: ${newCust.trn || 'None'}, Terms: ${newCust.paymentTerms})`,
    });
    googleSheetsService.appendRow('Customers', newCust);
    this.triggerAutoSync(`Created customer ${newCust.companyName}`);
    return newCust;
  }

  public async updateCustomer(id: string, updates: Partial<Customer>, user: string): Promise<Customer> {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    this.customers[idx] = { ...this.customers[idx], ...updates };
    await this.logAudit({
      userId: 'usr-admin',
      userName: user,
      userRole: 'Admin / Manager',
      action: 'UPDATE',
      module: 'Sales',
      recordId: id,
      details: `Updated details for Customer ${this.customers[idx].companyName}`,
    });
    this.triggerAutoSync(`Updated customer ${this.customers[idx].companyName}`);
    return this.customers[idx];
  }

  // --- Suppliers ---
  public async getSuppliers(): Promise<Supplier[]> {
    return this.suppliers;
  }

  public async createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>, user: string): Promise<Supplier> {
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      ...data,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    this.suppliers.unshift(newSup);
    await this.logAudit({
      userId: 'usr-admin',
      userName: user,
      userRole: 'Admin / Manager',
      action: 'CREATE',
      module: 'Purchases',
      recordId: newSup.id,
      details: `Created Supplier ${newSup.name} (TRN: ${newSup.trn})`,
    });
    googleSheetsService.appendRow('Suppliers', newSup);
    this.triggerAutoSync(`Created supplier ${newSup.name}`);
    return newSup;
  }

  public async updateSupplier(id: string, updates: Partial<Supplier>, user: string): Promise<Supplier> {
    const idx = this.suppliers.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Supplier not found');
    this.suppliers[idx] = { ...this.suppliers[idx], ...updates };
    this.triggerAutoSync(`Updated supplier ${this.suppliers[idx].name}`);
    return this.suppliers[idx];
  }

  // --- Warehouses & Inventory ---
  public async getWarehouses(): Promise<Warehouse[]> {
    return this.warehouses;
  }

  public async getProducts(): Promise<Product[]> {
    return this.products;
  }

  public async getCategories(): Promise<string[]> {
    const productCategories = this.products.map(p => p.category).filter(Boolean);
    const set = new Set([...this.categories, ...productCategories]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  public async addCategory(category: string, user: string): Promise<string[]> {
    const trimmed = (category || '').trim();
    if (!trimmed) {
      throw new Error('Category name cannot be empty');
    }
    const exists = this.categories.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      this.categories.push(trimmed);
      this.persistToDisk();
      await this.logAudit({
        userId: 'usr-admin',
        userName: user,
        userRole: 'Admin / Manager',
        action: 'CREATE',
        module: 'Inventory',
        recordId: `cat-${Date.now()}`,
        details: `Created new product category: "${trimmed}"`,
      });
      this.triggerAutoSync(`Added category ${trimmed}`);
    }
    return this.getCategories();
  }

  public async removeCategory(category: string, user: string): Promise<string[]> {
    const trimmed = (category || '').trim();
    if (!trimmed) {
      throw new Error('Category name cannot be empty');
    }
    const beforeCount = this.categories.length;
    this.categories = this.categories.filter(c => c.toLowerCase() !== trimmed.toLowerCase());
    
    if (this.categories.length !== beforeCount) {
      this.persistToDisk();
      await this.logAudit({
        userId: 'usr-admin',
        userName: user,
        userRole: 'Admin / Manager',
        action: 'DELETE',
        module: 'Inventory',
        recordId: `cat-del-${Date.now()}`,
        details: `Removed product category: "${trimmed}"`,
      });
      this.triggerAutoSync(`Removed category ${trimmed}`);
    }
    return this.getCategories();
  }

  public async createProduct(data: Omit<Product, 'id' | 'createdAt'>, user: string): Promise<Product> {
    // Check barcode or sku duplicate
    if (this.products.some(p => p.sku.toLowerCase() === data.sku.toLowerCase())) {
      throw new Error(`A product with SKU "${data.sku}" already exists.`);
    }

    // Automatically ensure product category is included in active categories
    if (data.category && data.category.trim()) {
      const catTrimmed = data.category.trim();
      if (!this.categories.some(c => c.toLowerCase() === catTrimmed.toLowerCase())) {
        this.categories.push(catTrimmed);
      }
    }
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      ...data,
      vatRate: 0.05,
      createdAt: new Date().toISOString(),
    };
    this.products.unshift(newProd);
    await this.logAudit({
      userId: 'usr-admin',
      userName: user,
      userRole: 'Admin / Manager',
      action: 'CREATE',
      module: 'Inventory',
      recordId: newProd.id,
      details: `Created Product ${newProd.name} (SKU: ${newProd.sku}, Price: ${newProd.sellingPrice} AED)`,
    });
    googleSheetsService.appendRow('Products', newProd);
    this.triggerAutoSync(`Created product ${newProd.name}`);
    return newProd;
  }

  public async updateProduct(id: string, updates: Partial<Product>, user: string): Promise<Product> {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    const oldPrice = this.products[idx].sellingPrice;
    this.products[idx] = { ...this.products[idx], ...updates };
    
    if (updates.sellingPrice !== undefined && updates.sellingPrice !== oldPrice) {
      await this.logAudit({
        userId: 'usr-admin',
        userName: user,
        userRole: 'Admin / Manager',
        action: 'UPDATE',
        module: 'Inventory',
        recordId: id,
        details: `Price change on ${this.products[idx].name} from ${oldPrice} AED to ${updates.sellingPrice} AED`,
      });
    }
    this.triggerAutoSync(`Updated product ${this.products[idx].name}`);
    return this.products[idx];
  }

  public async getStockMovements(): Promise<StockMovement[]> {
    return this.stockMovements;
  }

  public async recordStockMovement(data: Omit<StockMovement, 'id' | 'date'>, user: string): Promise<StockMovement> {
    const prod = this.products.find(p => p.id === data.productId);
    if (!prod) throw new Error('Product not found for stock movement');

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      date: new Date().toISOString(),
      ...data,
    };

    // Update physical product stocks
    if (data.type === 'IN') {
      const targetWh = data.toWarehouseId || 'wh-1';
      prod.stockQuantity += data.quantity;
      prod.warehouseStocks[targetWh] = (prod.warehouseStocks[targetWh] || 0) + data.quantity;
    } else if (data.type === 'OUT' || data.type === 'DAMAGE') {
      const sourceWh = data.fromWarehouseId || 'wh-1';
      if ((prod.warehouseStocks[sourceWh] || 0) < data.quantity) {
        // Negative stock warning
        console.warn(`[Inventory] Negative stock permitted or triggered for ${prod.name}`);
      }
      prod.stockQuantity = Math.max(0, prod.stockQuantity - data.quantity);
      prod.warehouseStocks[sourceWh] = Math.max(0, (prod.warehouseStocks[sourceWh] || 0) - data.quantity);

      // If damaged, auto-post loss to accounting
      if (data.type === 'DAMAGE') {
        const lossAmount = data.quantity * prod.costPrice;
        await this.postAutomaticJournalEntry({
          referenceType: 'STOCK_ADJ',
          referenceId: movement.id,
          description: `Damaged stock write-off: ${data.quantity}x ${prod.name} (${data.notes || ''})`,
          lines: [
            { id: 'jl-1', accountCode: '5000', accountName: 'Cost of Goods Sold (COGS) / Inventory Shrinkage', debit: lossAmount, credit: 0 },
            { id: 'jl-2', accountCode: '1200', accountName: 'Inventory Asset (Packaging Goods)', debit: 0, credit: lossAmount },
          ],
          user,
        });
      }
    } else if (data.type === 'TRANSFER') {
      const fromWh = data.fromWarehouseId || 'wh-1';
      const toWh = data.toWarehouseId || 'wh-2';
      prod.warehouseStocks[fromWh] = Math.max(0, (prod.warehouseStocks[fromWh] || 0) - data.quantity);
      prod.warehouseStocks[toWh] = (prod.warehouseStocks[toWh] || 0) + data.quantity;
    } else if (data.type === 'ADJUSTMENT') {
      const targetWh = data.toWarehouseId || data.fromWarehouseId || 'wh-1';
      const diff = data.quantity; // positive or negative
      prod.stockQuantity = Math.max(0, prod.stockQuantity + diff);
      prod.warehouseStocks[targetWh] = Math.max(0, (prod.warehouseStocks[targetWh] || 0) + diff);
    }

    this.stockMovements.unshift(movement);
    await this.logAudit({
      userId: 'usr-wh',
      userName: user,
      userRole: 'Warehouse Staff',
      action: 'UPDATE',
      module: 'Inventory',
      recordId: movement.id,
      details: `Stock ${data.type}: ${data.quantity} ${prod.unit} of ${prod.name} (Ref: ${data.referenceId})`,
    });
    googleSheetsService.appendRow('Stock Movements', movement);
    this.triggerAutoSync(`Stock movement: ${data.type} on ${prod.name}`);
    return movement;
  }

  // --- Quotations & Orders ---
  public async getQuotations(): Promise<SalesQuotation[]> {
    return this.quotations;
  }

  public async createQuotation(data: Omit<SalesQuotation, 'id' | 'createdAt'>, user: string): Promise<SalesQuotation> {
    const count = this.quotations.length + 1;
    const quoteNumber = `${this.settings.quotePrefix}${String(count).padStart(4, '0')}`;
    const newQuote: SalesQuotation = {
      id: `qt-${Date.now()}`,
      ...data,
      quoteNumber,
      createdAt: new Date().toISOString(),
    };
    this.quotations.unshift(newQuote);
    await this.logAudit({
      userId: 'usr-sales',
      userName: user,
      userRole: 'Salesperson',
      action: 'CREATE',
      module: 'Sales',
      recordId: newQuote.quoteNumber,
      details: `Generated Quotation ${newQuote.quoteNumber} for ${newQuote.customerName} (${newQuote.total.toFixed(2)} AED)`,
    });
    googleSheetsService.appendRow('Sales Quotations', newQuote);
    this.triggerAutoSync(`Created quotation ${newQuote.quoteNumber}`);
    return newQuote;
  }

  public async convertQuotationToOrder(quoteId: string, user: string): Promise<SalesOrder> {
    const quote = this.quotations.find(q => q.id === quoteId);
    if (!quote) throw new Error('Quotation not found');

    const count = this.orders.length + 1;
    const orderNumber = `${this.settings.orderPrefix}${String(count).padStart(4, '0')}`;

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber,
      quoteId: quote.id,
      date: new Date().toISOString().split('T')[0],
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerTrn: quote.customerTrn,
      customerAddress: quote.customerAddress,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      vatAmount: quote.vatAmount,
      deliveryCharge: quote.deliveryCharge,
      total: quote.total,
      status: 'Pending',
      salespersonId: quote.salespersonId,
      salespersonName: quote.salespersonName,
      warehouseId: quote.warehouseId,
      notes: `Converted from ${quote.quoteNumber}`,
      createdAt: new Date().toISOString(),
    };

    quote.status = 'Converted';
    quote.convertedToOrderId = newOrder.id;

    this.orders.unshift(newOrder);
    await this.logAudit({
      userId: 'usr-sales',
      userName: user,
      userRole: 'Salesperson',
      action: 'UPDATE',
      module: 'Sales',
      recordId: newOrder.orderNumber,
      details: `Converted Quotation ${quote.quoteNumber} into Sales Order ${newOrder.orderNumber}`,
    });
    googleSheetsService.appendRow('Sales Orders', newOrder);
    this.triggerAutoSync(`Converted quote to sales order ${newOrder.orderNumber}`);
    return newOrder;
  }

  public async convertQuotationToInvoice(quoteId: string, user: string): Promise<SalesInvoice> {
    const quote = this.quotations.find(q => q.id === quoteId);
    if (!quote) throw new Error('Quotation not found');

    const today = new Date().toISOString().split('T')[0];
    const invoice = await this.createInvoice({
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerTrn: quote.customerTrn,
      customerAddress: quote.customerAddress,
      customerPhone: quote.customerPhone || '',
      date: today,
      supplyDate: today,
      dueDate: quote.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      vatAmount: quote.vatAmount,
      deliveryCharge: quote.deliveryCharge,
      total: quote.total,
      paidAmount: 0,
      balanceDue: quote.total,
      status: 'Sent',
      paymentTerms: '30 Days Credit',
      warehouseId: quote.warehouseId || (this.warehouses[0]?.id || 'wh-1'),
      salespersonId: quote.salespersonId,
      salespersonName: quote.salespersonName,
      notes: `Generated directly from Quotation ${quote.quoteNumber}. ${quote.notes || ''}`.trim(),
    }, user);

    quote.status = 'Converted';
    quote.convertedToInvoiceId = invoice.id;
    return invoice;
  }

  public async getOrders(): Promise<SalesOrder[]> {
    return this.orders;
  }

  public async createOrder(data: Omit<SalesOrder, 'id' | 'createdAt'>, user: string): Promise<SalesOrder> {
    const count = this.orders.length + 1;
    const orderNumber = `${this.settings.orderPrefix}${String(count).padStart(4, '0')}`;
    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      ...data,
      orderNumber,
      createdAt: new Date().toISOString(),
    };
    this.orders.unshift(newOrder);
    await this.logAudit({
      userId: 'usr-sales',
      userName: user,
      userRole: 'Salesperson',
      action: 'CREATE',
      module: 'Sales',
      recordId: newOrder.orderNumber,
      details: `Created Sales Order ${newOrder.orderNumber} for ${newOrder.customerName}`,
    });
    googleSheetsService.appendRow('Sales Orders', newOrder);
    this.triggerAutoSync(`Created sales order ${newOrder.orderNumber}`);
    return newOrder;
  }

  public async convertOrderToInvoice(orderId: string, user: string): Promise<SalesInvoice> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Sales order not found');

    const customer = this.customers.find(c => c.id === order.customerId);

    const count = this.invoices.length + 90;
    const invoiceNumber = `${this.settings.invoicePrefix}${String(count).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      orderId: order.id,
      date: today,
      supplyDate: today,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      customerId: order.customerId,
      customerName: order.customerName,
      customerTrn: order.customerTrn,
      customerAddress: order.customerAddress,
      customerPhone: customer?.phone || '+971 4 000 0000',
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      vatAmount: order.vatAmount,
      deliveryCharge: order.deliveryCharge,
      total: order.total,
      paidAmount: 0,
      balanceDue: order.total,
      status: 'Sent',
      paymentTerms: customer?.paymentTerms || 'Net 30 Days',
      salespersonId: order.salespersonId,
      salespersonName: order.salespersonName,
      warehouseId: order.warehouseId,
      qrCodeValue: `${this.settings.companyName}|${this.settings.trn}|${new Date().toISOString()}|${order.total.toFixed(2)}|${order.vatAmount.toFixed(2)}`,
      notes: `Converted from Sales Order ${order.orderNumber}`,
      createdAt: new Date().toISOString(),
    };

    order.status = 'Invoiced';
    order.convertedToInvoiceId = newInvoice.id;

    // Execute automatic accounting and inventory deduction
    await this.finalizeSalesInvoice(newInvoice, user);

    this.invoices.unshift(newInvoice);
    googleSheetsService.appendRow('Sales Invoices', newInvoice);
    this.triggerAutoSync(`Converted sales order ${order.orderNumber} to invoice ${newInvoice.invoiceNumber}`);
    return newInvoice;
  }

  // --- Invoicing & Automatic Accounting ---
  public async getInvoices(): Promise<SalesInvoice[]> {
    return this.invoices;
  }

  public async createInvoice(data: Omit<SalesInvoice, 'id' | 'createdAt' | 'invoiceNumber'> & { invoiceNumber?: string }, user: string): Promise<SalesInvoice> {
    const count = this.invoices.length + 90;
    const invoiceNumber = data.invoiceNumber || `${this.settings.invoicePrefix}${String(count).padStart(4, '0')}`;

    // Prevent duplicate invoice number
    if (this.invoices.some(i => i.invoiceNumber === invoiceNumber)) {
      throw new Error(`Invoice number ${invoiceNumber} already exists in Maxpack ERP.`);
    }

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      ...data,
      invoiceNumber,
      qrCodeValue: `${this.settings.companyName}|${this.settings.trn}|${new Date().toISOString()}|${data.total.toFixed(2)}|${data.vatAmount.toFixed(2)}`,
      createdAt: new Date().toISOString(),
    };

    await this.finalizeSalesInvoice(newInvoice, user);

    this.invoices.unshift(newInvoice);
    googleSheetsService.appendRow('Sales Invoices', newInvoice);
    this.triggerAutoSync(`Created tax invoice ${newInvoice.invoiceNumber}`);
    return newInvoice;
  }

  private async finalizeSalesInvoice(invoice: SalesInvoice, user: string) {
    // 1. Deduct Stock for all items
    for (const item of invoice.items) {
      const prod = this.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        const wh = invoice.warehouseId || 'wh-1';
        prod.warehouseStocks[wh] = Math.max(0, (prod.warehouseStocks[wh] || 0) - item.quantity);

        const movement: StockMovement = {
          id: `sm-${Date.now()}-${item.sku}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'OUT',
          quantity: item.quantity,
          fromWarehouseId: wh,
          fromWarehouseName: this.warehouses.find(w => w.id === wh)?.name || 'Central',
          unitCost: prod.costPrice,
          totalCost: prod.costPrice * item.quantity,
          referenceType: 'INVOICE',
          referenceId: invoice.invoiceNumber,
          performedBy: user,
          notes: `Delivered for Tax Invoice ${invoice.invoiceNumber} to ${invoice.customerName}`,
        };
        this.stockMovements.unshift(movement);
        googleSheetsService.appendRow('Stock Movements', movement);
      }
    }

    // 2. Update Customer Balance
    const cust = this.customers.find(c => c.id === invoice.customerId);
    if (cust) {
      cust.currentBalance += invoice.balanceDue;
    }

    // 3. Auto-post balanced Double-Entry Journal Entry
    // Dr. Accounts Receivable 1100 (Total AED)
    // Cr. Sales Revenue 4000 (Subtotal - Discount)
    // Cr. Delivery Revenue 4020 (Delivery Charge)
    // Cr. Output VAT 5% 2100 (VAT Amount)
    const journalLines: JournalLine[] = [
      {
        id: `jl-${Date.now()}-1`,
        accountCode: '1100',
        accountName: 'Accounts Receivable (Trade Debtors)',
        description: `Receivable from ${invoice.customerName} for ${invoice.invoiceNumber}`,
        debit: Math.round(invoice.total * 100) / 100,
        credit: 0,
      },
      {
        id: `jl-${Date.now()}-2`,
        accountCode: '4000',
        accountName: 'Commercial Packaging Sales',
        description: `Taxable packaging sales supply for ${invoice.invoiceNumber}`,
        debit: 0,
        credit: Math.round((invoice.subtotal - invoice.discount) * 100) / 100,
      }
    ];

    if (invoice.deliveryCharge > 0) {
      journalLines.push({
        id: `jl-${Date.now()}-3`,
        accountCode: '4020',
        accountName: 'Delivery & Logistics Revenue',
        description: `Freight charge on ${invoice.invoiceNumber}`,
        debit: 0,
        credit: Math.round(invoice.deliveryCharge * 100) / 100,
      });
    }

    journalLines.push({
      id: `jl-${Date.now()}-4`,
      accountCode: '2100',
      accountName: 'Output VAT 5% (FTA Payable)',
      description: `UAE Federal Tax Authority 5% Output VAT for ${invoice.invoiceNumber}`,
      debit: 0,
      credit: Math.round(invoice.vatAmount * 100) / 100,
    });

    await this.postAutomaticJournalEntry({
      referenceType: 'INVOICE',
      referenceId: invoice.invoiceNumber,
      description: `Auto-posted UAE Tax Invoice ${invoice.invoiceNumber} to ${invoice.customerName}`,
      lines: journalLines,
      user,
    });

    await this.logAudit({
      userId: 'usr-sales',
      userName: user,
      userRole: 'Salesperson',
      action: 'CREATE',
      module: 'Sales',
      recordId: invoice.invoiceNumber,
      details: `Generated UAE Tax Invoice ${invoice.invoiceNumber} for ${invoice.customerName} (${invoice.total.toFixed(2)} AED incl. 5% VAT)`,
    });
  }

  public async updateInvoiceStatus(id: string, status: SalesInvoice['status'], user: string): Promise<SalesInvoice> {
    const inv = this.invoices.find(i => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    const oldStatus = inv.status;
    inv.status = status;
    await this.logAudit({
      userId: 'usr-admin',
      userName: user,
      userRole: 'Admin / Manager',
      action: 'UPDATE',
      module: 'Sales',
      recordId: inv.invoiceNumber,
      details: `Invoice ${inv.invoiceNumber} status changed from ${oldStatus} to ${status}`,
    });
    return inv;
  }

  public async recordInvoicePayment(invoiceId: string, paymentData: Omit<Payment, 'id' | 'createdAt'>, user: string): Promise<{ payment: Payment; invoice: SalesInvoice }> {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const amount = Number(paymentData.amount);
    if (amount <= 0) throw new Error('Payment amount must be greater than zero');
    if (amount > inv.balanceDue + 0.01) {
      throw new Error(`Payment amount (${amount} AED) cannot exceed invoice balance due (${inv.balanceDue} AED)`);
    }

    inv.paidAmount += amount;
    inv.balanceDue = Math.max(0, inv.total - inv.paidAmount);
    inv.status = inv.balanceDue === 0 ? 'Paid' : 'Partially Paid';

    // Update customer ledger
    const cust = this.customers.find(c => c.id === inv.customerId);
    if (cust) {
      cust.currentBalance = Math.max(0, cust.currentBalance - amount);
    }

    const paymentNumber = `REC-2026-${String(Math.floor(Math.random() * 800) + 100)}`;
    const payment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      paymentNumber,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    // Auto-post receipt to General Ledger
    // Dr. Bank 1020 / Cash 1010
    // Cr. Accounts Receivable 1100
    const bankCode = paymentData.paymentMethod === 'Cash' ? '1010' : '1020';
    const bankName = paymentData.paymentMethod === 'Cash' ? 'Cash on Hand - Showroom POS' : 'Emirates NBD Main Operating (AED)';

    await this.postAutomaticJournalEntry({
      referenceType: 'PAYMENT',
      referenceId: payment.paymentNumber,
      description: `Customer payment receipt ${payment.paymentNumber} for ${inv.invoiceNumber} (${payment.paymentMethod})`,
      lines: [
        {
          id: `jl-p1`,
          accountCode: bankCode,
          accountName: bankName,
          description: `Funds received from ${inv.customerName}`,
          debit: amount,
          credit: 0,
        },
        {
          id: `jl-p2`,
          accountCode: '1100',
          accountName: 'Accounts Receivable (Trade Debtors)',
          description: `Clear receivable on ${inv.invoiceNumber}`,
          debit: 0,
          credit: amount,
        }
      ],
      user,
    });

    await this.logAudit({
      userId: 'usr-acc',
      userName: user,
      userRole: 'Accountant',
      action: 'CREATE',
      module: 'Accounting',
      recordId: payment.paymentNumber,
      details: `Recorded receipt ${payment.paymentNumber} of ${amount.toFixed(2)} AED via ${payment.paymentMethod} for ${inv.invoiceNumber}`,
    });

    this.payments.unshift(payment);
    googleSheetsService.appendRow('Payments', payment);
    this.triggerAutoSync(`Payment received ${payment.paymentNumber} for ${inv.invoiceNumber}`);
    return { payment, invoice: inv };
  }

  // --- POS (Point of Sale) ---
  public async getPOSTransactions(): Promise<POSTransaction[]> {
    return this.posTransactions;
  }

  public async getCurrentShift(cashierId: string): Promise<CashierShift | undefined> {
    return this.shifts.find(s => s.status === 'Open');
  }

  public async openShift(data: Omit<CashierShift, 'id' | 'transactionCount' | 'totalSales' | 'totalCard' | 'totalBank' | 'status'>, user: string): Promise<CashierShift> {
    // Check if open shift exists
    const existing = this.shifts.find(s => s.status === 'Open');
    if (existing) {
      return existing;
    }

    const shiftNumber = `SHF-2026-${String(this.shifts.length + 1).padStart(4, '0')}`;
    const newShift: CashierShift = {
      ...data,
      id: `shift-${Date.now()}`,
      shiftNumber,
      expectedCash: data.openingFloat,
      totalSales: 0,
      totalCard: 0,
      totalBank: 0,
      transactionCount: 0,
      status: 'Open',
    };
    this.shifts.unshift(newShift);
    await this.logAudit({
      userId: 'usr-pos',
      userName: user,
      userRole: 'Cashier',
      action: 'CREATE',
      module: 'POS',
      recordId: newShift.shiftNumber,
      details: `Opened cashier shift ${newShift.shiftNumber} with float of ${data.openingFloat.toFixed(2)} AED`,
    });
    return newShift;
  }

  public async closeShift(shiftId: string, closingFloat: number, actualCash: number, notes: string, user: string): Promise<CashierShift> {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');

    shift.status = 'Closed';
    shift.endTime = new Date().toISOString();
    shift.closingFloat = closingFloat;
    shift.actualCash = actualCash;
    shift.difference = actualCash - shift.expectedCash;
    shift.notes = notes;

    await this.logAudit({
      userId: 'usr-pos',
      userName: user,
      userRole: 'Cashier',
      action: 'UPDATE',
      module: 'POS',
      recordId: shift.shiftNumber,
      details: `Closed cashier shift ${shift.shiftNumber}. Expected: ${shift.expectedCash.toFixed(2)} AED, Actual: ${actualCash.toFixed(2)} AED (Diff: ${shift.difference.toFixed(2)} AED)`,
    });

    return shift;
  }

  public async createPOSTransaction(data: Omit<POSTransaction, 'id' | 'createdAt'>, user: string): Promise<POSTransaction> {
    const receiptNumber = `POS-2026-${String(this.posTransactions.length + 414).padStart(4, '0')}`;
    const tx: POSTransaction = {
      ...data,
      id: `pos-${Date.now()}`,
      receiptNumber,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };

    // 1. Deduct Stock immediately
    for (const item of data.items) {
      const prod = this.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        const wh = data.warehouseId || 'wh-1';
        prod.warehouseStocks[wh] = Math.max(0, (prod.warehouseStocks[wh] || 0) - item.quantity);

        const movement: StockMovement = {
          id: `sm-pos-${Date.now()}-${item.sku}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'OUT',
          quantity: item.quantity,
          fromWarehouseId: wh,
          fromWarehouseName: 'DIP Showroom',
          unitCost: prod.costPrice,
          totalCost: prod.costPrice * item.quantity,
          referenceType: 'POS',
          referenceId: receiptNumber,
          performedBy: user,
          notes: `POS Counter Sale ${receiptNumber}`,
        };
        this.stockMovements.unshift(movement);
        googleSheetsService.appendRow('Stock Movements', movement);
      }
    }

    // 2. Update Shift Cashier Totals
    const currentShift = this.shifts.find(s => s.id === data.shiftId || s.status === 'Open');
    if (currentShift) {
      currentShift.transactionCount += 1;
      currentShift.totalSales += data.total;
      if (data.paymentMethod === 'Cash') {
        currentShift.expectedCash += data.total;
      } else if (data.paymentMethod === 'Card') {
        currentShift.totalCard += data.total;
      } else if (data.paymentMethod === 'Bank Transfer') {
        currentShift.totalBank += data.total;
      } else if (data.paymentMethod === 'Split' && data.splitDetails) {
        currentShift.expectedCash += (data.splitDetails.cash || 0);
        currentShift.totalCard += (data.splitDetails.card || 0);
        currentShift.totalBank += (data.splitDetails.bank || 0);
      }
    }

    // 3. Auto-post accounting entry:
    // Dr. Cash 1010 or Card Clearing 1030
    // Cr. POS Retail Sales 4010
    // Cr. Output VAT 5% 2100
    const debitAccount = data.paymentMethod === 'Cash' ? '1010' : (data.paymentMethod === 'Card' ? '1030' : '1020');
    const debitName = data.paymentMethod === 'Cash' ? 'Cash on Hand - Showroom POS' : (data.paymentMethod === 'Card' ? 'Card & POS Settlement Clearing' : 'Emirates NBD Main Operating (AED)');

    await this.postAutomaticJournalEntry({
      referenceType: 'POS',
      referenceId: receiptNumber,
      description: `POS Receipt ${receiptNumber} (${data.paymentMethod}) - Walk-in customer`,
      lines: [
        {
          id: `jl-pos-1`,
          accountCode: debitAccount,
          accountName: debitName,
          description: `POS receipt tender (${data.paymentMethod})`,
          debit: Math.round(data.total * 100) / 100,
          credit: 0,
        },
        {
          id: `jl-pos-2`,
          accountCode: '4010',
          accountName: 'POS Showroom Counter Sales',
          description: `Retail packaging sale for ${receiptNumber}`,
          debit: 0,
          credit: Math.round(data.subtotal * 100) / 100,
        },
        {
          id: `jl-pos-3`,
          accountCode: '2100',
          accountName: 'Output VAT 5% (FTA Payable)',
          description: `5% Output VAT on ${receiptNumber}`,
          debit: 0,
          credit: Math.round(data.vatAmount * 100) / 100,
        }
      ],
      user,
    });

    this.posTransactions.unshift(tx);
    googleSheetsService.appendRow('POS Transactions', tx);
    this.triggerAutoSync(`POS Sale ${receiptNumber}`);
    return tx;
  }

  // --- Purchases & Supplier Bills ---
  public async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrders;
  }

  public async createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'createdAt'>, user: string): Promise<PurchaseOrder> {
    const poNumber = `${this.settings.poPrefix}${String(this.purchaseOrders.length + 22).padStart(4, '0')}`;
    const newPO: PurchaseOrder = {
      ...data,
      id: `po-${Date.now()}`,
      poNumber,
      status: 'Sent',
      createdAt: new Date().toISOString(),
    };
    this.purchaseOrders.unshift(newPO);
    await this.logAudit({
      userId: 'usr-admin',
      userName: user,
      userRole: 'Admin / Manager',
      action: 'CREATE',
      module: 'Purchases',
      recordId: newPO.poNumber,
      details: `Created Purchase Order ${newPO.poNumber} to ${newPO.supplierName} (${newPO.total.toFixed(2)} AED)`,
    });
    googleSheetsService.appendRow('Purchase Orders', newPO);
    this.triggerAutoSync(`Created purchase order ${newPO.poNumber}`);
    return newPO;
  }

  public async receivePurchaseOrder(poId: string, user: string): Promise<PurchaseOrder> {
    const po = this.purchaseOrders.find(p => p.id === poId);
    if (!po) throw new Error('Purchase order not found');

    po.status = 'Received';

    // Increase stock for all items
    for (const item of po.items) {
      item.receivedQuantity = item.quantity;
      const prod = this.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity += item.quantity;
        const wh = po.warehouseId || 'wh-1';
        prod.warehouseStocks[wh] = (prod.warehouseStocks[wh] || 0) + item.quantity;

        const sm: StockMovement = {
          id: `sm-po-${Date.now()}-${item.sku}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'IN',
          quantity: item.quantity,
          toWarehouseId: wh,
          toWarehouseName: this.warehouses.find(w => w.id === wh)?.name || 'Central',
          unitCost: item.unitCost,
          totalCost: item.unitCost * item.quantity,
          referenceType: 'PO',
          referenceId: po.poNumber,
          performedBy: user,
          notes: `Goods received against PO ${po.poNumber} from ${po.supplierName}`,
        };
        this.stockMovements.unshift(sm);
        googleSheetsService.appendRow('Stock Movements', sm);
      }
    }

    // Automatically generate Supplier Bill
    const billNumber = `BILL-2026-${String(this.supplierBills.length + 46).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const newBill: SupplierBill = {
      id: `bill-${Date.now()}`,
      billNumber,
      poId: po.id,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      supplierTrn: po.supplierTrn,
      supplierInvoiceNo: `SUP-INV-${Math.floor(Math.random() * 90000) + 10000}`,
      date: today,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: po.items.map(i => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitCost: i.unitCost,
        vatRate: i.vatRate,
        vatAmount: i.vatAmount,
        total: i.total,
      })),
      subtotal: po.subtotal,
      vatAmount: po.vatAmount,
      total: po.total,
      paidAmount: 0,
      balanceDue: po.total,
      status: 'Unpaid',
      warehouseId: po.warehouseId,
      notes: `Generated upon GRN receipt of PO ${po.poNumber}`,
      createdAt: new Date().toISOString(),
    };

    // Auto-post accounting entry for supplier bill:
    // Dr. Inventory Asset 1200 (Subtotal)
    // Dr. Input VAT 5% 2110 (VAT Amount)
    // Cr. Accounts Payable 2000 (Total)
    await this.postAutomaticJournalEntry({
      referenceType: 'BILL',
      referenceId: newBill.billNumber,
      description: `Auto-posted Supplier Bill ${newBill.billNumber} from ${newBill.supplierName}`,
      lines: [
        {
          id: `jl-b1`,
          accountCode: '1200',
          accountName: 'Inventory Asset (Packaging Goods)',
          description: `Inventory stock addition from ${newBill.supplierName}`,
          debit: Math.round(newBill.subtotal * 100) / 100,
          credit: 0,
        },
        {
          id: `jl-b2`,
          accountCode: '2110',
          accountName: 'Input VAT 5% (FTA Recoverable)',
          description: `5% Recoverable Input VAT on supplier purchase ${newBill.billNumber}`,
          debit: Math.round(newBill.vatAmount * 100) / 100,
          credit: 0,
        },
        {
          id: `jl-b3`,
          accountCode: '2000',
          accountName: 'Accounts Payable (Trade Creditors)',
          description: `Trade liability due to ${newBill.supplierName}`,
          debit: 0,
          credit: Math.round(newBill.total * 100) / 100,
        }
      ],
      user,
    });

    // Update supplier balance
    const sup = this.suppliers.find(s => s.id === po.supplierId);
    if (sup) {
      sup.balance += newBill.total;
    }

    this.supplierBills.unshift(newBill);
    googleSheetsService.appendRow('Supplier Bills', newBill);

    await this.logAudit({
      userId: 'usr-wh',
      userName: user,
      userRole: 'Warehouse Staff',
      action: 'UPDATE',
      module: 'Purchases',
      recordId: po.poNumber,
      details: `Received goods for PO ${po.poNumber}. Stock increased and Supplier Bill ${billNumber} generated.`,
    });

    this.triggerAutoSync(`Received goods for PO ${po.poNumber}`);
    return po;
  }

  public async getSupplierBills(): Promise<SupplierBill[]> {
    return this.supplierBills;
  }

  public async createSupplierBill(
    data: Omit<SupplierBill, 'id' | 'createdAt'> & { updateInventory?: boolean },
    user: string
  ): Promise<SupplierBill> {
    const billNumber = data.billNumber || `BILL-2026-${String(this.supplierBills.length + 46).padStart(4, '0')}`;
    const today = data.date || new Date().toISOString().split('T')[0];
    const dueDate = data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Find supplier to ensure we have name and TRN
    const sup = this.suppliers.find(s => s.id === data.supplierId);
    const supplierName = data.supplierName || sup?.name || 'Vendor / Supplier';
    const supplierTrn = data.supplierTrn || sup?.trn || '';

    // Calculate totals if not provided
    const rawItems = data.items || [];
    let subtotal = data.subtotal;
    let vatAmount = data.vatAmount;
    let total = data.total;

    if (subtotal === undefined || subtotal === 0) {
      subtotal = rawItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitCost)), 0);
    }
    if (vatAmount === undefined) {
      vatAmount = rawItems.reduce((sum, item) => {
        const itemNet = Number(item.quantity) * Number(item.unitCost);
        const rate = item.vatRate !== undefined ? Number(item.vatRate) : 0.05;
        return sum + (item.vatAmount !== undefined ? Number(item.vatAmount) : (itemNet * rate));
      }, 0);
    }
    if (total === undefined || total === 0) {
      total = subtotal + vatAmount;
    }

    const newBill: SupplierBill = {
      id: `bill-${Date.now()}`,
      billNumber,
      poId: data.poId,
      supplierId: data.supplierId,
      supplierName,
      supplierTrn,
      supplierInvoiceNo: data.supplierInvoiceNo || `SUP-INV-${Math.floor(Math.random() * 90000) + 10000}`,
      date: today,
      dueDate,
      items: rawItems.map(i => {
        const qty = Number(i.quantity) || 1;
        const cost = Number(i.unitCost) || 0;
        const rate = i.vatRate !== undefined ? Number(i.vatRate) : 0.05;
        const itemVat = i.vatAmount !== undefined ? Number(i.vatAmount) : Math.round(qty * cost * rate * 100) / 100;
        const itemTot = i.total !== undefined ? Number(i.total) : Math.round((qty * cost + itemVat) * 100) / 100;
        return {
          productId: i.productId,
          name: i.name,
          quantity: qty,
          unitCost: cost,
          vatRate: rate,
          vatAmount: itemVat,
          total: itemTot,
        };
      }),
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      paidAmount: Number(data.paidAmount) || 0,
      balanceDue: Number(data.paidAmount) ? Math.max(0, total - Number(data.paidAmount)) : total,
      status: Number(data.paidAmount) >= total ? 'Paid' : (Number(data.paidAmount) > 0 ? 'Partially Paid' : 'Unpaid'),
      warehouseId: data.warehouseId || 'wh-1',
      notes: data.notes || 'Direct Purchase Bill entry',
      createdAt: new Date().toISOString(),
    };

    // If inventory update is requested or default, add items to stock
    if (data.updateInventory !== false && rawItems.length > 0) {
      const wh = newBill.warehouseId || 'wh-1';
      const whName = this.warehouses.find(w => w.id === wh)?.name || 'DIP Central';
      for (const item of rawItems) {
        if (item.productId) {
          const prod = this.products.find(p => p.id === item.productId);
          if (prod) {
            const qty = Number(item.quantity) || 0;
            const cost = Number(item.unitCost) || prod.costPrice;
            prod.stockQuantity += qty;
            prod.warehouseStocks[wh] = (prod.warehouseStocks[wh] || 0) + qty;

            const sm: StockMovement = {
              id: `sm-bill-${Date.now()}-${prod.sku || prod.id}`,
              date: new Date().toISOString(),
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              type: 'IN',
              quantity: qty,
              toWarehouseId: wh,
              toWarehouseName: whName,
              unitCost: cost,
              totalCost: Math.round(cost * qty * 100) / 100,
              referenceType: 'PO',
              referenceId: newBill.billNumber,
              performedBy: user,
              notes: `Direct purchase bill ${newBill.billNumber} from ${newBill.supplierName}`,
            };
            this.stockMovements.unshift(sm);
            googleSheetsService.appendRow('Stock Movements', sm).catch(() => {});
          }
        }
      }
    }

    // Auto-post accounting entry:
    // Dr. Inventory Asset 1200 (Subtotal)
    // Dr. Input VAT 5% 2110 (VAT Amount)
    // Cr. Accounts Payable 2000 (Total)
    await this.postAutomaticJournalEntry({
      referenceType: 'BILL',
      referenceId: newBill.billNumber,
      description: `Direct Supplier Bill ${newBill.billNumber} from ${newBill.supplierName}`,
      lines: [
        {
          id: `jl-db1-${Date.now()}`,
          accountCode: '1200',
          accountName: 'Inventory Asset (Packaging Goods)',
          description: `Stock addition via direct purchase ${newBill.billNumber}`,
          debit: Math.round(newBill.subtotal * 100) / 100,
          credit: 0,
        },
        {
          id: `jl-db2-${Date.now()}`,
          accountCode: '2110',
          accountName: 'Input VAT 5% (FTA Recoverable)',
          description: `5% Recoverable Input VAT on ${newBill.billNumber}`,
          debit: Math.round(newBill.vatAmount * 100) / 100,
          credit: 0,
        },
        {
          id: `jl-db3-${Date.now()}`,
          accountCode: '2000',
          accountName: 'Accounts Payable (Trade Creditors)',
          description: `Trade liability due to ${newBill.supplierName}`,
          debit: 0,
          credit: Math.round(newBill.total * 100) / 100,
        }
      ],
      user,
    });

    // Update supplier balance
    if (sup) {
      sup.balance = (sup.balance || 0) + newBill.balanceDue;
    }

    this.supplierBills.unshift(newBill);
    googleSheetsService.appendRow('Supplier Bills', newBill).catch(() => {});

    await this.logAudit({
      userId: 'usr-acct',
      userName: user,
      userRole: 'Accountant',
      action: 'CREATE',
      module: 'Purchases',
      recordId: newBill.billNumber,
      details: `Direct purchase bill ${newBill.billNumber} recorded for ${newBill.supplierName} (AED ${newBill.total.toFixed(2)}).`,
    });

    this.persistToDisk(true);
    this.triggerAutoSync(`Created direct supplier bill ${newBill.billNumber}`);
    return newBill;
  }

  public async paySupplierBill(billId: string, paymentData: Omit<Payment, 'id' | 'createdAt'>, user: string): Promise<SupplierBill> {
    const bill = this.supplierBills.find(b => b.id === billId);
    if (!bill) throw new Error('Supplier bill not found');

    const amount = Number(paymentData.amount);
    bill.paidAmount += amount;
    bill.balanceDue = Math.max(0, bill.total - bill.paidAmount);
    bill.status = bill.balanceDue === 0 ? 'Paid' : 'Partially Paid';

    const sup = this.suppliers.find(s => s.id === bill.supplierId);
    if (sup) {
      sup.balance = Math.max(0, sup.balance - amount);
    }

    // Auto-post payment to GL:
    // Dr. Accounts Payable 2000
    // Cr. Emirates NBD 1020
    await this.postAutomaticJournalEntry({
      referenceType: 'PAYMENT',
      referenceId: bill.billNumber,
      description: `Payment to supplier ${bill.supplierName} for ${bill.billNumber}`,
      lines: [
        {
          id: `jl-sp1`,
          accountCode: '2000',
          accountName: 'Accounts Payable (Trade Creditors)',
          description: `Clear trade liability on ${bill.billNumber}`,
          debit: amount,
          credit: 0,
        },
        {
          id: `jl-sp2`,
          accountCode: '1020',
          accountName: 'Emirates NBD Main Operating (AED)',
          description: `Disbursed funds via ${paymentData.paymentMethod}`,
          debit: 0,
          credit: amount,
        }
      ],
      user,
    });

    await this.logAudit({
      userId: 'usr-acc',
      userName: user,
      userRole: 'Accountant',
      action: 'CREATE',
      module: 'Accounting',
      recordId: bill.billNumber,
      details: `Paid ${amount.toFixed(2)} AED to supplier ${bill.supplierName} on bill ${bill.billNumber}`,
    });

    this.triggerAutoSync(`Paid supplier bill ${bill.billNumber}`);
    return bill;
  }

  // --- Accounting & GL ---
  public async getChartOfAccounts(): Promise<ChartOfAccount[]> {
    return this.chartOfAccounts;
  }

  public async getJournalEntries(): Promise<JournalEntry[]> {
    return this.journalEntries;
  }

  public async postManualJournalEntry(data: Omit<JournalEntry, 'id' | 'postedAt'>, user: string): Promise<JournalEntry> {
    // STRICT RULE: Validate Debit === Credit
    const totalDebit = Math.round(data.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0) * 100) / 100;
    const totalCredit = Math.round(data.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0) * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Unbalanced Journal Entry rejected! Total Debit (${totalDebit.toFixed(2)} AED) must equal Total Credit (${totalCredit.toFixed(2)} AED). Difference: ${(totalDebit - totalCredit).toFixed(2)} AED.`);
    }

    const entryNumber = `JV-2026-${String(this.journalEntries.length + 103).padStart(4, '0')}`;
    const newEntry: JournalEntry = {
      ...data,
      id: `jv-${Date.now()}`,
      entryNumber,
      totalDebit,
      totalCredit,
      status: 'Posted',
      postedBy: user,
      postedAt: new Date().toISOString(),
    };

    // Update account balances
    for (const line of newEntry.lines) {
      const acc = this.chartOfAccounts.find(a => a.code === line.accountCode);
      if (acc) {
        if (acc.category === 'Asset' || acc.category === 'Expense') {
          acc.balance += (Number(line.debit) || 0) - (Number(line.credit) || 0);
        } else {
          acc.balance += (Number(line.credit) || 0) - (Number(line.debit) || 0);
        }
      }
    }

    this.journalEntries.unshift(newEntry);
    await this.logAudit({
      userId: 'usr-acc',
      userName: user,
      userRole: 'Accountant',
      action: 'POST',
      module: 'Accounting',
      recordId: newEntry.entryNumber,
      details: `Posted manual Journal Entry ${newEntry.entryNumber} (${totalDebit.toFixed(2)} AED): ${newEntry.description}`,
    });
    googleSheetsService.appendRow('Journal Entries', newEntry);
    return newEntry;
  }

  private async postAutomaticJournalEntry(params: {
    referenceType: JournalEntry['referenceType'];
    referenceId: string;
    description: string;
    lines: JournalLine[];
    user: string;
  }): Promise<JournalEntry> {
    const totalDebit = Math.round(params.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0) * 100) / 100;
    const totalCredit = Math.round(params.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0) * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.05) {
      console.error(`[Accounting] Discrepancy detected in automated journal entry: Dr ${totalDebit} != Cr ${totalCredit}`);
    }

    const entryNumber = `JV-2026-${String(this.journalEntries.length + 103).padStart(4, '0')}`;
    const newEntry: JournalEntry = {
      id: `jv-${Date.now()}`,
      entryNumber,
      date: new Date().toISOString().split('T')[0],
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      description: params.description,
      lines: params.lines,
      totalDebit,
      totalCredit,
      status: 'Posted',
      postedBy: `System / ${params.user}`,
      postedAt: new Date().toISOString(),
    };

    // Update account balances
    for (const line of newEntry.lines) {
      const acc = this.chartOfAccounts.find(a => a.code === line.accountCode);
      if (acc) {
        if (acc.category === 'Asset' || acc.category === 'Expense') {
          acc.balance += (Number(line.debit) || 0) - (Number(line.credit) || 0);
        } else {
          acc.balance += (Number(line.credit) || 0) - (Number(line.debit) || 0);
        }
      }
    }

    this.journalEntries.unshift(newEntry);
    googleSheetsService.appendRow('Journal Entries', newEntry);
    this.triggerAutoSync(`Manual journal entry ${newEntry.entryNumber}`);
    return newEntry;
  }

  public async getExpenses(): Promise<Expense[]> {
    return this.expenses;
  }

  public async createExpense(data: Omit<Expense, 'id' | 'createdAt'>, user: string): Promise<Expense> {
    const expenseNumber = `EXP-2026-${String(this.expenses.length + 33).padStart(4, '0')}`;
    const exp: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      expenseNumber,
      createdAt: new Date().toISOString(),
    };

    // Auto-post expense to GL
    // Dr. Expense account
    // Dr. Input VAT (if vat > 0)
    // Cr. Bank account / Cash
    const lines: JournalLine[] = [
      {
        id: 'jl-e1',
        accountCode: '6030', // General operating
        accountName: data.category,
        description: data.description,
        debit: data.amount,
        credit: 0,
      }
    ];

    if (data.vatAmount > 0) {
      lines.push({
        id: 'jl-e2',
        accountCode: '2110',
        accountName: 'Input VAT 5% (FTA Recoverable)',
        description: `VAT on ${data.description}`,
        debit: data.vatAmount,
        credit: 0,
      });
    }

    lines.push({
      id: 'jl-e3',
      accountCode: data.paidFromAccount || '1020',
      accountName: data.paidFromAccount === '1010' ? 'Cash on Hand - Showroom POS' : 'Emirates NBD Main Operating (AED)',
      description: `Disbursed for ${data.category}`,
      debit: 0,
      credit: data.total,
    });

    await this.postAutomaticJournalEntry({
      referenceType: 'EXPENSE',
      referenceId: expenseNumber,
      description: `Recorded expense: ${data.description} (${data.vendor || 'Vendor'})`,
      lines,
      user,
    });

    this.expenses.unshift(exp);
    googleSheetsService.appendRow('Expenses', exp);
    this.triggerAutoSync(`Created expense ${exp.expenseNumber}`);
    return exp;
  }

  public async syncAllToGoogleSheets(): Promise<{
    success: boolean;
    syncedTables: Record<string, number>;
    totalRows: number;
    message: string;
  }> {
    const result = await googleSheetsService.syncAllData({
      'Users': this.users,
      'Customers': this.customers,
      'Suppliers': this.suppliers,
      'Products': this.products,
      'Warehouses': this.warehouses,
      'Stock Movements': this.stockMovements,
      'Sales Quotations': this.quotations,
      'Sales Orders': this.orders,
      'Sales Invoices': this.invoices,
      'Payments': this.payments,
      'POS Transactions': this.posTransactions,
      'Purchase Orders': this.purchaseOrders,
      'Supplier Bills': this.supplierBills,
      'Expenses': this.expenses,
      'Chart of Accounts': this.chartOfAccounts,
      'Journal Entries': this.journalEntries,
      'Audit Logs': this.auditLogs,
    });

    await this.logAudit({
      userId: 'usr-admin',
      userName: 'System Admin',
      userRole: 'Super Admin',
      action: 'SYNC',
      module: 'Settings',
      recordId: 'GOOGLE_SHEETS_BULK_SYNC',
      details: `Bulk synchronized ${result.totalRows} records across ${Object.keys(result.syncedTables).length} tables into Google Sheets.`,
    });

    return result;
  }

  /**
   * Bidirectional Ingestion: Pull and merge rows updated or created directly in Google Sheets.
   */
  public async syncAllFromGoogleSheets(): Promise<{
    success: boolean;
    pulledTables: Record<string, number>;
    totalRows: number;
    message: string;
  }> {
    const status = googleSheetsService.getStatus();
    if (!status.configured) {
      throw new Error('Google Sheets is not configured or missing spreadsheet ID');
    }

    const pulledTables: Record<string, number> = {};
    let totalRows = 0;

    // 1. Pull Products
    try {
      const sheetProducts = await googleSheetsService.readTable<any>('Products');
      if (sheetProducts && sheetProducts.length > 0) {
        pulledTables['Products'] = sheetProducts.length;
        totalRows += sheetProducts.length;
        for (const sp of sheetProducts) {
          if (!sp.sku && !sp.name) continue;
          const existing = this.products.find(p => (sp.id && p.id === sp.id) || (sp.sku && p.sku.toLowerCase() === String(sp.sku).toLowerCase()));
          if (existing) {
            if (sp.name) existing.name = sp.name;
            if (sp.category) existing.category = sp.category;
            if (sp.unit) existing.unit = sp.unit;
            if (sp.costPrice !== undefined && sp.costPrice !== '') existing.costPrice = Number(sp.costPrice) || existing.costPrice;
            if (sp.sellingPrice !== undefined && sp.sellingPrice !== '') existing.sellingPrice = Number(sp.sellingPrice) || existing.sellingPrice;
            if (sp.stockQuantity !== undefined && sp.stockQuantity !== '') existing.stockQuantity = Number(sp.stockQuantity) || existing.stockQuantity;
            if (sp.barcode) existing.barcode = sp.barcode;
            if (sp.reorderLevel !== undefined && sp.reorderLevel !== '') existing.reorderLevel = Number(sp.reorderLevel) || existing.reorderLevel;
          } else {
            const newProd: Product = {
              id: sp.id || `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              sku: sp.sku || `SKU-${Date.now()}`,
              barcode: sp.barcode || '',
              name: sp.name || 'Imported Product',
              category: sp.category || 'Corrugated Boxes',
              unit: sp.unit || 'pcs',
              costPrice: Number(sp.costPrice) || 5.0,
              sellingPrice: Number(sp.sellingPrice) || 8.5,
              vatRate: 0.05,
              stockQuantity: Number(sp.stockQuantity) || 0,
              reorderLevel: Number(sp.reorderLevel) || 50,
              warehouseStocks: { 'wh-1': Number(sp.stockQuantity) || 0, 'wh-2': 0, 'wh-3': 0 },
              createdAt: sp.createdAt || new Date().toISOString(),
            };
            this.products.push(newProd);
          }
        }
      }
    } catch (err: any) {
      console.warn('[AutoSync] Pull Products note:', err.message);
    }

    // 2. Pull Customers
    try {
      const sheetCustomers = await googleSheetsService.readTable<any>('Customers');
      if (sheetCustomers && sheetCustomers.length > 0) {
        pulledTables['Customers'] = sheetCustomers.length;
        totalRows += sheetCustomers.length;
        for (const sc of sheetCustomers) {
          if (!sc.companyName) continue;
          const existing = this.customers.find(c => (sc.id && c.id === sc.id) || (sc.trn && sc.trn.length > 5 && c.trn === sc.trn));
          if (existing) {
            if (sc.companyName) existing.companyName = sc.companyName;
            if (sc.contactPerson) existing.contactPerson = sc.contactPerson;
            if (sc.phone) existing.phone = sc.phone;
            if (sc.email) existing.email = sc.email;
            if (sc.trn) existing.trn = sc.trn;
            if (sc.address) existing.address = sc.address;
            if (sc.emirate) existing.emirate = sc.emirate;
            if (sc.creditLimit !== undefined && sc.creditLimit !== '') existing.creditLimit = Number(sc.creditLimit) || existing.creditLimit;
            if (sc.paymentTerms) existing.paymentTerms = sc.paymentTerms;
            if (sc.currentBalance !== undefined && sc.currentBalance !== '') existing.currentBalance = Number(sc.currentBalance) || existing.currentBalance;
          } else {
            const newCust: Customer = {
              id: sc.id || `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              companyName: sc.companyName,
              contactPerson: sc.contactPerson || '',
              phone: sc.phone || '',
              email: sc.email || '',
              trn: sc.trn || '',
              address: sc.address || '',
              emirate: sc.emirate || 'Dubai',
              creditLimit: Number(sc.creditLimit) || 50000,
              paymentTerms: sc.paymentTerms || '30 Days Credit',
              currentBalance: Number(sc.currentBalance) || 0,
              notes: sc.notes || '',
              createdAt: sc.createdAt || new Date().toISOString(),
            };
            this.customers.push(newCust);
          }
        }
      }
    } catch (err: any) {
      console.warn('[AutoSync] Pull Customers note:', err.message);
    }

    // 3. Pull Suppliers
    try {
      const sheetSuppliers = await googleSheetsService.readTable<any>('Suppliers');
      if (sheetSuppliers && sheetSuppliers.length > 0) {
        pulledTables['Suppliers'] = sheetSuppliers.length;
        totalRows += sheetSuppliers.length;
        for (const ss of sheetSuppliers) {
          if (!ss.name) continue;
          const existing = this.suppliers.find(s => (ss.id && s.id === ss.id) || (ss.trn && ss.trn.length > 5 && s.trn === ss.trn));
          if (existing) {
            if (ss.name) existing.name = ss.name;
            if (ss.contactPerson) existing.contactPerson = ss.contactPerson;
            if (ss.phone) existing.phone = ss.phone;
            if (ss.email) existing.email = ss.email;
            if (ss.trn) existing.trn = ss.trn;
            if (ss.address) existing.address = ss.address;
            if (ss.emirate) existing.emirate = ss.emirate;
            if (ss.paymentTerms) existing.paymentTerms = ss.paymentTerms;
            if (ss.balance !== undefined && ss.balance !== '') existing.balance = Number(ss.balance) || existing.balance;
            if (ss.category) existing.category = ss.category;
          } else {
            const newSup: Supplier = {
              id: ss.id || `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: ss.name,
              contactPerson: ss.contactPerson || '',
              phone: ss.phone || '',
              email: ss.email || '',
              trn: ss.trn || '',
              address: ss.address || '',
              emirate: ss.emirate || 'Dubai',
              paymentTerms: ss.paymentTerms || '30 Days',
              balance: Number(ss.balance) || 0,
              category: ss.category || 'Raw Materials',
              notes: ss.notes || '',
              createdAt: ss.createdAt || new Date().toISOString(),
            };
            this.suppliers.push(newSup);
          }
        }
      }
    } catch (err: any) {
      console.warn('[AutoSync] Pull Suppliers note:', err.message);
    }

    // 4. Pull Expenses
    try {
      const sheetExpenses = await googleSheetsService.readTable<any>('Expenses');
      if (sheetExpenses && sheetExpenses.length > 0) {
        pulledTables['Expenses'] = sheetExpenses.length;
        totalRows += sheetExpenses.length;
        for (const se of sheetExpenses) {
          if (!se.expenseNumber && !se.amount) continue;
          const existing = this.expenses.find(e => (se.id && e.id === se.id) || (se.expenseNumber && e.expenseNumber === se.expenseNumber));
          if (!existing) {
            this.expenses.push({
              id: se.id || `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              expenseNumber: se.expenseNumber || `EXP-${Date.now()}`,
              date: se.date || new Date().toISOString().split('T')[0],
              category: se.category || 'General Operations',
              description: se.description || '',
              vendor: se.vendor || '',
              amount: Number(se.amount) || 0,
              vatAmount: Number(se.vatAmount) || 0,
              total: Number(se.total) || Number(se.amount) || 0,
              paidFromAccount: se.paidFromAccount || '1010',
              paymentMethod: se.paymentMethod || 'Bank Transfer',
              recordedBy: se.recordedBy || 'Google Sheets User',
              createdAt: se.createdAt || new Date().toISOString(),
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[AutoSync] Pull Expenses note:', err.message);
    }

    this.lastAutoSyncTime = new Date().toISOString();
    this.lastAutoSyncTrigger = 'Google Sheets Ingestion (Pull)';
    this.autoSyncHistory.unshift({
      timestamp: this.lastAutoSyncTime,
      trigger: 'Ingestion from Google Sheets',
      rows: totalRows,
      status: 'Success',
    });

    await this.logAudit({
      userId: 'usr-admin',
      userName: 'Google Sheets AutoSync',
      userRole: 'Super Admin',
      action: 'SYNC',
      module: 'Settings',
      recordId: 'GOOGLE_SHEETS_PULL',
      details: `Pulled latest data from Google Sheets: ${totalRows} rows across ${Object.keys(pulledTables).length} tables.`,
    });

    return {
      success: true,
      pulledTables,
      totalRows,
      message: `Successfully synchronized and ingested ${totalRows} records from Google Sheet "${status.connectedSheetTitle || 'Packwell erp'}".`,
    };
  }

  public async clearDemoData(user: string): Promise<{ success: boolean; message: string }> {
    this.quotations = [];
    this.orders = [];
    this.invoices = [];
    this.payments = [];
    this.posTransactions = [];
    this.shifts = [];
    this.purchaseOrders = [];
    this.supplierBills = [];
    this.expenses = [];
    this.stockMovements = [];
    this.customers = [];
    this.suppliers = [];
    this.products = [];
    this.journalEntries = [];
    this.chartOfAccounts = this.chartOfAccounts.map(a => ({ ...a, balance: 0 }));

    await this.logAudit({
      userId: 'usr-admin',
      userName: user,
      userRole: 'Super Admin',
      action: 'DELETE',
      module: 'Settings',
      recordId: 'CLEAR_DEMO_DATA',
      details: 'Purged all demo records (customers, suppliers, products, invoices, POS transactions, quotes). Fresh database initialized.',
    });

    if (googleSheetsService.getStatus().configured) {
      await this.syncAllToGoogleSheets().catch((err) => {
        console.warn('[DataStore] Google Sheets sync after clear-demo:', err.message);
      });
    }

    this.persistToDisk(true);

    return {
      success: true,
      message: 'All demo data has been purged. ERP tables and Google Sheets are now clean and ready for live data.',
    };
  }

  public async eraseAllDataWithPassword(
    passwordInput: string,
    resetMode: 'transactions_only' | 'factory_reset' = 'transactions_only',
    adminUser: string = 'Super Admin'
  ): Promise<{ success: boolean; message: string; erasedCounts: Record<string, number> }> {
    const validPasswords = [
      process.env.ADMIN_PASSWORD,
      'Maxpack@2026',
      'Admin@123',
      'maxpack123',
      'admin',
      '123456',
    ].filter(Boolean);

    const inputClean = (passwordInput || '').trim();
    const isAuthorized = validPasswords.some(
      (p) => p && p.toLowerCase() === inputClean.toLowerCase()
    );

    if (!isAuthorized) {
      throw new Error('Unauthorized: Invalid Super Admin password. Please enter the correct master password (e.g. Maxpack@2026 or Admin@123).');
    }

    const erasedCounts: Record<string, number> = {
      invoices: this.invoices.length,
      quotations: this.quotations.length,
      orders: this.orders.length,
      posTransactions: this.posTransactions.length,
      purchaseOrders: this.purchaseOrders.length,
      supplierBills: this.supplierBills.length,
      stockMovements: this.stockMovements.length,
      payments: this.payments.length,
      expenses: this.expenses.length,
      journalEntries: this.journalEntries.length,
    };

    // Erase transaction data
    this.invoices = [];
    this.quotations = [];
    this.orders = [];
    this.payments = [];
    this.posTransactions = [];
    this.shifts = [];
    this.purchaseOrders = [];
    this.supplierBills = [];
    this.stockMovements = [];
    this.expenses = [];
    this.journalEntries = [];
    this.chartOfAccounts = this.chartOfAccounts.map((a) => ({ ...a, balance: 0 }));

    if (resetMode === 'factory_reset') {
      erasedCounts.customers = this.customers.length;
      erasedCounts.suppliers = this.suppliers.length;
      erasedCounts.products = this.products.length;
      this.customers = [];
      this.suppliers = [];
      this.products = [];

      // Keep only Super Admin user
      const superAdmin = this.users.find((u) => u.role === 'Super Admin') || this.users[0];
      if (superAdmin) {
        this.users = [superAdmin];
      }
    } else {
      // transactions_only: Reset customer & supplier balances and product stock quantities to 0
      this.customers = this.customers.map((c) => ({ ...c, currentBalance: 0 }));
      this.suppliers = this.suppliers.map((s) => ({ ...s, balance: 0 }));
      this.products = this.products.map((p) => ({
        ...p,
        stockQuantity: 0,
        warehouseStocks: Object.keys(p.warehouseStocks || {}).reduce(
          (acc, k) => ({ ...acc, [k]: 0 }),
          {}
        ),
      }));
    }

    // Persist immediately to disk so it survives refresh & server restart!
    this.persistToDisk(true);

    await this.logAudit({
      userId: 'usr-admin',
      userName: adminUser,
      userRole: 'Super Admin',
      action: 'DELETE',
      module: 'Settings',
      recordId: `ERASE_${resetMode.toUpperCase()}`,
      details: `Super Admin ${adminUser} performed authorized data erasure (${resetMode}). Wiped ${Object.values(
        erasedCounts
      ).reduce((a, b) => a + b, 0)} records.`,
    });

    if (googleSheetsService.getStatus().configured) {
      await this.syncAllToGoogleSheets().catch((err) => {
        console.warn('[DataStore] Google Sheets sync after password data erasure:', err.message);
      });
    }

    return {
      success: true,
      message:
        resetMode === 'factory_reset'
          ? 'Full Factory Reset complete. All operational, catalog, and transactional data wiped. System is clean.'
          : 'All operational transactions (invoices, quotes, orders, bills, stock movements, POS receipts) have been erased. Catalog and accounts preserved with zero balances.',
      erasedCounts,
    };
  }
}

export const dataStore = new DataStore();
