import {
  User,
  Customer,
  Supplier,
  Warehouse,
  Product,
  ChartOfAccount,
  BusinessSettings,
  SalesInvoice,
  SalesQuotation,
  SalesOrder,
  POSTransaction,
  PurchaseOrder,
  SupplierBill,
  StockMovement,
  JournalEntry,
  CashierShift,
  AuditLog
} from '../src/types/erp.ts';

export const INITIAL_SETTINGS: BusinessSettings = {
  companyName: 'Maxpack Packaging LLC',
  tradingName: 'Maxpack UAE',
  logoUrl: '',
  trn: '100234857600003',
  tradeLicenseNo: 'CN-849201',
  address: 'Plot 598-112, Street 22, Dubai Investment Park 1',
  poBox: 'PO Box 84920',
  city: 'Dubai',
  emirate: 'Dubai',
  country: 'United Arab Emirates',
  phone: '+971 4 885 9100',
  mobile: '+971 50 123 4567',
  email: 'sales@maxpack.ae',
  website: 'https://maxpack.ae',
  currency: 'AED',
  vatRate: 0.05,
  timeZone: 'Asia/Dubai',
  invoicePrefix: 'INV-2026-',
  quotePrefix: 'QT-2026-',
  orderPrefix: 'SO-2026-',
  poPrefix: 'PO-2026-',
  bankDetails: {
    bankName: 'Emirates NBD',
    branch: 'DIP Industrial Branch',
    accountName: 'Maxpack Packaging LLC',
    accountNumber: '1029384756',
    iban: 'AE240260001029384756001',
    swiftCode: 'EBILAEADXXX',
  },
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'maxpack-erp-sa@project.iam.gserviceaccount.com',
    status: 'Connected',
    lastSyncTime: new Date().toISOString(),
    autoSync: true,
  }
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-owner',
    name: 'Nishar (Super Admin)',
    email: 'nisharpoily8@gmail.com',
    role: 'Super Admin',
    phone: '+971 50 123 4567',
    branch: 'DIP Central',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-1',
    name: 'Tariq Al-Mansoor',
    email: 'tariq@maxpack.ae',
    role: 'Super Admin',
    phone: '+971 50 987 6543',
    branch: 'DIP Central',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-2',
    name: 'Rashid Khan',
    email: 'rashid.ops@maxpack.ae',
    role: 'Admin / Manager',
    phone: '+971 52 345 6789',
    branch: 'DIP Central',
    active: true,
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    id: 'usr-3',
    name: 'Fatima Zahra',
    email: 'fatima.sales@maxpack.ae',
    role: 'Salesperson',
    phone: '+971 55 456 7890',
    branch: 'Al Quoz Branch',
    active: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr-4',
    name: 'Zayan Ahmed',
    email: 'zayan.pos@maxpack.ae',
    role: 'Cashier',
    phone: '+971 56 567 8901',
    branch: 'DIP Showroom',
    active: true,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'usr-5',
    name: 'Nisha Pillai',
    email: 'nisha.accounts@maxpack.ae',
    role: 'Accountant',
    phone: '+971 54 678 9012',
    branch: 'DIP Central',
    active: true,
    createdAt: '2026-01-20T08:00:00Z',
  },
  {
    id: 'usr-6',
    name: 'Bilal Qureshi',
    email: 'bilal.wh@maxpack.ae',
    role: 'Warehouse Staff',
    phone: '+971 50 789 0123',
    branch: 'DIP Central',
    active: true,
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'usr-7',
    name: 'Salem Al-Nuaimi',
    email: 'salem.audit@maxpack.ae',
    role: 'Viewer',
    phone: '+971 52 890 1234',
    branch: 'All Branches',
    active: true,
    createdAt: '2026-02-15T08:00:00Z',
  }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    code: 'WH-DIP',
    name: 'DIP Central Warehouse',
    location: 'Plot 598-112, Street 22, Dubai Investment Park 1',
    emirate: 'Dubai',
    isDefault: true,
    manager: 'Bilal Qureshi',
    capacitySqM: 4500,
  },
  {
    id: 'wh-2',
    code: 'WH-ALQ',
    name: 'Al Quoz Logistics Hub',
    location: 'Warehouse 8, Al Asayel Street, Al Quoz 3',
    emirate: 'Dubai',
    isDefault: false,
    manager: 'Farhan Siddiqui',
    capacitySqM: 1800,
  },
  {
    id: 'wh-3',
    code: 'WH-SHJ',
    name: 'Sharjah Industrial 13 Facility',
    location: 'Industrial Area 13, Near National Paints',
    emirate: 'Sharjah',
    isDefault: false,
    manager: 'Waleed Mustafa',
    capacitySqM: 2200,
  }
];

