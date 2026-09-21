export type UserRole =
  | 'Super Admin'
  | 'Admin / Manager'
  | 'Salesperson'
  | 'Cashier'
  | 'Accountant'
  | 'Warehouse Staff'
  | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  branch?: string;
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  trn: string; // UAE Tax Registration Number (15 digits)
  address: string;
  emirate: 'Dubai' | 'Abu Dhabi' | 'Sharjah' | 'Ajman' | 'Ras Al Khaimah' | 'Fujairah' | 'Umm Al Quwain';
  creditLimit: number; // in AED
  paymentTerms: 'Immediate / Cash' | 'Net 15 Days' | 'Net 30 Days' | 'Net 45 Days' | 'Net 60 Days' | 'PDC 30 Days';
  currentBalance: number; // in AED
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  trn: string;
  address: string;
  emirate: string;
  paymentTerms: string;
  balance: number; // in AED
  category: string;
  notes?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  emirate: string;
  isDefault: boolean;
  manager: string;
  capacitySqM: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unit: 'Roll' | 'Box' | 'Pcs' | 'Pallet' | 'Kg' | 'Pack' | 'Bundle' | 'Meter';
  costPrice: number; // in AED
  sellingPrice: number; // in AED (excl VAT)
  vatRate: number; // 0.05 default for UAE
  stockQuantity: number;
  reorderLevel: number;
  imageUrl?: string;
  warehouseStocks: Record<string, number>; // warehouseId -> quantity
  description?: string;
  specs?: string; // e.g. "23 Micron, 500mm width, 3kg"
  createdAt: string;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  fromWarehouseName?: string;
  toWarehouseName?: string;
  unitCost: number;
  totalCost: number;
  referenceType: 'PO' | 'INVOICE' | 'POS' | 'MANUAL' | 'TRANSFER' | 'RETURN';
  referenceId: string;
  performedBy: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number; // Excl. VAT
  discount: number; // percentage or fixed
  netAmount: number; // (qty * unitPrice) - discount
  vatRate: number; // 0.05
  vatAmount: number; // netAmount * vatRate
  total: number; // netAmount + vatAmount
}

export interface SalesQuotation {
  id: string;
  quoteNumber: string; // e.g. QT-2026-001
  date: string;
  expiryDate: string;
  customerId: string;
  customerName: string;
  customerTrn: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  deliveryCharge: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Converted' | 'Rejected';
  salespersonId: string;
  salespersonName: string;
  warehouseId: string;
  notes?: string;
  terms?: string;
  convertedToOrderId?: string;
  convertedToInvoiceId?: string;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // e.g. SO-2026-001
  quoteId?: string;
  date: string;
  deliveryDate?: string;
  customerId: string;
  customerName: string;
  customerTrn: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  deliveryCharge: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Dispatched' | 'Invoiced' | 'Cancelled';
  salespersonId: string;
  salespersonName: string;
  warehouseId: string;
  convertedToInvoiceId?: string;
  notes?: string;
  createdAt: string;
}

