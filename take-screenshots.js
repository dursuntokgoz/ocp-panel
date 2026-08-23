const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto('https://localhost:2083', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshot-login.png', fullPage: true });
  
  // Login
  await page.fill('#loginUser', 'admin');
  await page.fill('#loginPass', 'ocpadmin');
  await page.click('#loginBtn');
  await page.waitForSelector('.x3-main', { timeout: 10000 });
  await page.waitForTimeout(2000); // Wait for login to complete
  
  // Force hide login overlay
  await page.evaluate(() => {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
  });
  
  await page.screenshot({ path: 'screenshot-dashboard.png', fullPage: true });
  
  // Helper to open tool using the app's openTool function and wait
  async function openToolAndScreenshot(action, filename) {
    await page.evaluate((act) => {
      // Find and expand the category containing this tool
      const toolItems = document.querySelectorAll('.x3-tool-item');
      for (const item of toolItems) {
        if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(act)) {
          // Find parent category panel
          const panel = item.closest('.cat-panel');
          if (panel && panel.classList.contains('collapsed')) {
            const header = panel.querySelector('.cat-header');
            if (header) header.click();
          }
          // Small delay for animation
          setTimeout(() => item.click(), 300);
          break;
        }
      }
    }, action);
    
    await page.waitForSelector('.subpage-container');
    await page.waitForTimeout(500);
    await page.screenshot({ path: filename, fullPage: true });
  }
  
  // WHM - Packages
  await openToolAndScreenshot('addPackage', 'screenshot-packages-add.png');
  
  // WHM - Resellers
  await openToolAndScreenshot('createReseller', 'screenshot-resellers-create.png');
  
  // WHM - DNS
  await openToolAndScreenshot('addDnsZone', 'screenshot-dns-add.png');
  
  // WHM - Email
  await openToolAndScreenshot('whmEmailCreate', 'screenshot-email-create.png');
  
  // WHM - FTP
  await openToolAndScreenshot('whmFtpCreate', 'screenshot-ftp-create.png');
  
  // System - Terminal
  await openToolAndScreenshot('terminal', 'screenshot-terminal.png');
  
  // System - Process Manager
  await openToolAndScreenshot('processes', 'screenshot-processes.png');
  
  // System - Cron Jobs
  await openToolAndScreenshot('cron', 'screenshot-cron.png');
  
  // System - Error Logs
  await openToolAndScreenshot('logs', 'screenshot-logs.png');
  
  // System - MySQL
  await openToolAndScreenshot('mysql', 'screenshot-mysql.png');
  
  // System - CPU/Concurrent
  await openToolAndScreenshot('cpuConcurrent', 'screenshot-cpu.png');
  
  // System - File Manager
  await openToolAndScreenshot('fileManager', 'screenshot-filemanager.png');
  
  // Docker Manager
  await openToolAndScreenshot('dockerManager', 'screenshot-docker.png');
  
  // Backup Manager
  await openToolAndScreenshot('backupManager', 'screenshot-backup.png');
  
  // Live Monitor
  await openToolAndScreenshot('liveMonitor', 'screenshot-livemonitor.png');
  
  await browser.close();
  console.log('All screenshots taken!');
})();