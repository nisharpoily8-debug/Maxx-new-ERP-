/**
 * Google Sheets Schema Definitions for Maxpack UAE ERP
 * Defines standard sheet tab names and column headers for all 23 database tables.
 */

export interface SheetDefinition {
  title: string;
  headers: string[];
  description: string;
}

export const ERP_SHEETS_SCHEMA: Record<string, SheetDefinition> = {
  users: {
    title: 'Users',
    headers: ['id', 'name', 'email', 'role', 'phone', 'branch', 'active', 'createdAt'],
    description: 'System user accounts, credentials, and associated branches'
  },
  roles: {
    title: 'Roles',
    headers: ['roleName', 'permissions', 'description', 'updatedAt'],
    description: 'Role-based access permissions definitions'
  },
  customers: {
    title: 'Customers',
    headers: ['id', 'companyName', 'contactPerson', 'phone', 'email', 'trn', 'address', 'emirate', 'creditLimit', 'paymentTerms', 'currentBalance', 'notes', 'createdAt'],
    description: 'UAE B2B and retail packaging clients with TRN and credit terms'
  },
  suppliers: {
    title: 'Suppliers',
    headers: ['id', 'name', 'contactPerson', 'phone', 'email', 'trn', 'address', 'emirate', 'paymentTerms', 'balance', 'category', 'notes', 'createdAt'],
    description: 'Raw material mills, polymer manufacturers, and machinery vendors'
  },
  products: {
    title: 'Products',
    headers: ['id', 'sku', 'barcode', 'name', 'category', 'unit', 'costPrice', 'sellingPrice', 'vatRate', 'stockQuantity', 'reorderLevel', 'specs', 'createdAt'],
    description: 'Packaging products catalog with pricing, barcode, and VAT'
  },
  categories: {
    title: 'Categories',
    headers: ['id', 'name', 'description'],
    description: 'Packaging product categories (Cartons, Films, Tapes, Strapping, etc.)'
  },
  warehouses: {
    title: 'Warehouses',
    headers: ['id', 'code', 'name', 'location', 'emirate', 'isDefault', 'manager', 'capacitySqM'],
    description: 'Physical storage locations across Dubai & Sharjah'
  },
  stockMovements: {
    title: 'Stock Movements',
    headers: ['id', 'date', 'productId', 'productName', 'sku', 'type', 'quantity', 'fromWarehouseId', 'toWarehouseId', 'unitCost', 'totalCost', 'referenceType', 'referenceId', 'performedBy', 'notes'],
    description: 'Immutable inventory transaction ledger (In, Out, Transfer, Adj, Damage)'
  },
  salesQuotations: {
    title: 'Sales Quotations',
    headers: ['id', 'quoteNumber', 'date', 'expiryDate', 'customerId', 'customerName', 'customerTrn', 'subtotal', 'discount', 'vatAmount', 'deliveryCharge', 'total', 'status', 'salespersonName', 'warehouseId', 'notes', 'createdAt'],
    description: 'Formal packaging quotations issued to clients'
  },
  salesOrders: {
    title: 'Sales Orders',
    headers: ['id', 'orderNumber', 'quoteId', 'date', 'deliveryDate', 'customerId', 'customerName', 'customerTrn', 'subtotal', 'discount', 'vatAmount', 'deliveryCharge', 'total', 'status', 'salespersonName', 'warehouseId', 'notes', 'createdAt'],
    description: 'Confirmed sales orders awaiting fulfillment or invoicing'
  },
  salesInvoices: {
    title: 'Sales Invoices',
    headers: ['id', 'invoiceNumber', 'orderId', 'date', 'supplyDate', 'dueDate', 'customerId', 'customerName', 'customerTrn', 'customerAddress', 'customerPhone', 'subtotal', 'discount', 'vatAmount', 'deliveryCharge', 'total', 'paidAmount', 'balanceDue', 'status', 'paymentTerms', 'salespersonName', 'warehouseId', 'createdAt'],
    description: 'Sequential UAE FTA Tax Invoices with 5% VAT'
  },
  invoiceItems: {
    title: 'Invoice Items',
    headers: ['id', 'invoiceId', 'productId', 'sku', 'name', 'unit', 'quantity', 'unitPrice', 'discount', 'netAmount', 'vatRate', 'vatAmount', 'total'],
    description: 'Line item breakdown for sales invoices and orders'
  },
  payments: {
    title: 'Payments',
    headers: ['id', 'paymentNumber', 'date', 'type', 'invoiceId', 'customerId', 'customerName', 'amount', 'paymentMethod', 'referenceNo', 'bankAccount', 'recordedBy', 'notes', 'createdAt'],
    description: 'Customer payment receipts, PDC cheques, and supplier payments'
  },
  posTransactions: {
    title: 'POS Transactions',
    headers: ['id', 'receiptNumber', 'shiftId', 'date', 'cashierName', 'customerName', 'subtotal', 'discount', 'vatAmount', 'total', 'paymentMethod', 'cashTendered', 'changeAmount', 'status', 'createdAt'],
    description: 'Fast cashier counter sales at Maxpack showroom'
  },
  purchaseOrders: {
    title: 'Purchase Orders',
    headers: ['id', 'poNumber', 'supplierId', 'supplierName', 'supplierTrn', 'date', 'expectedDeliveryDate', 'subtotal', 'vatAmount', 'total', 'status', 'warehouseId', 'notes', 'createdAt'],
    description: 'Raw material and stock purchase orders sent to vendors'
  },
  purchaseOrderItems: {
    title: 'Purchase Order Items',
    headers: ['id', 'poId', 'productId', 'sku', 'name', 'quantity', 'receivedQuantity', 'unitCost', 'vatRate', 'vatAmount', 'total'],
    description: 'Line items for purchase orders'
  },
  supplierBills: {
    title: 'Supplier Bills',
    headers: ['id', 'billNumber', 'poId', 'supplierId', 'supplierName', 'supplierTrn', 'supplierInvoiceNo', 'date', 'dueDate', 'subtotal', 'vatAmount', 'total', 'paidAmount', 'balanceDue', 'status', 'warehouseId', 'createdAt'],
    description: 'Accounts payable vendor tax invoices'
  },
  expenses: {
    title: 'Expenses',
    headers: ['id', 'expenseNumber', 'date', 'category', 'description', 'vendor', 'amount', 'vatAmount', 'total', 'paidFromAccount', 'paymentMethod', 'recordedBy', 'createdAt'],
    description: 'Operational expenses (rent, diesel, logistics, utilities, maintenance)'
  },
  chartOfAccounts: {
    title: 'Chart of Accounts',
    headers: ['code', 'name', 'category', 'subcategory', 'balance', 'currency', 'isSystem', 'description'],
    description: 'UAE commercial general ledger chart of accounts'
  },
  journalEntries: {
    title: 'Journal Entries',
    headers: ['id', 'entryNumber', 'date', 'referenceType', 'referenceId', 'description', 'totalDebit', 'totalCredit', 'status', 'postedBy', 'postedAt'],
    description: 'Balanced financial journal entries with strict debit/credit equality'
  },
  journalEntryLines: {
    title: 'Journal Entry Lines',
    headers: ['id', 'journalId', 'accountCode', 'accountName', 'description', 'debit', 'credit'],
    description: 'Debit and credit transaction lines'
  },
  settings: {
    title: 'Settings',
    headers: ['key', 'value', 'updatedAt', 'updatedBy'],
    description: 'Global business settings, TRN, bank accounts, and configurations'
  },
  auditLogs: {
    title: 'Audit Logs',
    headers: ['id', 'timestamp', 'userName', 'userRole', 'action', 'module', 'recordId', 'details'],
    description: 'Immutable security audit trail for all business events'
  }
};
