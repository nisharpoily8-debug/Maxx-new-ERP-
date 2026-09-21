import {
  BusinessSettings,
  DashboardStats,
  Customer,
  Supplier,
  Product,
  Warehouse,
  StockMovement,
  SalesQuotation,
  SalesOrder,
  SalesInvoice,
  Payment,
  POSTransaction,
  CashierShift,
  PurchaseOrder,
  SupplierBill,
  Expense,
  ChartOfAccount,
  JournalEntry,
  AuditLog,
  User
} from '../types/erp.ts';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const userName = localStorage.getItem('maxpack_active_user') || 'Tariq Al-Mansoor';
  const headers = {
    'Content-Type': 'application/json',
    'x-user-name': userName,
    ...(options?.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `Request failed: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.error || data.message) errMsg = data.error || data.message;
    } catch {
      // fallback
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Settings & Google Sheets
  getSettings: () => request<BusinessSettings>('/settings'),
  updateSettings: (settings: Partial<BusinessSettings>) =>
    request<BusinessSettings>('/settings', { method: 'POST', body: JSON.stringify(settings) }),
  getSheetsStatus: () => request<{
    configured: boolean;
    hasServiceAccount: boolean;
    hasSpreadsheetId: boolean;
    spreadsheetId: string;
    maskedSpreadsheetId?: string;
    serviceAccountEmail: string;
    connectedSheetTitle?: string;
    lastSyncTime?: string | null;
    totalSyncedRows?: number;
    pendingQueueCount?: number;
    quotaCoolingDown?: boolean;
    lastError: string | null;
  }>('/sheets/status'),
  updateSheetsCredentials: (credentials: { spreadsheetId?: string; clientEmail?: string; privateKey?: string }) =>
    request<{ success: boolean; status: any }>('/sheets/credentials', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  testSheetsConnection: (spreadsheetId?: string) =>
    request<{ success: boolean; message: string; sheetNames?: string[] }>('/sheets/test', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId }),
    }),
  initSheetsTemplate: (spreadsheetId?: string) =>
    request<{ success: boolean; createdSheets: string[]; message: string }>('/sheets/init-template', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId }),
    }),
  syncAllToSheets: (spreadsheetId?: string) =>
    request<{ success: boolean; syncedTables: Record<string, number>; totalRows: number; message: string }>('/sheets/sync-all', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId }),
    }),

  // Users & Auth
  getUsers: () => request<User[]>('/users'),
  createUser: (user: { name: string; email: string; role: string; branch?: string }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(user) }),
  loginWithEmail: (credentials: { email: string; name?: string; role?: string; branch?: string }) =>
    request<{ success: boolean; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  // Dashboard
  getDashboardStats: (warehouseId?: string) =>
    request<DashboardStats>(`/dashboard/stats${warehouseId && warehouseId !== 'all' ? `?warehouseId=${warehouseId}` : ''}`),

  // Customers & Suppliers
  getCustomers: () => request<Customer[]>('/customers'),
  createCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'currentBalance'>) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(customer) }),
  updateCustomer: (id: string, updates: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  getSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'balance'>) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(supplier) }),

  // Warehouses & Inventory
  getWarehouses: () => request<Warehouse[]>('/warehouses'),
  getProducts: () => request<Product[]>('/products'),
  createProduct: (product: Omit<Product, 'id' | 'createdAt'>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id: string, updates: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  getStockMovements: () => request<StockMovement[]>('/stock-movements'),
  recordStockMovement: (movement: Omit<StockMovement, 'id' | 'date'>) =>
    request<StockMovement>('/stock-movements', { method: 'POST', body: JSON.stringify(movement) }),

  // Sales Pipeline
  getQuotations: () => request<SalesQuotation[]>('/quotations'),
  createQuotation: (quote: Omit<SalesQuotation, 'id' | 'createdAt' | 'quoteNumber'>) =>
    request<SalesQuotation>('/quotations', { method: 'POST', body: JSON.stringify(quote) }),
  convertQuotationToOrder: (id: string) =>
    request<SalesOrder>(`/quotations/${id}/convert`, { method: 'POST' }),
  convertQuotationToInvoice: (id: string) =>
    request<SalesInvoice>(`/quotations/${id}/convert-invoice`, { method: 'POST' }),
  clearDemoData: () =>
    request<{ success: boolean; message: string }>('/data/clear-demo', { method: 'POST' }),

  getOrders: () => request<SalesOrder[]>('/orders'),
  createOrder: (order: Omit<SalesOrder, 'id' | 'createdAt' | 'orderNumber'>) =>
    request<SalesOrder>('/orders', { method: 'POST', body: JSON.stringify(order) }),
  convertOrderToInvoice: (id: string) =>
    request<SalesInvoice>(`/orders/${id}/convert`, { method: 'POST' }),

  getInvoices: () => request<SalesInvoice[]>('/invoices'),
  createInvoice: (invoice: Omit<SalesInvoice, 'id' | 'createdAt'>) =>
    request<SalesInvoice>('/invoices', { method: 'POST', body: JSON.stringify(invoice) }),
  updateInvoiceStatus: (id: string, status: SalesInvoice['status']) =>
    request<SalesInvoice>(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  recordInvoicePayment: (invoiceId: string, payment: Omit<Payment, 'id' | 'createdAt' | 'paymentNumber'>) =>
    request<{ payment: Payment; invoice: SalesInvoice }>(`/invoices/${invoiceId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payment),
    }),

  // POS
  getPOSTransactions: () => request<POSTransaction[]>('/pos/transactions'),
  createPOSTransaction: (tx: Omit<POSTransaction, 'id' | 'createdAt' | 'receiptNumber'>) =>
    request<POSTransaction>('/pos/transact', { method: 'POST', body: JSON.stringify(tx) }),
  getCurrentShift: (cashierId?: string) =>
    request<CashierShift | null>(`/pos/shift/current${cashierId ? `?cashierId=${cashierId}` : ''}`),
  openShift: (shift: Omit<CashierShift, 'id' | 'transactionCount' | 'totalSales' | 'totalCard' | 'totalBank' | 'status'>) =>
    request<CashierShift>('/pos/shift/open', { method: 'POST', body: JSON.stringify(shift) }),
  closeShift: (shiftId: string, closingFloat: number, actualCash: number, notes: string) =>
    request<CashierShift>('/pos/shift/close', {
      method: 'POST',
      body: JSON.stringify({ shiftId, closingFloat, actualCash, notes }),
    }),

  // Purchases
  getPurchaseOrders: () => request<PurchaseOrder[]>('/purchases/orders'),
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'poNumber'>) =>
    request<PurchaseOrder>('/purchases/orders', { method: 'POST', body: JSON.stringify(po) }),
  receivePurchaseOrder: (id: string) =>
    request<PurchaseOrder>(`/purchases/orders/${id}/receive`, { method: 'POST' }),

  getSupplierBills: () => request<SupplierBill[]>('/purchases/bills'),
  createSupplierBill: (bill: Omit<SupplierBill, 'id' | 'createdAt' | 'billNumber'>) =>
    request<SupplierBill>('/purchases/bills', { method: 'POST', body: JSON.stringify(bill) }),
  paySupplierBill: (billId: string, payment: Omit<Payment, 'id' | 'createdAt' | 'paymentNumber'>) =>
    request<SupplierBill>(`/purchases/bills/${billId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payment),
    }),

  // Accounting
  getChartOfAccounts: () => request<ChartOfAccount[]>('/accounting/chart-of-accounts'),
  getJournalEntries: () => request<JournalEntry[]>('/accounting/journals'),
  postManualJournal: (entry: Omit<JournalEntry, 'id' | 'postedAt' | 'entryNumber' | 'totalDebit' | 'totalCredit'>) =>
    request<JournalEntry>('/accounting/journals/manual', { method: 'POST', body: JSON.stringify(entry) }),
  getExpenses: () => request<Expense[]>('/accounting/expenses'),
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'expenseNumber'>) =>
    request<Expense>('/accounting/expenses', { method: 'POST', body: JSON.stringify(expense) }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
};
