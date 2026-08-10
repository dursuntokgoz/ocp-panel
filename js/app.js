const cPanelApp = {
  activeView: 'dashboard',

  categories: [
    {
      id: 'preferences',
      title: 'Preferences',
      tools: [
        { name: 'Getting Started Wizard', icon: 'gettingStarted', action: 'wizard' },
        { name: 'Video Tutorials', icon: 'videoTutorials', action: 'tutorials' },
        { name: 'Change Password', icon: 'changePassword', action: 'password' },
        { name: 'Update Contact Information', icon: 'contactInfo', action: 'contact' },
        { name: 'Branding Editor', icon: 'brandingEditor', action: 'branding' },
        { name: 'Change Style', icon: 'changeStyle', action: 'style' },
        { name: 'Change Language', icon: 'changeLanguage', action: 'lang' },
        { name: 'Shortcuts', icon: 'shortcuts', action: 'shortcuts' }
      ]
    },
    {
      id: 'mail',
      title: 'Mail',
      tools: [
        { name: 'Email Accounts', icon: 'emailAccounts', action: 'email' },
        { name: 'Webmail', icon: 'webmail', action: 'webmail' },
        { name: 'BoxTrapper', icon: 'boxTrapper', action: 'boxtrapper' },
        { name: 'Apache SpamAssassin™', icon: 'spamAssassin', action: 'spam' },
        { name: 'Forwarders', icon: 'forwarders', action: 'forwarders' },
        { name: 'Autoresponders', icon: 'autoresponders', action: 'autoresponders' }
      ]
    },
    {
      id: 'files',
      title: 'Files',
      tools: [
        { name: 'Backups', icon: 'backups', action: 'backups' },
        { name: 'Backup Wizard', icon: 'backups', action: 'backupWizard' },
        { name: 'File Manager', icon: 'fileManager', action: 'fileManager' },
        { name: 'Legacy File Manager', icon: 'legacyFileManager', action: 'legacyFileManager' },
        { name: 'Disk Space Usage', icon: 'diskSpaceUsage', action: 'diskUsage' },
        { name: 'Web Disk', icon: 'webDisk', action: 'webDisk' },
        { name: 'FTP Accounts', icon: 'ftpAccounts', action: 'ftp' }
      ]
    },
    {
      id: 'logs',
      title: 'Logs',
      tools: [
        { name: 'Latest Visitors', icon: 'latestVisitors', action: 'visitors' },
        { name: 'Bandwidth', icon: 'bandwidth', action: 'bandwidth' },
        { name: 'Webalizer', icon: 'webalizer', action: 'webalizer' }
      ]
    },
    {
      id: 'databases',
      title: 'Databases',
      tools: [
        { name: 'MySQL® Databases', icon: 'mysql', action: 'mysql' },
        { name: 'phpMyAdmin', icon: 'phpMyAdmin', action: 'phpMyAdmin' }
      ]
    },
    {
      id: 'domains',
      title: 'Domains',
      tools: [
        { name: 'Subdomains', icon: 'subdomains', action: 'subdomains' },
        { name: 'Addon Domains', icon: 'addonDomains', action: 'addonDomains' },
        { name: 'Redirects', icon: 'redirects', action: 'redirects' },
        { name: 'Zone Editor', icon: 'zoneEditor', action: 'zoneEditor' }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      tools: [
        { name: 'SSH/Terminal Access', icon: 'terminal', action: 'terminal' },
        { name: 'SSL/TLS Status', icon: 'sslStatus', action: 'ssl' }
      ]
    }
  ],

  init: function() {
    this.renderDashboard();
    this.setupSearch();
    console.log('cPanel X3 App Ready');
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
      inp.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        this.filterTools(q);
      });
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
    let subHtml = '';

    switch (action) {
      case 'fileManager':
      case 'legacyFileManager':
        subHtml = X3SubPages.fileManager();
        break;
      case 'email':
      case 'webmail':
        subHtml = X3SubPages.emailAccounts();
        break;
      case 'mysql':
      case 'phpMyAdmin':
        subHtml = X3SubPages.mysql();
        break;
      case 'subdomains':
        subHtml = X3SubPages.subdomains();
        break;
      default:
        subHtml = `
          ${X3SubPages.renderBreadcrumb('Module', action)}
          <div class="subpage-container">
            <div class="subpage-header">
              <h2>${action.toUpperCase()} Module View</h2>
              <button class="btn-x3" onclick="cPanelApp.showDashboard()">✕ Return to Dashboard</button>
            </div>
            <div class="x3-form-box">
              <p>Simulating cPanel X3 module <strong>${action}</strong>. Complete functional sub-page feature loaded.</p>
            </div>
          </div>
        `;
        break;
    }

    container.innerHTML = subHtml;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  showDashboard: function() {
    this.renderDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

document.addEventListener('DOMContentLoaded', () => {
  cPanelApp.init();
});
