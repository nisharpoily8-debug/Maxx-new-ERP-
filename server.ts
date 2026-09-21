import './server/loadEnv.ts';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { dataStore } from './server/dataLayer.ts';
import { googleSheetsService } from './server/googleSheetsService.ts';

const app = express();
// Port 3000 is required in AI Studio sandbox. In external deployment (such as Hostinger),
// allow the dynamic port provided by Hostinger via process.env.PORT, defaulting to 3000.
const PORT = process.env.APPLET_ID ? 3000 : (Number(process.env.PORT) || 3000);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// API ROUTES FIRST
// ============================================================================

// 1. Health check & Diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Maxpack UAE ERP',
    timestamp: new Date().toISOString(),
    currency: 'AED',
    timeZone: 'Asia/Dubai',
  });
});

// 2. Settings & Google Sheets Integration
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dataStore.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Admin';
    const updated = await dataStore.updateSettings(req.body, user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/sheets/status', (req, res) => {
  const status = googleSheetsService.getStatus();
  res.json(status);
});

app.post('/api/sheets/test', async (req, res) => {
  try {
    const { spreadsheetId } = req.body;
    const result = await googleSheetsService.testConnection(spreadsheetId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sheets/init-template', async (req, res) => {
  try {
    const { spreadsheetId } = req.body;
    if (spreadsheetId) {
      googleSheetsService.setSpreadsheetId(spreadsheetId);
    }
    const result = await googleSheetsService.initializeSheetsTemplate(spreadsheetId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sheets/credentials', async (req, res) => {
  try {
    const { spreadsheetId, clientEmail, privateKey, jsonKey } = req.body || {};
    googleSheetsService.updateCredentials({ spreadsheetId, clientEmail, privateKey, jsonKey });
    const status = googleSheetsService.getStatus();
    if (status.configured) {
      dataStore.triggerAutoSync('Credentials Updated');
    }
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sheets/sync-all', async (req, res) => {
  try {
    const { spreadsheetId } = req.body || {};
    if (spreadsheetId) {
      googleSheetsService.setSpreadsheetId(spreadsheetId);
    }
    const result = await dataStore.syncAllToGoogleSheets();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sheets/pull-all', async (req, res) => {
  try {
    const result = await dataStore.syncAllFromGoogleSheets();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/sheets/auto-sync-status', (req, res) => {
  const status = dataStore.getAutoSyncStatus();
  res.json(status);
});

app.post('/api/sheets/auto-sync-trigger', async (req, res) => {
  try {
    dataStore.triggerAutoSync('Manual trigger from user interface');
    res.json({ success: true, message: 'Auto-sync process initiated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Authentication & Users
app.get('/api/users', async (req, res) => {
  const users = await dataStore.getUsers();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const adminUser = req.headers['x-user-name'] as string || 'Super Admin';
    const { name, email, role, branch } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    const user = await dataStore.createUser({ name, email, role, branch }, adminUser);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const adminUser = req.headers['x-user-name'] as string || 'Super Admin';
    const result = await dataStore.deleteUser(req.params.id, adminUser);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, name, role, branch } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for login.' });
    }
    let user = await dataStore.getUserByEmail(email);
    if (!user) {
      // Auto-register new user or create default profile
      const defaultName = name || email.split('@')[0].replace('.', ' ');
      const capitalizedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      user = await dataStore.createUser(
        {
          name: capitalizedName,
          email: email.trim().toLowerCase(),
          role: role || 'Salesperson',
          branch: branch || 'Dubai Investment Park (DIP)',
        },
        'System Auth'
      );
    }
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId as string;
    const stats = await dataStore.getDashboardStats(warehouseId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Customers & Suppliers
app.get('/api/customers', async (req, res) => {
  const customers = await dataStore.getCustomers();
  res.json(customers);
});

app.post('/api/customers', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Sales Staff';
    const customer = await dataStore.createCustomer(req.body, user);
    res.status(201).json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/customers/:id', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Admin';
    const customer = await dataStore.updateCustomer(req.params.id, req.body, user);
    res.json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/suppliers', async (req, res) => {
  const suppliers = await dataStore.getSuppliers();
  res.json(suppliers);
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Admin';
    const supplier = await dataStore.createSupplier(req.body, user);
    res.status(201).json(supplier);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Warehouses & Inventory
app.get('/api/warehouses', async (req, res) => {
  const warehouses = await dataStore.getWarehouses();
  res.json(warehouses);
});

app.get('/api/products', async (req, res) => {
  const products = await dataStore.getProducts();
  res.json(products);
});

app.get('/api/products/categories', async (req, res) => {
  const categories = await dataStore.getCategories();
  res.json(categories);
});

app.post('/api/products/categories', async (req, res) => {
  try {
    const user = (req.headers['x-user-name'] as string) || 'Manager';
    const { category } = req.body;
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Valid category string is required' });
    }
    const categories = await dataStore.addCategory(category, user);
    res.status(201).json(categories);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/categories/:category', async (req, res) => {
  try {
    const user = (req.headers['x-user-name'] as string) || 'Manager';
    const category = decodeURIComponent(req.params.category);
    const categories = await dataStore.removeCategory(category, user);
    res.json(categories);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Manager';
    const product = await dataStore.createProduct(req.body, user);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/products/:id', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Manager';
    const product = await dataStore.updateProduct(req.params.id, req.body, user);
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/stock-movements', async (req, res) => {
  const movements = await dataStore.getStockMovements();
  res.json(movements);
});

app.post('/api/stock-movements', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Warehouse Staff';
    const movement = await dataStore.recordStockMovement(req.body, user);
    res.status(201).json(movement);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Sales Pipeline (Quotes, Orders, Invoices)
app.get('/api/quotations', async (req, res) => {
  const quotes = await dataStore.getQuotations();
  res.json(quotes);
});

app.post('/api/quotations', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Sales Staff';
    const quote = await dataStore.createQuotation(req.body, user);
    res.status(201).json(quote);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/quotations/:id/convert', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Sales Staff';
    const order = await dataStore.convertQuotationToOrder(req.params.id, user);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/quotations/:id/convert-invoice', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Sales Staff';
    const invoice = await dataStore.convertQuotationToInvoice(req.params.id, user);
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/data/clear-demo', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Super Admin';
    const result = await dataStore.clearDemoData(user);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/erase-all-data', async (req, res) => {
  try {
    const adminUser = (req.headers['x-user-name'] as string) || 'Super Admin';
    const { password, resetMode, confirmationText } = req.body || {};

    if (!password) {
      return res.status(400).json({ success: false, message: 'Super Admin password is required to erase data.' });
    }

    if (confirmationText !== 'CONFIRM ERASE' && confirmationText !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Security safeguard: Please type "CONFIRM ERASE" exactly to authorize data erasure.',
      });
    }

    const result = await dataStore.eraseAllDataWithPassword(password, resetMode, adminUser);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ success: false, message: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  const orders = await dataStore.getOrders();
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Sales Staff';
    const order = await dataStore.createOrder(req.body, user);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/orders/:id/convert', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Sales Staff';
    const invoice = await dataStore.convertOrderToInvoice(req.params.id, user);
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/invoices', async (req, res) => {
  const invoices = await dataStore.getInvoices();
  res.json(invoices);
});

app.post('/api/invoices', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Sales Staff';
    const invoice = await dataStore.createInvoice(req.body, user);
    res.status(201).json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Admin';
    const invoice = await dataStore.updateInvoiceStatus(req.params.id, req.body.status, user);
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/invoices/:id/pay', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Accountant';
    const result = await dataStore.recordInvoicePayment(req.params.id, req.body, user);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. POS (Point of Sale)
app.get('/api/pos/transactions', async (req, res) => {
  const transactions = await dataStore.getPOSTransactions();
  res.json(transactions);
});

app.post('/api/pos/transact', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Cashier';
    const tx = await dataStore.createPOSTransaction(req.body, user);
    res.status(201).json(tx);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/pos/shift/current', async (req, res) => {
  const cashierId = req.query.cashierId as string || 'usr-4';
  const shift = await dataStore.getCurrentShift(cashierId);
  res.json(shift || null);
});

app.post('/api/pos/shift/open', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Cashier';
    const shift = await dataStore.openShift(req.body, user);
    res.status(201).json(shift);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/pos/shift/close', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Cashier';
    const { shiftId, closingFloat, actualCash, notes } = req.body;
    const shift = await dataStore.closeShift(shiftId, closingFloat, actualCash, notes, user);
    res.json(shift);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Purchases & Supplier Bills
app.get('/api/purchases/orders', async (req, res) => {
  const pos = await dataStore.getPurchaseOrders();
  res.json(pos);
});

app.post('/api/purchases/orders', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Manager';
    const po = await dataStore.createPurchaseOrder(req.body, user);
    res.status(201).json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/purchases/orders/:id/receive', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Warehouse Staff';
    const po = await dataStore.receivePurchaseOrder(req.params.id, user);
    res.json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/purchases/bills', async (req, res) => {
  const bills = await dataStore.getSupplierBills();
  res.json(bills);
});

app.post('/api/purchases/bills', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Accountant';
    const bill = await dataStore.createSupplierBill(req.body, user);
    res.status(201).json(bill);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/purchases/bills/:id/pay', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Accountant';
    const bill = await dataStore.paySupplierBill(req.params.id, req.body, user);
    res.json(bill);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 10. Accounting & Ledger
app.get('/api/accounting/chart-of-accounts', async (req, res) => {
  const accounts = await dataStore.getChartOfAccounts();
  res.json(accounts);
});

app.get('/api/accounting/journals', async (req, res) => {
  const entries = await dataStore.getJournalEntries();
  res.json(entries);
});

app.post('/api/accounting/journals/manual', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Accountant';
    const entry = await dataStore.postManualJournalEntry(req.body, user);
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/accounting/expenses', async (req, res) => {
  const expenses = await dataStore.getExpenses();
  res.json(expenses);
});

app.post('/api/accounting/expenses', async (req, res) => {
  try {
    const user = req.headers['x-user-name'] as string || 'Accountant';
    const exp = await dataStore.createExpense(req.body, user);
    res.status(201).json(exp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 11. Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  const logs = await dataStore.getAuditLogs();
  res.json(logs);
});

// ============================================================================
// VITE MIDDLEWARE / STATIC ASSETS
// ============================================================================

async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (typeof __filename !== 'undefined' && __filename.endsWith('.cjs')) ||
    (!process.env.APPLET_ID && fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Look for dist folder in multiple common paths for Hostinger & production servers
    const candidatePaths = [
      path.join(process.cwd(), 'dist'),
      typeof __dirname !== 'undefined' ? __dirname : '',
      typeof __dirname !== 'undefined' ? path.join(__dirname, '..', 'dist') : '',
    ].filter(Boolean);

    let distPath = path.join(process.cwd(), 'dist');
    for (const candidate of candidatePaths) {
      if (fs.existsSync(path.join(candidate, 'index.html'))) {
        distPath = candidate;
        break;
      }
    }

    console.log(`[Production] Serving static SPA frontend from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Production build (index.html) not found. Please run "npm run build".');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Maxpack ERP] Server listening on http://0.0.0.0:${PORT}`);

    // Automatic initial sync to Google Sheets on server startup if configured
    setTimeout(async () => {
      if (googleSheetsService.getStatus().configured) {
        console.log('[AutoSync] Google Sheets is configured. Executing initial synchronization...');
        try {
          const res = await dataStore.syncAllToGoogleSheets();
          console.log('[AutoSync] Initial sync completed successfully:', res.message);
        } catch (err: any) {
          console.warn('[AutoSync] Initial sync note:', err.message);
        }
      }
    }, 3000);

    // Periodic automatic synchronization every 3 minutes if autoSync is active
    setInterval(async () => {
      try {
        const settings = await dataStore.getSettings();
        if (settings.googleSheets?.autoSync && googleSheetsService.getStatus().configured) {
          const res = await dataStore.syncAllToGoogleSheets();
          console.log(`[AutoSync] Background sync updated ${res.totalRows} records in Google Sheets.`);
        }
      } catch (err: any) {
        console.warn('[AutoSync] Periodic background sync note:', err.message);
      }
    }, 3 * 60 * 1000);
  });
}

startServer();
