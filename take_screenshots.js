const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'https://192.168.1.2:2083';
const PASSWORD = '9952f52f';
const USERNAME = 'admin';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  // Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.fill('#username', USERNAME);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForSelector('h1.page-title:has-text("Dashboard")', { timeout: 10000 });
  
  const pages = [
    { path: '/dashboard', name: 'dashboard', title: 'Dashboard' },
    { path: '/whm/accounts', name: 'whm-accounts', title: 'Account Functions' },
    { path: '/whm/packages', name: 'whm-packages', title: 'Packages' },
    { path: '/whm/resellers', name: 'whm-resellers', title: 'Resellers' },
    { path: '/whm/dns', name: 'whm-dns', title: 'DNS' },
    { path: '/whm/email', name: 'whm-email', title: 'Email' },
    { path: '/whm/ftp', name: 'whm-ftp', title: 'FTP' },
    { path: '/system/terminal', name: 'system-terminal', title: 'Terminal' },
    { path: '/system/files', name: 'system-files', title: 'File Manager' },
    { path: '/system/processes', name: 'system-processes', title: 'Process' },
    { path: '/system/cron', name: 'system-cron', title: 'Cron' },
    { path: '/system/logs', name: 'system-logs', title: 'Error Logs' },
    { path: '/system/mysql', name: 'system-mysql', title: 'MySQL' },
    { path: '/system/ssl', name: 'system-ssl', title: 'SSL' },
    { path: '/system/php-selector', name: 'system-php-selector', title: 'PHP' },
    { path: '/system/firewall', name: 'system-firewall', title: 'Firewall' },
    { path: '/system/monitoring', name: 'system-monitoring', title: 'Monitoring' },
    { path: '/system/backups', name: 'system-backups', title: 'Backups' },
    { path: '/settings', name: 'settings', title: 'Settings' },
  ];
  
  for (const p of pages) {
    await page.goto(BASE_URL + p.path, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `tests/screenshots/${p.name}.png`, fullPage: true });
    console.log('Screenshot:', p.name);
  }
  
  await browser.close();
  console.log('All screenshots captured!');
}

run().catch(console.error);