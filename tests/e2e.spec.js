// OCP Panel E2E Tests — Playwright
// Run: npx playwright test tests/e2e.spec.js

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://192.168.1.2:2083';
const PASSWORD = process.env.OCP_PASSWORD || '9952f52f';
const USERNAME = 'admin';

test.describe.configure({ retries: 1 });

test.describe('OCP Panel — Full E2E Suite', () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 900 }
    });
    page = await context.newPage();
    
    // Console error tracking
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));
    test.errors = errors;
  });

  test.afterAll(async () => {
    await context.close();
  });

  // --- Helper: login ---
  async function login() {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    // If login overlay visible, login
    const overlay = page.locator('#loginOverlay');
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.fill('#loginPass', PASSWORD);
      await page.click('#loginBtn');
      await page.waitForSelector('#loginOverlay', { state: 'hidden' });
      await page.waitForSelector('.x3-tool-item', { state: 'visible', timeout: 10000 });
    }
    // Verify dashboard
    await expect(page.locator('.x3-tool-item').first()).toBeVisible();
  }

  // --- Helper: logout ---
  async function logout() {
    await page.click('a[onclick*="logout"]');
    await page.waitForSelector('#loginOverlay', { state: 'visible', timeout: 5000 });
  }

  // --- Helper: open tool via sidebar ---
  async function openTool(actionName, categoryTitle = null) {
    // Find and click tool in sidebar
    const toolLink = page.locator(`a[onclick*="openTool('${actionName}')"]`).first();
    await expect(toolLink).toBeVisible({ timeout: 5000 });
    await toolLink.click();
    // Wait for subpage to load
    await page.waitForSelector('.subpage-container', { state: 'visible', timeout: 10000 });
    // Verify breadcrumb shows the tool
    await expect(page.locator('.breadcrumb-bar strong')).toBeVisible();
  }

  // --- Helper: open WHM tool ---
  async function openWhmTool(actionName) {
    return openTool(actionName, 'WHM');
  }

  test('1. Login with valid credentials', async () => {
    await login();
    // Dashboard should have tool grid (verified in login helper)
    await expect(page.locator('.x3-tool-item').first()).toBeVisible();
  });

  test('2. Dashboard loads with stats', async () => {
    // Stats are loaded by updateStats() after login
    await page.waitForTimeout(2000); // wait for stats API call
    await expect(page.locator('#statDisk')).not.toContainText('…');
    await expect(page.locator('#statBandwidth')).not.toContainText('…');
    await expect(page.locator('#statEmails')).not.toContainText('…');
  });

  // --- WHM / Home ---
  test.describe('WHM > Home', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Server Status', async () => {
      await openWhmTool('serverStatus');
      await expect(page.locator('#ssBody')).toBeVisible();
      await expect(page.locator('#ssBody')).toContainText('CPU Kullanımı');
      await expect(page.locator('#ssBody')).toContainText('RAM');
      await expect(page.locator('#ssBody')).toContainText('Disk');
    });

    test('Live Monitor (SSE)', async () => {
      await openWhmTool('liveMonitor');
      await expect(page.locator('#lmCanvasCpu')).toBeVisible();
      await expect(page.locator('#lmCanvasRam')).toBeVisible();
      // Wait for SSE data
      await page.waitForTimeout(3000);
      await expect(page.locator('#lmCpuVal')).not.toContainText('—');
      await expect(page.locator('#lmRamVal')).not.toContainText('—');
    });

    test('Services', async () => {
      await openWhmTool('services');
      await expect(page.locator('#svcBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#svcBody table')).toBeVisible();
    });

    test('Network Interfaces', async () => {
      await openWhmTool('network');
      await expect(page.locator('#netBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#netBody .x3-form-box')).toHaveCountGreaterThan(0);
    });

    test('System Users', async () => {
      await openWhmTool('systemUsers');
      await expect(page.locator('#suBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#suBody table')).toBeVisible();
    });

    test('Docker Manager', async () => {
      await openWhmTool('dockerManager');
      await expect(page.locator('#dmBody')).toBeVisible();
      await page.waitForTimeout(3000);
      await expect(page.locator('#dmBody')).toBeVisible();
    });

    test('Backup Manager', async () => {
      await openWhmTool('backupManager');
      await expect(page.locator('#bmBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#bmBody')).toBeVisible();
    });
  });

  // --- WHM / Account Functions ---
  test.describe('WHM > Account Functions', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Create a New Account', async () => {
      await openWhmTool('createAccount');
      await expect(page.locator('#caBody')).toBeVisible();
      await expect(page.locator('#caBody form')).toBeVisible();
    });

    test('List Accounts', async () => {
      await openWhmTool('listAccounts');
      await expect(page.locator('#laBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#laBody table')).toBeVisible();
    });

    test('Modify an Account', async () => {
      await openWhmTool('modifyAccount');
      await expect(page.locator('#maBody')).toBeVisible();
    });

    test('Terminate an Account', async () => {
      await openWhmTool('terminateAccount');
      await expect(page.locator('#taBody')).toBeVisible();
    });
  });

  // --- WHM / Packages ---
  test.describe('WHM > Packages', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Add a Package', async () => {
      await openWhmTool('addPackage');
      await expect(page.locator('#apBody')).toBeVisible();
      await expect(page.locator('#apBody form')).toBeVisible();
    });

    test('Edit a Package', async () => {
      await openWhmTool('editPackage');
      await expect(page.locator('#epBody')).toBeVisible();
    });

    test('Delete a Package', async () => {
      await openWhmTool('deletePackage');
      await expect(page.locator('#dpBody')).toBeVisible();
    });

    test('List Packages', async () => {
      await openWhmTool('listPackages');
      await expect(page.locator('#lpBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#lpBody table')).toBeVisible();
    });
  });

  // --- WHM / Resellers ---
  test.describe('WHM > Resellers', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Reseller Center', async () => {
      await openWhmTool('resellerCenter');
      await expect(page.locator('#rcBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#rcBody table')).toBeVisible();
    });

    test('Create a Reseller', async () => {
      await openWhmTool('createReseller');
      await expect(page.locator('#crBody')).toBeVisible();
      await expect(page.locator('#crBody form')).toBeVisible();
    });

    test('Reseller Modification', async () => {
      await openWhmTool('resellerModification');
      await expect(page.locator('#rmBody')).toBeVisible();
    });

    test('Terminate a Reseller', async () => {
      await openWhmTool('terminateReseller');
      await expect(page.locator('#trBody')).toBeVisible();
    });
  });

  // --- WHM / DNS Functions ---
  test.describe('WHM > DNS Functions', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('DNS Zone Manager', async () => {
      await openWhmTool('dnsZoneManager');
      await expect(page.locator('#dzmBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#dzmBody table')).toBeVisible();
    });

    test('Add a DNS Zone', async () => {
      await openWhmTool('addDnsZone');
      await expect(page.locator('#adzBody')).toBeVisible();
      await expect(page.locator('#adzBody form')).toBeVisible();
    });

    test('Edit DNS Zone', async () => {
      await openWhmTool('editDnsZone');
      await expect(page.locator('#edzBody')).toBeVisible();
    });
  });

  // --- WHM / Email Functions ---
  test.describe('WHM > Email Functions', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Email Accounts', async () => {
      await openWhmTool('whmEmails');
      await expect(page.locator('#weBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#weBody table')).toBeVisible();
    });

    test('Create an Email Account', async () => {
      await openWhmTool('whmEmailCreate');
      await expect(page.locator('#wecBody')).toBeVisible();
      await expect(page.locator('#wecBody form')).toBeVisible();
    });

    test('Modify Email Account', async () => {
      await openWhmTool('whmEmailModify');
      await expect(page.locator('#wemBody')).toBeVisible();
    });

    test('Delete Email Account', async () => {
      await openWhmTool('whmEmailDelete');
      await expect(page.locator('#wedBody')).toBeVisible();
    });

    test('Email Disk Usage', async () => {
      await openWhmTool('whmEmailDisk');
      await expect(page.locator('#wedBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#wedBody table')).toBeVisible();
    });
  });

  // --- WHM / FTP Functions ---
  test.describe('WHM > FTP Functions', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('FTP Accounts', async () => {
      await openWhmTool('whmFtp');
      await expect(page.locator('#wfBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#wfBody table')).toBeVisible();
    });

    test('Create FTP Account', async () => {
      await openWhmTool('whmFtpCreate');
      await expect(page.locator('#wfcBody')).toBeVisible();
      await expect(page.locator('#wfcBody form')).toBeVisible();
    });

    test('Modify FTP Account', async () => {
      await openWhmTool('whmFtpModify');
      await expect(page.locator('#wfmBody')).toBeVisible();
    });

    test('Delete FTP Account', async () => {
      await openWhmTool('whmFtpDelete');
      await expect(page.locator('#wfdBody')).toBeVisible();
    });

    test('FTP Connections', async () => {
      await openWhmTool('whmFtpConnections');
      await expect(page.locator('#wfcnBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#wfcnBody table')).toBeVisible();
    });
  });

  // --- System Modules ---
  test.describe('System Modules', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Terminal', async () => {
      await openTool('terminal');
      await expect(page.locator('#termBody')).toBeVisible();
      await expect(page.locator('#termInput')).toBeVisible();
      // Test command
      await page.fill('#termInput', 'echo test123');
      await page.click('#termBtn');
      await page.waitForTimeout(2000);
      await expect(page.locator('#termOutput')).toContainText('test123');
    });

    test('File Manager', async () => {
      await openTool('fileManager');
      await expect(page.locator('#fmBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#fmBody table')).toBeVisible();
    });

    test('Process Manager', async () => {
      await openTool('processes');
      await expect(page.locator('#pmBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#pmBody table')).toBeVisible();
    });

    test('Cron Jobs', async () => {
      await openTool('cron');
      await expect(page.locator('#cronBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#cronBody')).toBeVisible();
    });

    test('Error Logs', async () => {
      await openTool('logs');
      await expect(page.locator('#logsBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#logsBody')).toBeVisible();
    });

    test('Disk Usage', async () => {
      await openTool('diskUsage');
      await expect(page.locator('#duBody')).toBeVisible();
      await page.waitForTimeout(3000);
      await expect(page.locator('#duBody')).toBeVisible();
    });

    test('MySQL', async () => {
      await openTool('mysql');
      await expect(page.locator('#mysqlBody')).toBeVisible();
      await page.waitForTimeout(2000);
      await expect(page.locator('#mysqlBody')).toBeVisible();
    });

    test('Resource Usage', async () => {
      await openTool('resourceUsage');
      await expect(page.locator('#ruBody')).toBeVisible();
    });

    test('CPU/Concurrent', async () => {
      await openTool('cpuConcurrent');
      await expect(page.locator('#ccBody')).toBeVisible();
    });

    test('Visitors', async () => {
      await openTool('visitors');
      await expect(page.locator('#visBody')).toBeVisible();
    });

    test('Bandwidth', async () => {
      await openTool('bandwidth');
      await expect(page.locator('#bwBody')).toBeVisible();
    });
  });

  // --- cPanel Simulation Modules (Preferences, Mail, Files, etc.) ---
  test.describe('cPanel Simulation Modules', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Change Password', async () => {
      await openTool('changePassword');
      await expect(page.locator('#mainContentArea')).toContainText('Change Password');
    });

    test('Webmail button exists', async () => {
      await openTool('webmail');
      // Webmail opens in new tab — just verify link/button exists
      await expect(page.locator('#mainContentArea')).toContainText('Webmail');
    });
  });

  // --- Switch Account / Domain ---
  test.describe('Switch Account & Domain', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Switch Account dropdown loads resellers', async () => {
      const select = page.locator('#switchAccountSelect');
      await expect(select).toBeVisible();
      await expect(select).toBeEnabled();
      // Should have at least root option
      const options = await select.locator('option').all();
      expect(options.length).toBeGreaterThan(0);
    });

    test('Switch Domain dropdown enables after reseller select', async () => {
      const domainSelect = page.locator('#switchDomainSelect');
      // Initially disabled
      await expect(domainSelect).toBeDisabled();
      // Select a reseller if available
      const accountSelect = page.locator('#switchAccountSelect');
      const options = await accountSelect.locator('option').all();
      if (options.length > 1) {
        await accountSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        await expect(domainSelect).toBeEnabled();
      }
    });
  });

  // --- Refresh persistence test (critical bug fix) ---
  test.describe('Session Persistence (Refresh Bug Fix)', () => {
    test.beforeEach(async () => {
      await login();
    });

    test.afterEach(async () => {
      await logout();
    });

    test('Page refresh keeps user logged in', async () => {
      // Verify logged in
      await expect(page.locator('#mainContentArea')).toBeVisible();
      
      // Refresh page
      await page.reload({ waitUntil: 'networkidle' });
      
      // Should NOT show login overlay
      await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 3000 });
      // Dashboard should be visible
      await expect(page.locator('#mainContentArea')).toBeVisible();
      // And tool grid should be there
      await expect(page.locator('.x3-tool-item').first()).toBeVisible({ timeout: 5000 });
    });

    test('Token persists in localStorage after refresh', async () => {
      const tokenBefore = await page.evaluate(() => localStorage.getItem('ocp_token'));
      expect(tokenBefore).toBeTruthy();
      
      await page.reload({ waitUntil: 'networkidle' });
      
      const tokenAfter = await page.evaluate(() => localStorage.getItem('ocp_token'));
      expect(tokenAfter).toBe(tokenBefore);
    });
  });

  // --- Logout ---
  test('Logout works', async () => {
    await login();
    await logout();
    await expect(page.locator('#loginOverlay')).toBeVisible();
  });
});