export const INITIAL_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  // Assets (1000-1999)
  { code: '1010', name: 'Cash on Hand - Showroom POS', category: 'Asset', subcategory: 'Cash & Cash Equivalents', balance: 0.00, currency: 'AED', isSystem: true, description: 'Physical cash held in showroom till' },
  { code: '1020', name: 'Emirates NBD Main Operating (AED)', category: 'Asset', subcategory: 'Bank Accounts', balance: 0.00, currency: 'AED', isSystem: true, description: 'Primary commercial bank account' },
  { code: '1030', name: 'Card & POS Settlement Clearing', category: 'Asset', subcategory: 'Bank Accounts', balance: 0.00, currency: 'AED', isSystem: true, description: 'Network payments awaiting daily bank credit' },
  { code: '1100', name: 'Accounts Receivable (Trade Debtors)', category: 'Asset', subcategory: 'Current Assets', balance: 0.00, currency: 'AED', isSystem: true, description: 'Amounts due from corporate packaging clients' },
  { code: '1200', name: 'Inventory Asset (Packaging Goods)', category: 'Asset', subcategory: 'Current Assets', balance: 0.00, currency: 'AED', isSystem: true, description: 'Value of warehouse finished goods at cost' },
  { code: '1300', name: 'Prepaid Rent & Security Deposits', category: 'Asset', subcategory: 'Current Assets', balance: 0.00, currency: 'AED', isSystem: false, description: 'DIP warehouse rental deposits' },
  { code: '1500', name: 'Warehouse Equipment & Forklifts', category: 'Asset', subcategory: 'Fixed Assets', balance: 0.00, currency: 'AED', isSystem: false, description: 'Material handling equipment' },

  // Liabilities (2000-2999)
  { code: '2000', name: 'Accounts Payable (Trade Creditors)', category: 'Liability', subcategory: 'Current Liabilities', balance: 0.00, currency: 'AED', isSystem: true, description: 'Amounts owed to paper and resin suppliers' },
  { code: '2100', name: 'Output VAT 5% (FTA Payable)', category: 'Liability', subcategory: 'Tax Liabilities', balance: 0.00, currency: 'AED', isSystem: true, description: 'VAT collected on UAE sales to be paid to FTA' },
  { code: '2110', name: 'Input VAT 5% (FTA Recoverable)', category: 'Liability', subcategory: 'Tax Liabilities', balance: 0.00, currency: 'AED', isSystem: true, description: 'VAT paid on purchases to be reclaimed from FTA' },
  { code: '2200', name: 'Accrued Salaries & End of Service', category: 'Liability', subcategory: 'Current Liabilities', balance: 0.00, currency: 'AED', isSystem: false, description: 'Employee gratuity and accrued payroll' },

  // Equity (3000-3999)
  { code: '3000', name: 'Shareholder Capital', category: 'Equity', subcategory: 'Capital', balance: 0.00, currency: 'AED', isSystem: true, description: 'Paid-up share capital' },
  { code: '3100', name: 'Retained Earnings', category: 'Equity', subcategory: 'Reserves', balance: 0.00, currency: 'AED', isSystem: true, description: 'Accumulated profits from prior years' },

  // Revenue (4000-4999)
  { code: '4000', name: 'Commercial Packaging Sales', category: 'Revenue', subcategory: 'Operating Revenue', balance: 0.00, currency: 'AED', isSystem: true, description: 'B2B invoiced carton, film, and tape sales' },
  { code: '4010', name: 'POS Showroom Counter Sales', category: 'Revenue', subcategory: 'Operating Revenue', balance: 0.00, currency: 'AED', isSystem: true, description: 'Direct walk-in customer retail sales' },
  { code: '4020', name: 'Delivery & Logistics Revenue', category: 'Revenue', subcategory: 'Other Revenue', balance: 0.00, currency: 'AED', isSystem: false, description: 'Charges for truck delivery to client premises' },

  // Expenses (5000-6999)
  { code: '5000', name: 'Cost of Goods Sold (COGS)', category: 'Expense', subcategory: 'Cost of Sales', balance: 0.00, currency: 'AED', isSystem: true, description: 'Direct packaging material procurement cost' },
  { code: '6010', name: 'Warehouse & Facility Rent', category: 'Expense', subcategory: 'Operating Expenses', balance: 0.00, currency: 'AED', isSystem: false, description: 'DIP and Al Quoz warehouse lease' },
  { code: '6020', name: 'Salaries & Staff Benefits', category: 'Expense', subcategory: 'Operating Expenses', balance: 0.00, currency: 'AED', isSystem: false, description: 'Monthly payroll' },
  { code: '6030', name: 'Logistics, Fuel & Fleet Maintenance', category: 'Expense', subcategory: 'Operating Expenses', balance: 0.00, currency: 'AED', isSystem: false, description: 'Delivery truck diesel and servicing' },
  { code: '6040', name: 'Utilities (DEWA / SEWA / Telecom)', category: 'Expense', subcategory: 'Operating Expenses', balance: 0.00, currency: 'AED', isSystem: false, description: 'Electricity, water, and internet' },
  { code: '6050', name: 'Bank Charges & POS Commission', category: 'Expense', subcategory: 'Administrative', balance: 0.00, currency: 'AED', isSystem: false, description: 'Card interchange fees and bank charges' },
];

// Clean Zero Demo Records - Ready for live operations
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_INVOICES: SalesInvoice[] = [];
export const INITIAL_QUOTATIONS: SalesQuotation[] = [];
export const INITIAL_ORDERS: SalesOrder[] = [];
export const INITIAL_POS_TRANSACTIONS: POSTransaction[] = [];
export const INITIAL_SHIFTS: CashierShift[] = [];
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const INITIAL_SUPPLIER_BILLS: SupplierBill[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
