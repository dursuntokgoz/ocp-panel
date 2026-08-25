// OCP Panel E2E Tests — Playwright (React Frontend)
// Run: npx playwright test tests/e2e.spec.js

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://192.168.1.2:2083';
const PASSWORD = process.env.OCP_PASSWORD || '9952f52f';
const USERNAME = 'admin';

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);
}

test.describe.configure({ retries: 1 });

test.describe('OCP Panel — Full E2E Suite (React)', () => {
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
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
      errors.push(err.message);
    });
    test.errors = errors;
  });

  test.afterAll(async () => {
    await context.close();
  });

  // Screenshot after each test
  test.afterEach(async () => {
    const testInfo = test.info();
    const testName = testInfo.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    await takeScreenshot(page, `${testInfo.titlePath.join('_')}_${testName}`);
  });

  // --- Helper: login ---
  async function login() {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    // Check if already logged in (dashboard visible)
    const dashboardTitle = page.locator('h1.page-title:has-text("Dashboard")');
    if (await dashboardTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
      return; // Already logged in
    }
    // React login page has username/password inputs
    await page.fill('#username', USERNAME);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    // Wait for dashboard to load
    await page.waitForSelector('h1.page-title:has-text("Dashboard")', { timeout: 10000 });
  }

  // --- Helper: logout ---
  async function logout() {
    // Click user menu or logout button - for now just navigate to login
    await page.goto(BASE_URL + '/logout', { waitUntil: 'networkidle' }).catch(() => {});
    // Or clear localStorage and reload
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#username', { timeout: 5000 });
  }

  // --- Helper: navigate via sidebar ---
  async function navigateTo(path) {
    // Debug: list all links in sidebar
    const allLinks = await page.locator('aside a').all();
    console.log('Sidebar links:', allLinks.length);
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`  Link: href="${href}", text="${text}"`);
    }
    
    // Click sidebar link by href - NavLink renders as <a> with href
    const link = page.locator(`aside a[href="${path}"]`).first();
    await expect(link).toBeVisible({ timeout: 5000 });
    await link.click();
    // Wait for page to load
    await page.waitForURL(`**${path}`, { timeout: 10000 });
    await page.waitForSelector('h1.page-title', { timeout: 10000 });
  }

  // --- Helper: open WHM submenu ---
  async function openWhmTool(toolPath) {
    // Ensure WHM section is expanded
    const whmButton = page.locator('aside button:has-text("WHM")').first();
    const isExpanded = await whmButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await whmButton.click();
      await page.waitForTimeout(300);
    }
    await navigateTo(toolPath);
  }

  // --- Helper: open System submenu ---
  async function openSystemTool(toolPath) {
    const sysButton = page.locator('aside button:has-text("System")').first();
    const isExpanded = await sysButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await sysButton.click();
      await page.waitForTimeout(300);
    }
    await navigateTo(toolPath);
  }

  test('1. Login with valid credentials', async () => {
    await login();
    // Dashboard should be visible
    await expect(page.locator('h1.page-title:has-text("Dashboard")')).toBeVisible();
  });

  test('2. Dashboard loads with stats cards', async () => {
    await login();
    // Wait for stats to load
    await page.waitForTimeout(2000);
    // Check stat cards are present (4 cards: CPU, Memory, Disk, Load)
    const statCards = page.locator('.card:has(.card-body)');
    await expect(statCards.first()).toBeVisible();
    // At least 3 stat cards should be visible
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // --- WHM / Home (Dashboard serves as home) ---
  test.describe('WHM > Account Functions', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Account Functions list', async () => {
      await openWhmTool('/whm/accounts');
      await expect(page.locator('h1.page-title:has-text("Account Functions")')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('Create Account modal opens', async () => {
      await openWhmTool('/whm/accounts');
      await page.click('button:has-text("Create Account")');
      await expect(page.locator('.modal:has-text("Create Account")')).toBeVisible();
      await expect(page.locator('input[placeholder="username"]')).toBeVisible();
      await expect(page.locator('input[placeholder="example.com"]')).toBeVisible();
      // Close modal
      await page.click('.modal-footer button:has-text("Cancel")');
    });

    test('List Accounts table loads', async () => {
      await openWhmTool('/whm/accounts');
      await expect(page.locator('table tbody')).toBeVisible();
      await page.waitForTimeout(2000);
    });
  });

  test.describe('WHM > Packages', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Packages page loads', async () => {
      await openWhmTool('/whm/packages');
      await expect(page.locator('h1.page-title:has-text("Packages")')).toBeVisible();
    });

    test('Add Package form visible', async () => {
      await openWhmTool('/whm/packages');
      await page.click('button:has-text("Add Package"), button:has-text("Create Package")');
      // Check if modal or form appears
      await page.waitForTimeout(1000);
      const form = page.locator('form, .modal').first();
      await expect(form).toBeVisible();
    });
  });

  test.describe('WHM > Resellers', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Resellers page loads', async () => {
      await openWhmTool('/whm/resellers');
      await expect(page.locator('h1.page-title:has-text("Resellers")')).toBeVisible();
    });
  });

  test.describe('WHM > DNS Functions', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('DNS Functions page loads', async () => {
      await openWhmTool('/whm/dns');
      await expect(page.locator('h1.page-title:has-text("DNS")')).toBeVisible();
    });
  });

  test.describe('WHM > Email Functions', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Email Functions page loads', async () => {
      await openWhmTool('/whm/email');
      await expect(page.locator('h1.page-title:has-text("Email")')).toBeVisible();
    });
  });

  test.describe('WHM > FTP Functions', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('FTP Functions page loads', async () => {
      await openWhmTool('/whm/ftp');
      await expect(page.locator('h1.page-title:has-text("FTP")')).toBeVisible();
    });
  });

  // --- System Modules ---
  test.describe('System Modules', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Terminal', async () => {
      await openSystemTool('/system/terminal');
      await expect(page.locator('h1.page-title:has-text("Terminal")')).toBeVisible();
      // Check terminal input exists
      await expect(page.locator('input[placeholder="Enter command..."]')).toBeVisible();
      // Test command
      await page.fill('input[placeholder="Enter command..."]', 'echo test123');
      await page.click('button[type="submit"]:has(svg)'); // Send button
      await page.waitForTimeout(2000);
      // Check output contains test123
      await expect(page.locator('.h-96')).toContainText('test123');
    });

    test('File Manager', async () => {
      await openSystemTool('/system/files');
      await expect(page.locator('h1.page-title:has-text("File Manager")')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('Process Manager', async () => {
      await openSystemTool('/system/processes');
      await expect(page.locator('h1.page-title:has-text("Process")')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('Cron Jobs', async () => {
      await openSystemTool('/system/cron');
      await expect(page.locator('h1.page-title:has-text("Cron")')).toBeVisible();
    });

    test('Error Logs', async () => {
      await openSystemTool('/system/logs');
      await expect(page.locator('h1.page-title:has-text("Error Logs")')).toBeVisible();
    });

    test('MySQL', async () => {
      await openSystemTool('/system/mysql');
      await expect(page.locator('h1.page-title:has-text("MySQL")')).toBeVisible();
    });

    test('SSL/TLS Manager', async () => {
      await openSystemTool('/system/ssl');
      await expect(page.locator('h1.page-title:has-text("SSL")')).toBeVisible();
    });

    test('PHP Selector', async () => {
      await openSystemTool('/system/php-selector');
      await expect(page.locator('h1.page-title:has-text("PHP")')).toBeVisible();
    });

    test('Firewall', async () => {
      await openSystemTool('/system/firewall');
      await expect(page.locator('h1.page-title:has-text("Firewall")')).toBeVisible();
    });

    test('Monitoring', async () => {
      await openSystemTool('/system/monitoring');
      await expect(page.locator('h1.page-title:has-text("Monitoring")')).toBeVisible();
    });

    test('Backups', async () => {
      await openSystemTool('/system/backups');
      await expect(page.locator('h1.page-title:has-text("Backups")')).toBeVisible();
    });
  });

  // --- Settings ---
  test('Settings page loads', async () => {
    await login();
    await navigateTo('/settings');
    await expect(page.locator('h1.page-title:has-text("Settings")')).toBeVisible();
  });

  // --- Session Persistence ---
  test.describe('Session Persistence', () => {
    test.beforeEach(async () => {
      await login();
    });

    test('Page refresh keeps user logged in', async () => {
      // Verify on dashboard
      await expect(page.locator('h1.page-title:has-text("Dashboard")')).toBeVisible();

      // Refresh page
      await page.reload({ waitUntil: 'networkidle' });

      // Should NOT show login page (username input)
      await expect(page.locator('#username')).toBeHidden({ timeout: 3000 });
      // Dashboard should be visible
      await expect(page.locator('h1.page-title:has-text("Dashboard")')).toBeVisible({ timeout: 5000 });
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
    // Clear localStorage to simulate logout
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#username')).toBeVisible({ timeout: 5000 });
  });
});