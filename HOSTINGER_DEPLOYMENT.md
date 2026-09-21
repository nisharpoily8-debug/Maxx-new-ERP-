# Hostinger Deployment Guide - Maxpack UAE ERP

This guide provides step-by-step instructions to successfully deploy this application to **Hostinger**.

---

## Option 1: Hostinger Node.js Application (Recommended - Full Stack)

Use this method if you have Hostinger Cloud Hosting, Business Web Hosting with Node.js support, or Hostinger VPS.

### Step 1: Upload or Connect the Repository
1. In Hostinger **hPanel**, go to **Advanced** → **Node.js** (or use **Git** to clone your GitHub repository).
2. If uploading manually via **File Manager**:
   - Upload all files from this project (including `package.json`, `server.js`, `app.js`, `server.ts`, `src/`, and `dist/`).
   - Extract into your domain's folder (e.g. `public_html` or a dedicated app directory).

### Step 2: Configure Node.js in Hostinger hPanel
Set the following options in the Hostinger Node.js configuration panel:
* **Node.js Version**: Select **20.x** (or **22.x**, or **18.x**).
* **Application Mode**: Select **Production**.
* **Application Root**: `public_html` (or your chosen subdirectory).
* **Application Startup File**: `server.js` (or `app.js`).
* **Application URL**: Your domain (e.g., `https://yourdomain.com`).

### Step 3: Run NPM Install & Build
1. In the Hostinger Node.js panel, click **"Run NPM Install"** (or in SSH run `npm install`).
2. The `package.json` includes `"postinstall": "npm run build"`, which automatically compiles the Vite frontend and the bundled backend (`dist/server.cjs`).
3. Furthermore, `server.js` and `app.js` are configured with an **automatic self-build fallback**: if `dist/server.cjs` is ever missing, it will automatically build before starting.

### Step 4: Environment Variables (Optional / Google Sheets & Firebase)
In Hostinger hPanel or via `.env` file in the application root, configure:
* `NODE_ENV=production`
* `GOOGLE_SHEETS_SPREADSHEET_ID=` (your Google Sheet ID)
* `GOOGLE_SERVICE_ACCOUNT_EMAIL=` (your Google Cloud service account)
* `GOOGLE_PRIVATE_KEY=` (your service account private key)

### Step 5: Start the Application
Click **"Start Application"** or **"Restart"** in the Hostinger hPanel. Your ERP will be live!

---

## Option 2: Hostinger Shared Web Hosting (Static SPA via `public_html`)

If you have standard Hostinger Shared Hosting (Apache / LiteSpeed) and want to host the frontend:

1. Run `npm run build` locally on your computer or export the `dist/` directory.
2. Open Hostinger **File Manager** and navigate to `public_html`.
3. Upload all contents of the `dist/` folder into `public_html`.
4. The `.htaccess` file is automatically included in `dist/.htaccess` and handles:
   - React Single Page Application (SPA) client-side routing (prevents 404 on page refresh).
   - Gzip and Brotli compression.
   - Long-term caching for static assets with instant cache invalidation for `index.html`.
