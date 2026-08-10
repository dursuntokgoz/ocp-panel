const X3SubPages = {
  renderBreadcrumb: function(catName, pageTitle) {
    return `
      <div class="breadcrumb-bar">
        <a href="#" onclick="cPanelApp.showDashboard(); return false;">Home</a> &gt; 
        <span>${catName}</span> &gt; 
        <strong>${pageTitle}</strong>
      </div>
    `;
  },

  fileManager: function() {
    return `
      ${this.renderBreadcrumb('Files', 'File Manager')}
      <div class="subpage-container">
        <div class="subpage-header">
          <h2>File Manager v3.2 (/home/adamowen/public_html)</h2>
          <button class="btn-x3" onclick="cPanelApp.showDashboard()">✕ Kapat</button>
        </div>

        <div class="fm-toolbar">
          <button class="fm-btn" onclick="cPanelSubPages.promptNewFile()">📄 New File</button>
          <button class="fm-btn" onclick="cPanelSubPages.promptNewFolder()">📂 New Folder</button>
          <button class="fm-btn" onclick="alert('Copying selected item...')">📋 Copy</button>
          <button class="fm-btn" onclick="alert('Moving item...')">✂️ Move</button>
          <button class="fm-btn highlight" onclick="alert('Upload starting...')">⬆ Upload</button>
          <button class="fm-btn" onclick="alert('Download starting...')">⬇ Download</button>
          <button class="fm-btn danger" onclick="alert('Delete item?')">🗑️ Delete</button>
          <button class="fm-btn" onclick="alert('Code editor launched')">✏️ Edit / Code Editor</button>
        </div>

        <div class="file-manager-layout">
          <div class="fm-sidebar-tree">
            <div class="tree-root">📁 /home/adamowen</div>
            <ul class="tree-list">
              <li>📂 .trash</li>
              <li>📂 etc</li>
              <li>📂 mail</li>
              <li class="active">📂 public_html
                <ul>
                  <li>📄 index.php</li>
                  <li>📄 .htaccess</li>
                  <li>📄 wp-config.php</li>
                  <li>📂 wp-content</li>
                  <li>📂 wp-includes</li>
                </ul>
              </li>
              <li>📂 ssl</li>
            </ul>
          </div>

          <div class="fm-main-table">
            <table class="x3-data-table" id="subpageFileTable">
              <thead>
                <tr>
                  <th><input type="checkbox"></th>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Last Modified</th>
                  <th>Type</th>
                  <th>Permissions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="checkbox"></td>
                  <td>📂 <strong>wp-content</strong></td>
                  <td>4.25 MB</td>
                  <td>Aug 05, 2026 14:22</td>
                  <td>Directory</td>
                  <td>0755</td>
                </tr>
                <tr>
                  <td><input type="checkbox"></td>
                  <td>📂 <strong>wp-includes</strong></td>
                  <td>12.80 MB</td>
                  <td>Aug 05, 2026 14:22</td>
                  <td>Directory</td>
                  <td>0755</td>
                </tr>
                <tr>
                  <td><input type="checkbox"></td>
                  <td>📄 <strong>index.php</strong></td>
                  <td>2.45 KB</td>
                  <td>Aug 05, 2026 16:00</td>
                  <td>PHP Script</td>
                  <td>0644</td>
                </tr>
                <tr>
                  <td><input type="checkbox"></td>
                  <td>📄 <strong>wp-config.php</strong></td>
                  <td>3.12 KB</td>
                  <td>Aug 04, 2026 11:45</td>
                  <td>PHP Script</td>
                  <td>0600</td>
                </tr>
                <tr>
                  <td><input type="checkbox"></td>
                  <td>📄 <strong>.htaccess</strong></td>
                  <td>482 B</td>
                  <td>Aug 01, 2026 10:15</td>
                  <td>Configuration</td>
                  <td>0644</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  emailAccounts: function() {
    return `
      ${this.renderBreadcrumb('Mail', 'Email Accounts')}
      <div class="subpage-container">
        <div class="subpage-header">
          <h2>Email Accounts (E-Posta Yönetimi)</h2>
          <button class="btn-x3" onclick="cPanelApp.showDashboard()">✕ Dashboard</button>
        </div>

        <div class="x3-form-box">
          <h3>Add an Email Account</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Email:</label>
              <div style="display:flex; align-items:center; gap:0.4rem;">
                <input type="text" id="subEmailUser" class="x3-input" placeholder="user">
                <span>@ adamowen.co.uk</span>
              </div>
            </div>
            <div class="form-group">
              <label>Password:</label>
              <input type="password" id="subEmailPass" class="x3-input" placeholder="Password">
            </div>
            <div class="form-group">
              <label>Mailbox Quota (MB):</label>
              <input type="number" id="subEmailQuota" class="x3-input" value="250">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addEmail()">+ Create Account</button>
        </div>

        <h3>Current Accounts</h3>
        <table class="x3-data-table" id="subEmailTable">
          <thead>
            <tr>
              <th>Account (@adamowen.co.uk)</th>
              <th>Usage / Quota / %</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>adam@adamowen.co.uk</strong></td>
              <td>
                142.5 MB / 1000 MB (14%)
                <div class="x3-progress"><div class="x3-progress-fill" style="width:14%"></div></div>
              </td>
              <td><span class="badge-active">Active</span></td>
              <td>
                <button class="btn-x3-sm" onclick="alert('Accessing Webmail...')">Access Webmail</button>
                <button class="btn-x3-sm" onclick="alert('Change Password')">Password</button>
              </td>
            </tr>
            <tr>
              <td><strong>info@adamowen.co.uk</strong></td>
              <td>
                68.1 MB / 250 MB (27%)
                <div class="x3-progress"><div class="x3-progress-fill" style="width:27%"></div></div>
              </td>
              <td><span class="badge-active">Active</span></td>
              <td>
                <button class="btn-x3-sm" onclick="alert('Accessing Webmail...')">Access Webmail</button>
                <button class="btn-x3-sm" onclick="alert('Change Password')">Password</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  mysql: function() {
    return `
      ${this.renderBreadcrumb('Databases', 'MySQL Databases')}
      <div class="subpage-container">
        <div class="subpage-header">
          <h2>MySQL® Databases Manager</h2>
          <button class="btn-x3" onclick="cPanelApp.showDashboard()">✕ Dashboard</button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
          <div class="x3-form-box">
            <h3>Create New Database</h3>
            <div class="form-group">
              <label>New Database Name:</label>
              <div style="display:flex; align-items:center; gap:0.4rem;">
                <strong>adamowen_</strong>
                <input type="text" id="subDbName" class="x3-input" placeholder="dbname">
              </div>
            </div>
            <button class="btn-x3-primary" onclick="cPanelSubPages.addDb()">Create Database</button>
          </div>

          <div class="x3-form-box">
            <h3>Add New MySQL User</h3>
            <div class="form-group">
              <label>Username:</label>
              <div style="display:flex; align-items:center; gap:0.4rem;">
                <strong>adamowen_</strong>
                <input type="text" id="subDbUser" class="x3-input" placeholder="dbuser">
              </div>
            </div>
            <div class="form-group">
              <label>Password:</label>
              <input type="password" class="x3-input" placeholder="Password">
            </div>
            <button class="btn-x3-primary" onclick="alert('User created!')">Create User</button>
          </div>
        </div>

        <h3>Current Databases</h3>
        <table class="x3-data-table" id="subDbTable">
          <thead>
            <tr>
              <th>Database</th>
              <th>Size</th>
              <th>Privileged Users</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>adamowen_wordpress</strong></td>
              <td>12.68 MB</td>
              <td>adamowen_wpuser</td>
              <td><button class="btn-x3-sm" onclick="alert('Launching phpMyAdmin...')">phpMyAdmin</button></td>
            </tr>
            <tr>
              <td><strong>adamowen_portal</strong></td>
              <td>2.10 MB</td>
              <td>adamowen_admin</td>
              <td><button class="btn-x3-sm" onclick="alert('Launching phpMyAdmin...')">phpMyAdmin</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  subdomains: function() {
    return `
      ${this.renderBreadcrumb('Domains', 'Subdomains')}
      <div class="subpage-container">
        <div class="subpage-header">
          <h2>Subdomains (Alt Alan Adları)</h2>
          <button class="btn-x3" onclick="cPanelApp.showDashboard()">✕ Dashboard</button>
        </div>

        <div class="x3-form-box">
          <h3>Create a Subdomain</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Subdomain Prefix:</label>
              <input type="text" id="subSubPrefix" class="x3-input" placeholder="blog">
            </div>
            <div class="form-group">
              <label>Domain:</label>
              <select class="x3-input"><option>adamowen.co.uk</option></select>
            </div>
            <div class="form-group">
              <label>Document Root:</label>
              <input type="text" id="subSubRoot" class="x3-input" value="public_html/blog">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addSubdomain()">+ Create Subdomain</button>
        </div>

        <h3>Current Subdomains</h3>
        <table class="x3-data-table" id="subSubTable">
          <thead>
            <tr>
              <th>Subdomain</th>
              <th>Document Root</th>
              <th>Redirection</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>blog.adamowen.co.uk</strong></td>
              <td>/public_html/blog</td>
              <td>not redirected</td>
              <td><button class="btn-x3-sm danger" onclick="alert('Remove subdomain?')">Remove</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  promptNewFile: function() {
    const fn = prompt("New file name:", "test.php");
    if (!fn) return;
    const tb = document.querySelector('#subpageFileTable tbody');
    if (tb) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="checkbox"></td><td>📄 <strong>${fn}</strong></td><td>0 B</td><td>Just now</td><td>Script</td><td>0644</td>`;
      tb.appendChild(tr);
      cPanelApp.showToast(`File '${fn}' created!`);
    }
  },

  promptNewFolder: function() {
    const fn = prompt("New folder name:", "assets");
    if (!fn) return;
    const tb = document.querySelector('#subpageFileTable tbody');
    if (tb) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="checkbox"></td><td>📂 <strong>${fn}</strong></td><td>4.00 KB</td><td>Just now</td><td>Directory</td><td>0755</td>`;
      tb.appendChild(tr);
      cPanelApp.showToast(`Folder '${fn}' created!`);
    }
  },

  addEmail: function() {
    const inp = document.getElementById('subEmailUser');
    if (!inp || !inp.value) return alert('Enter email username');
    const mail = `${inp.value}@adamowen.co.uk`;
    const tb = document.querySelector('#subEmailTable tbody');
    if (tb) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${mail}</strong></td><td>0 MB / 250 MB (0%)<div class="x3-progress"><div class="x3-progress-fill" style="width:0%"></div></div></td><td><span class="badge-active">Active</span></td><td><button class="btn-x3-sm" onclick="alert('Accessing Webmail...')">Access Webmail</button></td>`;
      tb.appendChild(tr);
      inp.value = '';
      cPanelApp.showToast(`Email account '${mail}' created!`);
    }
  },

  addDb: function() {
    const inp = document.getElementById('subDbName');
    if (!inp || !inp.value) return alert('Enter database name');
    const db = `adamowen_${inp.value}`;
    const tb = document.querySelector('#subDbTable tbody');
    if (tb) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${db}</strong></td><td>0.00 MB</td><td>(None)</td><td><button class="btn-x3-sm" onclick="alert('Launching phpMyAdmin...')">phpMyAdmin</button></td>`;
      tb.appendChild(tr);
      inp.value = '';
      cPanelApp.showToast(`Database '${db}' created!`);
    }
  },

  addSubdomain: function() {
    const inp = document.getElementById('subSubPrefix');
    if (!inp || !inp.value) return alert('Enter subdomain prefix');
    const sub = `${inp.value}.adamowen.co.uk`;
    const tb = document.querySelector('#subSubTable tbody');
    if (tb) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${sub}</strong></td><td>/public_html/${inp.value}</td><td>not redirected</td><td><button class="btn-x3-sm danger" onclick="alert('Remove?')">Remove</button></td>`;
      tb.appendChild(tr);
      inp.value = '';
      cPanelApp.showToast(`Subdomain '${sub}' created!`);
    }
  }
};