export interface DeliveryNote {
  id: string;
  dnNumber: string; // e.g. DN-2026-001
  orderId?: string;
  invoiceId?: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  items: {
    productId: string;
    sku: string;
    name: string;
    unit: string;
    quantity: number;
  }[];
  warehouseId: string;
  deliveredBy: string;
  vehicleNo: string;
  status: 'Draft' | 'Dispatched' | 'Delivered' | 'Returned';
  receivedBy?: string;
  notes?: string;
  createdAt: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface SalesInvoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-001 (Sequential UAE Tax Invoice)
  orderId?: string;
  quoteId?: string;
  date: string;
  supplyDate: string; // FTA requirement
  dueDate: string;
  customerId: string;
  customerName: string;
  customerTrn: string;
  customerAddress: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  deliveryCharge: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentTerms: string;
  salespersonId: string;
  salespersonName: string;
  warehouseId: string;
  qrCodeValue?: string; // UAE FTA compliant QR code
  bankDetails?: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. REC-2026-001
  date: string;
  type: 'Customer Receipt' | 'Supplier Payment' | 'Refund';
  invoiceId?: string;
  invoiceNumber?: string;
  billId?: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Cheque' | 'PDC';
  referenceNo?: string; // Cheque or bank transaction ref
  bankAccount: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface POSTransaction {
  id: string;
  receiptNumber: string; // e.g. POS-2026-001
  shiftId: string;
  date: string;
  cashierId: string;
  cashierName: string;
  warehouseId: string;
  customerName: string;
  customerPhone?: string;
  customerTrn?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Split';
  cashTendered?: number;
  changeAmount?: number;
  splitDetails?: {
    cash?: number;
    card?: number;
    bank?: number;
  };
  status: 'Completed' | 'Refunded';
  invoiceId?: string;
  createdAt: string;
}

export interface CashierShift {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  warehouseId: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  closingFloat?: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  totalSales: number;
  totalCard: number;
  totalBank: number;
  transactionCount: number;
  status: 'Open' | 'Closed';
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-001
  supplierId: string;
  supplierName: string;
  supplierTrn: string;
  date: string;
  expectedDeliveryDate: string;
  items: {
    id: string;
    productId: string;
    sku: string;
    name: string;
    unit: string;
    quantity: number;
    receivedQuantity: number;
    unitCost: number;
    vatRate: number;
    vatAmount: number;
    total: number;
  }[];
  subtotal: number;
  vatAmount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
  warehouseId: string;
  notes?: string;
  createdAt: string;
}

export type PurchaseOrderItem = PurchaseOrder['items'][0];
export type PurchaseItem = PurchaseOrderItem;

export interface SupplierBill {
  id: string;
  billNumber: string; // e.g. BILL-2026-001
  poId?: string;
  supplierId: string;
  supplierName: string;
  supplierTrn: string;
  supplierInvoiceNo: string;
  date: string;
  dueDate: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitCost: number;
    vatRate: number;
    vatAmount: number;
    total: number;
  }[];
  subtotal: number;
  vatAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  warehouseId: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: 'Rent & Warehouse' | 'Transportation & Fuel' | 'Utilities' | 'Salaries' | 'Maintenance' | 'Marketing' | 'Packaging Raw Materials' | 'Office Supplies' | 'Bank Charges' | 'Other';
  description: string;
  vendor?: string;
  amount: number; // excl vat
  vatAmount: number;
  total: number;
  paidFromAccount: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque';
  recordedBy: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface ChartOfAccount {
  code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  subcategory: string;
  balance: number;
  currency: 'AED';
  isSystem: boolean;
  description?: string;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // e.g. JV-2026-001
  date: string;
  referenceType: 'INVOICE' | 'PAYMENT' | 'BILL' | 'POS' | 'EXPENSE' | 'STOCK_ADJ' | 'MANUAL';
  referenceId: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'Posted' | 'Draft' | 'Void';
  postedBy: string;
  postedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'POST' | 'CANCEL' | 'SYNC' | 'EXPORT';
  module: 'Sales' | 'Inventory' | 'POS' | 'Accounting' | 'Purchases' | 'Settings' | 'Users';
  recordId: string;
  details: string;
  ipAddress?: string;
}

export interface BusinessSettings {
  companyName: string;
  tradingName: string;
  logoUrl?: string;
  trn: string; // UAE Tax Registration Number
  tradeLicenseNo: string;
  address: string;
  poBox: string;
  city: string;
  emirate: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  currency: 'AED';
  vatRate: number; // 0.05
  timeZone: string; // 'Asia/Dubai'
  invoicePrefix: string;
  quotePrefix: string;
  orderPrefix: string;
  poPrefix: string;
  bankDetails: {
    bankName: string;
    branch: string;
    accountName: string;
    accountNumber: string;
    iban: string;
    swiftCode: string;
  };
  googleSheets: {
    spreadsheetId: string;
    serviceAccountEmail: string;
    status: 'Connected' | 'Not Configured' | 'Error';
    lastSyncTime?: string;
    autoSync: boolean;
    syncIntervalSeconds?: number;
    bidirectionalSync?: boolean;
  };
}

export interface AutoSyncStatus {
  configured: boolean;
  enabled: boolean;
  intervalSeconds: number;
  bidirectional: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastSyncTrigger: string;
  totalSyncedRows: number;
  connectedSheetTitle: string;
  spreadsheetId: string;
  history?: Array<{
    timestamp: string;
    trigger: string;
    rows: number;
    status: 'Success' | 'Warning';
  }>;
}

export interface DashboardStats {
  salesToday: number;
  monthlySales: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesAmount: number;
  receivables: number;
  purchaseCostsMonth: number;
  inventoryValue: number;
  lowStockCount: number;
  topSellingProducts: {
    id: string;
    name: string;
    sku: string;
    soldQty: number;
    revenue: number;
  }[];
  cashSalesMonth: number;
  grossProfitMonth: number;
  netProfitMonth: number;
  salesPerformanceChart: {
    month: string;
    sales: number;
    purchases: number;
  }[];
  salesByCustomerChart: {
    customer: string;
    amount: number;
  }[];
  categoryPerformanceChart: {
    category: string;
    amount: number;
  }[];
  stockMovementChart: {
    date: string;
    inQty: number;
    outQty: number;
  }[];
  paymentMethodsChart: {
    method: string;
    amount: number;
  }[];
}
