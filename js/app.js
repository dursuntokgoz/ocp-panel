/* ============================================================
 * OCP Panel — Uygulama Kontrolcüsü (cPanel klonu)
 * Tüm cPanel modülleri: router + kategori + tema + arama
 * ============================================================ */
const cPanelApp = {
  activeView: 'dashboard',

  categories: [
    {
      id: 'system', title: 'System',
      tools: [
        { name: 'Server Status', icon: 'serverStatus', action: 'serverStatus' },
        { name: 'Services', icon: 'services', action: 'services' },
        { name: 'Network Interfaces', icon: 'network', action: 'network' },
        { name: 'System Users', icon: 'systemUsers', action: 'systemUsers' },
        { name: 'Package Updates', icon: 'updates', action: 'updates' },
      ]
    },
    {
      id: 'preferences', title: 'Preferences',
      tools: [
        { name: 'Getting Started Wizard', icon: 'gettingStarted', action: 'wizard' },
        { name: 'Video Tutorials', icon: 'videoTutorials', action: 'tutorials' },
        { name: 'Change Password', icon: 'changePassword', action: 'changePassword' },
        { name: 'Update Contact Information', icon: 'contactInfo', action: 'contactInfo' },
        { name: 'Branding Editor', icon: 'brandingEditor', action: 'branding' },
        { name: 'Change Style', icon: 'changeStyle', action: 'changeStyle' },
        { name: 'Change Language', icon: 'changeLanguage', action: 'changeLanguage' },
        { name: 'Shortcuts', icon: 'shortcuts', action: 'shortcuts' },
        { name: 'User Manager', icon: 'userManager', action: 'userManager' },
        { name: 'My Account', icon: 'myAccount', action: 'myAccount' },
      ]
    },
    {
      id: 'mail', title: 'Mail',
      tools: [
        { name: 'Email Accounts', icon: 'emailAccounts', action: 'email' },
        { name: 'Webmail', icon: 'webmail', action: 'webmail' },
        { name: 'BoxTrapper', icon: 'boxTrapper', action: 'boxtrapper' },
        { name: 'Apache SpamAssassin', icon: 'spamAssassin', action: 'spamAssassin' },
        { name: 'Forwarders', icon: 'forwarders', action: 'forwarders' },
        { name: 'Autoresponders', icon: 'autoresponders', action: 'autoresponders' },
        { name: 'Mailing Lists', icon: 'mailingLists', action: 'mailingLists' },
        { name: 'Email Deliverability', icon: 'emailDeliverability', action: 'deliverability' },
        { name: 'Email Authentication', icon: 'emailAuth', action: 'emailAuth' },
        { name: 'Email Filters', icon: 'emailFilters', action: 'emailFilters' },
        { name: 'Global Email Filters', icon: 'globalFilters', action: 'globalFilters' },
        { name: 'Track Delivery', icon: 'trackDelivery', action: 'trackDelivery' },
        { name: 'Email Disk Usage', icon: 'emailDiskUsage', action: 'emailDiskUsage' },
        { name: 'MX Entry', icon: 'mxEntry', action: 'mxEntry' },
        { name: 'Calendars and Contacts', icon: 'calendars', action: 'calendars' },
        { name: 'Email Routing', icon: 'emailRouting', action: 'emailRouting' },
      ]
    },
    {
      id: 'files', title: 'Files',
      tools: [
        { name: 'File Manager', icon: 'fileManager', action: 'fileManager' },
        { name: 'Legacy File Manager', icon: 'legacyFileManager', action: 'legacyFileManager' },
        { name: 'Disk Space Usage', icon: 'diskSpaceUsage', action: 'diskUsage' },
        { name: 'Web Disk', icon: 'webDisk', action: 'webDisk' },
        { name: 'FTP Accounts', icon: 'ftpAccounts', action: 'ftp' },
        { name: 'FTP Connections', icon: 'ftpConnections', action: 'ftpConnections' },
        { name: 'Backups', icon: 'backups', action: 'backups' },
        { name: 'Backup Wizard', icon: 'backupWizard', action: 'backupWizard' },
        { name: 'Git Version Control', icon: 'git', action: 'git' },
        { name: 'Images', icon: 'images', action: 'images' },
        { name: 'Directory Privacy', icon: 'directoryPrivacy', action: 'directoryPrivacy' },
      ]
    },
    {
      id: 'logs', title: 'Logs',
      tools: [
        { name: 'Latest Visitors', icon: 'latestVisitors', action: 'visitors' },
        { name: 'Bandwidth', icon: 'bandwidth', action: 'bandwidth' },
        { name: 'Webalizer', icon: 'webalizer', action: 'webalizer' },
        { name: 'Errors', icon: 'errors', action: 'errors' },
        { name: 'Resource Usage', icon: 'resourceUsage', action: 'resourceUsage' },
        { name: 'CPU / Concurrent Connections', icon: 'cpuConcurrent', action: 'cpuConcurrent' },
        { name: 'SQL Error Logs', icon: 'sqlErrors', action: 'sqlErrors' },
        { name: 'Indexes', icon: 'indexes', action: 'indexes' },
      ]
    },
    {
      id: 'databases', title: 'Databases',
      tools: [
        { name: 'MySQL Databases', icon: 'mysql', action: 'mysql' },
        { name: 'MySQL Database Wizard', icon: 'mysqlWizard', action: 'mysqlWizard' },
        { name: 'phpMyAdmin', icon: 'phpMyAdmin', action: 'phpMyAdmin' },
        { name: 'Remote MySQL', icon: 'remoteMysql', action: 'remoteMysql' },
        { name: 'PostgreSQL', icon: 'postgres', action: 'postgres' },
      ]
    },
    {
      id: 'domains', title: 'Domains',
      tools: [
        { name: 'Domains', icon: 'domains', action: 'domains' },
        { name: 'Subdomains', icon: 'subdomains', action: 'subdomains' },
        { name: 'Addon Domains', icon: 'addonDomains', action: 'addonDomains' },
        { name: 'Aliases', icon: 'aliases', action: 'aliases' },
        { name: 'Redirects', icon: 'redirects', action: 'redirects' },
        { name: 'Zone Editor', icon: 'zoneEditor', action: 'zoneEditor' },
        { name: 'Dynamic DNS', icon: 'dynamicDns', action: 'dynamicDns' },
      ]
    },
    {
      id: 'security', title: 'Security',
      tools: [
        { name: 'SSH/Terminal Access', icon: 'terminal', action: 'sshAccess' },
        { name: 'SSL/TLS Status', icon: 'sslStatus', action: 'ssl' },
        { name: 'SSL/TLS Manager', icon: 'sslManager', action: 'sslManager' },
        { name: 'SSH Keys', icon: 'sshKeys', action: 'sshKeys' },
        { name: 'IP Blocker', icon: 'ipBlocker', action: 'ipBlocker' },
        { name: 'Hotlink Protection', icon: 'hotlink', action: 'hotlink' },
        { name: 'Leech Protection', icon: 'leech', action: 'leech' },
        { name: 'ModSecurity', icon: 'modSecurity', action: 'modSecurity' },
        { name: '2-Factor Authentication', icon: 'twoFactor', action: 'twoFactor' },
        { name: 'Password Protection', icon: 'passwordProtection', action: 'passwordProtection' },
      ]
    },
    {
      id: 'software', title: 'Software',
      tools: [
        { name: 'Select PHP Version', icon: 'phpVersion', action: 'selectPhp' },
        { name: 'MultiPHP Manager', icon: 'multiPhp', action: 'multiPhp' },
        { name: 'MultiPHP INI Editor', icon: 'phpIni', action: 'phpIni' },
        { name: 'PHP PEAR Packages', icon: 'pear', action: 'pear' },
        { name: 'RubyGems', icon: 'rubyGems', action: 'rubyGems' },
        { name: 'Node.js Selector', icon: 'nodejs', action: 'nodejs' },
        { name: 'Python Selector', icon: 'python', action: 'python' },
        { name: 'Application Manager', icon: 'appManager', action: 'appManager' },
        { name: 'Optimize Website', icon: 'optimize', action: 'optimize' },
      ]
    },
    {
      id: 'advanced', title: 'Advanced',
      tools: [
        { name: 'Terminal', icon: 'terminal', action: 'terminal' },
        { name: 'Cron Jobs', icon: 'cronJobs', action: 'cronJobs' },
        { name: 'Indexes', icon: 'indexes', action: 'indexes' },
        { name: 'Error Pages', icon: 'errorPages', action: 'errorPages' },
        { name: 'MIME Types', icon: 'mimeTypes', action: 'mimeTypes' },
        { name: 'Apache Handlers', icon: 'apacheHandlers', action: 'apacheHandlers' },
        { name: 'Process Manager', icon: 'processManager', action: 'processManager' },
      ]
    },
  ],

  init: function() {
    PanelAPI.init();
    if (!PanelAPI.isAuthed) {
      PanelAuth.show();
      return;
    }
    this.renderDashboard();
    this.setupSearch();
    this.updateStats();
    console.log('OCP Panel Ready — ' + this.categories.reduce((n, c) => n + c.tools.length, 0) + ' modül yüklendi');
  },

  renderDashboard: function() {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    let html = '';
    this.categories.forEach(cat => {
      html += `
        <div class="cat-panel" id="panel-${cat.id}">
          <div class="cat-header" onclick="cPanelApp.toggleCategory('${cat.id}')">
            <span>${cat.title}</span>
            <span class="cat-toggle-btn" id="btn-${cat.id}">▲</span>
          </div>
          <div class="cat-grid" id="grid-${cat.id}">
      `;

      cat.tools.forEach(tool => {
        const svg = X3Icons[tool.icon] || X3Icons.genericTool;
        html += `
          <div class="x3-tool-item" data-name="${tool.name.toLowerCase()}" onclick="cPanelApp.openTool('${tool.action}')">
            <div class="x3-tool-icon">${svg}</div>
            <div class="x3-tool-name">${tool.name}</div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.activeView = 'dashboard';
  },

  toggleCategory: function(id) {
    const panel = document.getElementById(`panel-${id}`);
    const btn = document.getElementById(`btn-${id}`);
    if (panel) {
      panel.classList.toggle('collapsed');
      if (btn) btn.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
    }
  },

  setupSearch: function() {
    const inp = document.getElementById('findSearchInput');
    if (inp) {
      inp.addEventListener('input', (e) => this.filterTools(e.target.value.toLowerCase().trim()));
    }
  },

  filterTools: function(query) {
    if (this.activeView !== 'dashboard') this.showDashboard();

    const items = document.querySelectorAll('.x3-tool-item');
    const panels = document.querySelectorAll('.cat-panel');

    if (!query) {
      items.forEach(it => it.style.display = 'flex');
      panels.forEach(p => p.classList.remove('collapsed'));
      return;
    }

    panels.forEach(panel => {
      let hasMatch = false;
      const secItems = panel.querySelectorAll('.x3-tool-item');
      secItems.forEach(it => {
        const name = it.getAttribute('data-name');
        if (name && name.includes(query)) {
          it.style.display = 'flex';
          hasMatch = true;
        } else {
          it.style.display = 'none';
        }
      });
      if (hasMatch) panel.classList.remove('collapsed');
    });
  },

  openTool: function(action) {
    const container = document.getElementById('mainContentArea');
    if (!container) return;

    this.activeView = 'subpage';
    const renderer = cPanelSubPages[action] || cPanelSubPages.generic;
    container.innerHTML = typeof renderer === 'function'
      ? renderer.call(cPanelSubPages)
      : cPanelSubPages.generic(action);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  showDashboard: function() {
    this.renderDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* --- Sidebar istatistikleri (GERÇEK sistem verileri) --- */
  updateStats: function() {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    const setBar = (id, pct) => {
      const el = document.getElementById(id);
      if (el) el.style.width = Math.min(pct, 100) + '%';
    };
    PanelAPI.stats().then(s => {
      set('statDisk', (s.disk.pct || 0) + '%');
      set('statBandwidth', (s.memory.pct || 0) + '%');
      set('statEmails', s.services || 0);
      set('statSubdomains', s.processes || 0);
      set('statAddons', s.docker || 0);
      set('statDbs', s.temp != null ? s.temp + '°C' : '—');
      setBar('statDiskBar', s.disk.pct || 0);
      setBar('statBwBar', s.memory.pct || 0);
    }).catch(() => {});
  },

  changeTheme: function(themeName) {
    if (themeName === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
    this.showToast(`Theme switched to: ${themeName.toUpperCase()}`);
  },

  showToast: function(msg) {
    let box = document.getElementById('toastBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastBox';
      box.className = 'toast-container';
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
};

/* ============================================================
 * PanelAuth — Login yönetimi
 * ============================================================ */
const PanelAuth = {
  show() {
    const ov = document.getElementById('loginOverlay');
    if (!ov) return;
    ov.style.display = 'flex';
    const host = document.getElementById('loginHost');
    if (host) host.textContent = window.location.hostname;
    setTimeout(() => {
      const inp = document.getElementById('loginPass');
      if (inp) inp.focus();
    }, 100);
  },

  hide() {
    const ov = document.getElementById('loginOverlay');
    if (ov) ov.style.display = 'none';
  },

  async login() {
    const inp = document.getElementById('loginPass');
    const err = document.getElementById('loginErr');
    const btn = document.getElementById('loginBtn');
    const pw = inp ? inp.value : '';
    if (!pw) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Kontrol ediliyor…'; }
    if (err) err.textContent = '';
    try {
      await PanelAPI.login(pw);
      this.hide();
      cPanelApp.renderDashboard();
      cPanelApp.setupSearch();
      cPanelApp.updateStats();
      if (inp) inp.value = '';
    } catch (e) {
      if (err) err.textContent = '❌ ' + e.message;
      if (inp) { inp.value = ''; inp.focus(); }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Giriş Yap'; }
    }
  },

  async logout() {
    await PanelAPI.logout();
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  cPanelApp.init();
});
