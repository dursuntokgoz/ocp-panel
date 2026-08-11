/* ============================================================
 * OCP Panel — GERÇEK Sistem Modülleri
 * Simülasyon modüllerini gerçek backend API'si ile değiştirir.
 * subpages.js'ten SONRA yüklenir, cPanelSubPages metodlarını
 * override eder + yeni System modülleri ekler.
 * ============================================================ */

/* ---------- yardımcılar ---------- */
function fmtBytes(n) {
  if (n == null || isNaN(n)) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return n.toFixed(n >= 100 || i === 0 ? 0 : 1) + ' ' + u[i];
}

function fmtUptime(s) {
  if (!s) return '—';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  let out = '';
  if (d) out += d + ' gün ';
  if (h || d) out += h + ' saat ';
  out += m + ' dk';
  return out.trim();
}

function fmtDate(iso) {
  if (!iso) return '—';
  return iso.replace('T', ' ').slice(0, 19);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function realUser() {
  return PanelAPI.user || 'dursun';
}

function loadingBox(msg) {
  return `<div class="x3-form-box" style="text-align:center;padding:40px;color:#667">
    <div style="font-size:28px;margin-bottom:10px">⏳</div>
    <div>${msg || 'Yükleniyor…'}</div>
  </div>`;
}

function errBox(msg) {
  return `<div class="x3-form-box" style="border-color:#e74c3c;color:#c0392b;padding:20px">
    <strong>❌ Hata:</strong> ${esc(msg)}
  </div>`;
}

/* ============================================================
 * SYSTEM KATEGORİSİ — yeni modüller
 * ============================================================ */
Object.assign(cPanelSubPages, {

  /* ---------- Server Status ---------- */
  serverStatus() {
    const self = this;
    const html = `
      ${this.renderBreadcrumb('System', 'Server Status')}
      <div class="subpage-container">
        ${this.header('🖥️ Server Status', 'Gerçek zamanlı sistem durumu')}
        <div id="ssBody">${loadingBox('Sistem bilgileri alınıyor…')}</div>
      </div>`;
    PanelAPI.stats().then(s => {
      const el = document.getElementById('ssBody');
      if (!el) return;
      const bar = (pct, color) => `<div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${Math.min(pct, 100)}%;background:${color || '#e8740c'}"></div></div>`;
      el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:16px">
          <div class="x3-form-box" style="margin:0;text-align:center"><div style="font-size:30px">🧠</div><div style="font-size:24px;font-weight:700;margin:6px 0">${s.cpu.usage}%</div><div style="color:#667;font-size:12px">CPU Kullanımı (${s.cpu.cores} çekirdek)</div></div>
          <div class="x3-form-box" style="margin:0;text-align:center"><div style="font-size:30px">💾</div><div style="font-size:24px;font-weight:700;margin:6px 0">${fmtBytes(s.memory.used)}</div><div style="color:#667;font-size:12px">RAM · ${fmtBytes(s.memory.total)} toplam</div></div>
          <div class="x3-form-box" style="margin:0;text-align:center"><div style="font-size:30px">📀</div><div style="font-size:24px;font-weight:700;margin:6px 0">${fmtBytes(s.disk.used)}</div><div style="color:#667;font-size:12px">Disk · ${fmtBytes(s.disk.total)} toplam</div></div>
          <div class="x3-form-box" style="margin:0;text-align:center"><div style="font-size:30px">🌡️</div><div style="font-size:24px;font-weight:700;margin:6px 0">${s.temp != null ? s.temp + '°C' : '—'}</div><div style="color:#667;font-size:12px">CPU Sıcaklığı</div></div>
        </div>
        <div class="x3-form-box">
          <h3 style="margin-top:0">Kaynak Kullanımı</h3>
          <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>CPU (${s.cpu.usage}%)</span></div>${bar(s.cpu.usage)}</div>
          <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>RAM (${s.memory.pct}%)</span><span>${fmtBytes(s.memory.used)} / ${fmtBytes(s.memory.total)}</span></div>${bar(s.memory.pct, '#27ae60')}</div>
          <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>Disk (${s.disk.pct}%)</span><span>${fmtBytes(s.disk.used)} / ${fmtBytes(s.disk.total)}</span></div>${bar(s.disk.pct, '#2980b9')}</div>
        </div>
        <div class="x3-form-box">
          <h3 style="margin-top:0">Sistem Bilgileri</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#667;width:180px">Hostname</td><td><strong>${esc(s.hostname)}</strong> (${esc(s.ip)})</td></tr>
            <tr><td style="padding:6px 0;color:#667">İşletim Sistemi</td><td>${esc(s.platform)} ${esc(s.arch)} · Kernel ${esc(s.kernel)}</td></tr>
            <tr><td style="padding:6px 0;color:#667">İşlemci</td><td>${esc(s.cpu.model)}</td></tr>
            <tr><td style="padding:6px 0;color:#667">Çalışma Süresi</td><td>${fmtUptime(s.uptime)}</td></tr>
            <tr><td style="padding:6px 0;color:#667">Load Average</td><td>${s.load.map(l => `<code>${l}</code>`).join(' ')}</td></tr>
            <tr><td style="padding:6px 0;color:#667">Çalışan Servis</td><td>${s.services}</td></tr>
            <tr><td style="padding:6px 0;color:#667">Process Sayısı</td><td>${s.processes}</td></tr>
            <tr><td style="padding:6px 0;color:#667">Docker Konteyner</td><td>${s.docker} aktif</td></tr>
            <tr><td style="padding:6px 0;color:#667">MariaDB</td><td>${s.mysql ? '<span class="badge-active">● Aktif</span>' : '<span class="badge-warn">● Kapalı</span>'}</td></tr>
            <tr><td style="padding:6px 0;color:#667">Kullanıcı</td><td>${esc(s.user)}</td></tr>
          </table>
          <div style="margin-top:14px;display:flex;gap:8px">
            <button class="btn-x3-primary" onclick="cPanelSubPages.refreshServerStatus()">🔄 Yenile</button>
          </div>
        </div>`;
    }).catch(e => {
      const el = document.getElementById('ssBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  },

  refreshServerStatus() { this.serverStatus(); },

  /* ---------- Services (systemd) ---------- */
  services() {
    const html = `
      ${this.renderBreadcrumb('System', 'Services')}
      <div class="subpage-container">
        ${this.header('⚙️ Services', 'systemd servis yönetimi')}
        <div class="x3-form-box" style="margin-bottom:14px;display:flex;gap:8px;align-items:center">
          <input type="text" id="svcFilter" class="x3-input" placeholder="Servis ara… (örn: nginx, docker)" style="flex:1" oninput="cPanelSubPages.filterServices()">
          <button class="btn-x3-primary" onclick="cPanelSubPages.loadServices()">🔄 Yenile</button>
        </div>
        <div id="svcBody">${loadingBox('Servisler listeleniyor…')}</div>
      </div>`;
    setTimeout(() => this.loadServices(), 50);
    return html;
  },

  loadServices() {
    const body = document.getElementById('svcBody');
    if (!body) return;
    body.innerHTML = loadingBox('Servisler listeleniyor…');
    PanelAPI.services().then(d => {
      const filter = (document.getElementById('svcFilter') || {}).value || '';
      const q = filter.toLowerCase();
      const list = d.services.filter(s => !q || s.name.toLowerCase().includes(q));
      const active = list.filter(s => s.active === 'active').length;
      const rows = list.map(s => {
        const on = s.active === 'active';
        const sub = s.sub === 'running' ? 'Çalışıyor' : s.sub;
        return `
          <tr>
            <td style="padding:8px 6px"><span class="${on ? 'badge-active' : 'badge-warn'}" style="display:inline-block;width:8px;height:8px;border-radius:50%;padding:0;margin-right:8px"></span><code>${esc(s.name)}</code></td>
            <td style="padding:8px 6px;color:#667;font-size:12px">${esc(sub)}</td>
            <td style="padding:8px 6px;color:#889;font-size:12px">${esc(s.desc.slice(0, 50))}</td>
            <td style="padding:8px 6px;text-align:right;white-space:nowrap">
              <button class="btn-x3-sm" onclick="cPanelSubPages.svcAction('${esc(s.name)}','restart')" ${on ? '' : 'disabled'}>↻ Restart</button>
              <button class="btn-x3-sm" onclick="cPanelSubPages.svcAction('${esc(s.name)}','start')" ${on ? 'disabled' : ''}>▶ Start</button>
              <button class="btn-x3-sm danger" onclick="cPanelSubPages.svcAction('${esc(s.name)}','stop')" ${on ? '' : 'disabled'}>■ Stop</button>
            </td>
          </tr>`;
      }).join('');
      body.innerHTML = `
        <div class="x3-form-box" style="padding:10px 16px;margin-bottom:10px;font-size:13px;color:#667">
          <strong>${list.length}</strong> servis (${active} aktif) ${q ? '· filtre: "' + esc(filter) + '"' : ''}
        </div>
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:10px 6px">Servis</th><th style="padding:10px 6px">Durum</th><th style="padding:10px 6px">Açıklama</th><th style="padding:10px 6px;text-align:right">Aksiyon</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4" style="padding:20px;text-align:center;color:#889">Servis bulunamadı</td></tr>'}</tbody>
          </table>
        </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  filterServices() { this.loadServices(); },

  svcAction(name, action) {
    const icons = { start: '▶', stop: '■', restart: '↻', reload: '⟳' };
    this.toast(`${icons[action] || ''} ${action} ${name}…`);
    PanelAPI.serviceAction(name, action).then(r => {
      this.toast(`✅ ${name}: ${action} tamamlandı`);
      this.loadServices();
    }).catch(e => {
      this.toast('❌ ' + e.message);
      this.loadServices();
    });
  },

  /* ---------- Network ---------- */
  network() {
    const html = `
      ${this.renderBreadcrumb('System', 'Network Interfaces')}
      <div class="subpage-container">
        ${this.header('🌐 Network Interfaces', 'Ağ arayüzleri, dinleyen portlar ve yönlendirme')}
        <div id="netBody">${loadingBox('Ağ bilgileri alınıyor…')}</div>
      </div>`;
    PanelAPI.network().then(d => {
      const el = document.getElementById('netBody');
      if (!el) return;
      const ifaceCards = d.ifaces.map(i => `
        <div class="x3-form-box" style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div><strong>${esc(i.name)}</strong>
              ${i.state === 'UP' ? '<span class="badge-active">● UP</span>' : '<span class="badge-warn">● ' + esc(i.state) + '</span>'}
              <span style="color:#889;font-size:12px;margin-left:8px">${esc(i.mac)}</span>
            </div>
            <div style="color:#667;font-size:13px">
              ${i.rx != null ? `⬇ ${fmtBytes(i.rx)} · ⬆ ${fmtBytes(i.tx)}` : ''}
            </div>
          </div>
          <div style="margin-top:8px;font-size:13px">
            ${(i.ips || []).map(ip => `<code style="margin-right:8px">${esc(ip)}</code>`).join('') || '<span style="color:#889">IP yok</span>'}
          </div>
        </div>`).join('');
      const connRows = d.conns.slice(0, 30).map(c => `
        <tr><td style="padding:5px 8px"><code>${esc(c.proto)}</code></td><td style="padding:5px 8px">${esc(c.state)}</td><td style="padding:5px 8px"><code>${esc(c.local)}</code></td><td style="padding:5px 8px"><code>${esc(c.peer)}</code></td><td style="padding:5px 8px;color:#889;font-size:12px">${esc(c.proc)}</td></tr>`).join('');
      el.innerHTML = `
        <h3 style="margin:4px 0 12px">Arayüzler</h3>
        ${ifaceCards || errBox('Arayüz bulunamadı')}
        <h3 style="margin:18px 0 10px">Dinleyen Portlar (${d.conns.length})</h3>
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:8px">Proto</th><th style="padding:8px">Durum</th><th style="padding:8px">Yerel Adres</th><th style="padding:8px">Uzak Adres</th><th style="padding:8px">Süreç</th></tr></thead>
            <tbody>${connRows}</tbody>
          </table>
        </div>
        <h3 style="margin:18px 0 10px">Yönlendirme Tablosu</h3>
        <div class="x3-form-box" style="padding:12px 16px">
          ${d.routes.map(r => `<div style="font-size:13px;padding:3px 0"><code>${esc(r)}</code></div>`).join('')}
        </div>`;
    }).catch(e => {
      const el = document.getElementById('netBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  },

  /* ---------- System Users ---------- */
  systemUsers() {
    const html = `
      ${this.renderBreadcrumb('System', 'System Users')}
      <div class="subpage-container">
        ${this.header('👤 System Users', 'Sistem kullanıcı hesapları (UID ≥ 1000)')}
        <div id="usrBody">${loadingBox('Kullanıcılar listeleniyor…')}</div>
      </div>`;
    PanelAPI.users().then(d => {
      const el = document.getElementById('usrBody');
      if (!el) return;
      const rows = d.users.map(u => `
        <tr>
          <td style="padding:9px 8px"><strong>${esc(u.name)}</strong></td>
          <td style="padding:9px 8px"><code>${u.uid}</code> / <code>${u.gid}</code></td>
          <td style="padding:9px 8px;color:#667;font-size:13px">${esc(u.home)}</td>
          <td style="padding:9px 8px;color:#667;font-size:13px">${esc(u.shell)}</td>
        </tr>`).join('');
      el.innerHTML = `
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:10px 8px">Kullanıcı</th><th style="padding:10px 8px">UID / GID</th><th style="padding:10px 8px">Ev Dizini</th><th style="padding:10px 8px">Kabuk</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${d.sessions && d.sessions.length ? `<div class="x3-form-box" style="margin-top:12px"><h3 style="margin-top:0">Aktif Oturumlar</h3>${d.sessions.map(s => `<div style="font-size:13px;padding:3px 0"><code>${esc(s)}</code></div>`).join('')}</div>` : ''}`;
    }).catch(e => {
      const el = document.getElementById('usrBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  },

  /* ---------- Package Updates ---------- */
  updates() {
    const html = `
      ${this.renderBreadcrumb('System', 'Package Updates')}
      <div class="subpage-container">
        ${this.header('📦 Package Updates', 'Güncellenebilir paketler (apt)')}
        <div id="updBody">${loadingBox('Paket listesi alınıyor…')}</div>
      </div>`;
    PanelAPI.terminal('apt list --upgradable 2>/dev/null | tail -n +2 | head -40', 20000).then(r => {
      const el = document.getElementById('updBody');
      if (!el) return;
      const lines = (r.output || '').trim().split('\n').filter(Boolean);
      el.innerHTML = `
        <div class="x3-form-box" style="padding:10px 16px;margin-bottom:10px;font-size:13px;color:#667">
          <strong>${lines.length}</strong> güncellenebilir paket
        </div>
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:10px 8px">Paket</th><th style="padding:10px 8px">Mevcut</th><th style="padding:10px 8px">Yeni</th></tr></thead>
            <tbody>${lines.map(l => {
              const m = l.match(/^(\S+)\/(\S+)\s+([^\s]+)\s+([^\s]+)\s+(.*)$/);
              if (!m) return `<tr><td colspan="3" style="padding:5px 8px;font-size:12px"><code>${esc(l)}</code></td></tr>`;
              return `<tr><td style="padding:8px"><code>${esc(m[1])}</code></td><td style="padding:8px;color:#889;font-size:12px">${esc(m[3])}</td><td style="padding:8px;color:#27ae60;font-size:12px">${esc(m[4])}</td></tr>`;
            }).join('') || '<tr><td colspan="3" style="padding:20px;text-align:center;color:#27ae60">✅ Sistem güncel — güncellenebilir paket yok</td></tr>'}</tbody>
          </table>
        </div>
        <div class="x3-form-box" style="margin-top:12px;padding:14px 18px;font-size:13px;color:#667">
          💡 Güncelleme için terminalden: <code>sudo apt update && sudo apt upgrade -y</code>
        </div>`;
    }).catch(e => {
      const el = document.getElementById('updBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  }
});

/* ============================================================
 * GERÇEK MODÜLLER — mevcut simülasyonları override eder
 * ============================================================ */
Object.assign(cPanelSubPages, {

  /* ---------- File Manager (gerçek dosya sistemi) ---------- */
  fileManager() {
    const html = `
      ${this.renderBreadcrumb('Files', 'File Manager')}
      <div class="subpage-container">
        ${this.header('📁 File Manager', 'Gerçek dosya sistemi yönetimi')}
        <div class="x3-form-box" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="btn-x3-sm" onclick="cPanelSubPages.fmNav('${realUser()}')">🏠 Ev</button>
          <button class="btn-x3-sm" onclick="cPanelSubPages.fmNav('/')">/</button>
          <input type="text" id="fmPath" class="x3-input" style="flex:1;min-width:200px;font-family:monospace" value="/home/${realUser()}" onkeydown="if(event.key==='Enter')cPanelSubPages.fmGo()">
          <button class="btn-x3-primary" onclick="cPanelSubPages.fmGo()">📂 Git</button>
          <button class="btn-x3-sm" onclick="cPanelSubPages.fmMkdir()">+ Klasör</button>
          <button class="btn-x3-sm" onclick="cPanelSubPages.fmUpload()">⬆ Yükle</button>
        </div>
        <div id="fmBody">${loadingBox('Dizin okunuyor…')}</div>
      </div>`;
    setTimeout(() => this.fmNav('/home/' + realUser()), 50);
    return html;
  },

  fmGo() {
    const p = document.getElementById('fmPath');
    if (p) this.fmNav(p.value.trim());
  },

  fmNav(path) {
    const body = document.getElementById('fmBody');
    const p = document.getElementById('fmPath');
    if (!body) return;
    if (p) p.value = path;
    body.innerHTML = loadingBox('Dizin okunuyor…');
    PanelAPI.files(path).then(d => {
      if (d.file) {
        // tek dosya → görüntüleme
        this.fmRead(d.path);
        return;
      }
      const rows = d.files.map(f => {
        const icon = f.dir ? '📁' : (f.link ? '🔗' : '📄');
        const name = esc(f.name);
        return `
          <tr data-name="${name}" data-dir="${f.dir}" data-link="${f.link || ''}">
            <td style="padding:7px 10px;cursor:pointer" onclick="cPanelSubPages.fmOpen('${esc(d.path)}/${name.replace(/'/g, "\\'")}', ${f.dir})">${icon} ${name}</td>
            <td style="padding:7px 10px;color:#889;font-size:12px">${f.sizeH}</td>
            <td style="padding:7px 10px;color:#889;font-size:12px">${esc(f.mtime || '')}</td>
            <td style="padding:7px 10px;color:#889;font-size:12px"><code>${f.perms}</code></td>
            <td style="padding:7px 10px;text-align:right;white-space:nowrap">
              ${f.dir ? '' : `<button class="btn-x3-sm" onclick="cPanelSubPages.fmRead('${esc(d.path)}/${name.replace(/'/g, "\\'")}')">✏️</button>`}
              <button class="btn-x3-sm" onclick="cPanelSubPages.fmRename('${esc(d.path)}/${name.replace(/'/g, "\\'")}','${name.replace(/'/g, "\\'")}')">📝</button>
              <button class="btn-x3-sm danger" onclick="cPanelSubPages.fmDelete('${esc(d.path)}/${name.replace(/'/g, "\\'")}','${name.replace(/'/g, "\\'")}')">🗑</button>
            </td>
          </tr>`;
      }).join('');
      body.innerHTML = `
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <div style="padding:10px 14px;border-bottom:1px solid #e5e9f0;font-size:13px;color:#667;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <span><strong>${esc(d.path)}</strong></span>
            <span>${d.files.length} öğe</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="text-align:left;color:#556;border-bottom:2px solid #e5e9f0"><th style="padding:8px 10px">Ad</th><th style="padding:8px 10px">Boyut</th><th style="padding:8px 10px">Değişiklik</th><th style="padding:8px 10px">İzin</th><th style="padding:8px 10px;text-align:right">Aksiyon</th></tr></thead>
            <tbody>
              ${d.parent && d.parent !== d.path ? `<tr><td colspan="5" style="padding:7px 10px;cursor:pointer;color:#e8740c" onclick="cPanelSubPages.fmNav('${esc(d.parent)}')">⬆ .. (üst dizin)</td></tr>` : ''}
              ${rows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#889">Boş dizin</td></tr>'}
            </tbody>
          </table>
        </div>`;
    }).catch(e => {
      body.innerHTML = errBox(e.message);
    });
  },

  fmOpen(path, isDir) {
    if (isDir) this.fmNav(path);
    else this.fmRead(path);
  },

  fmRead(path) {
    const body = document.getElementById('fmBody');
    if (!body) return;
    body.innerHTML = loadingBox('Dosya okunuyor…');
    PanelAPI.readFile(path).then(d => {
      body.innerHTML = `
        <div class="x3-form-box">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            <div><button class="btn-x3-sm" onclick="cPanelSubPages.fmNav('${esc(path.substring(0, path.lastIndexOf('/')))}')">⬅ Geri</button> <code>${esc(d.path)}</code></div>
            <button class="btn-x3-primary" onclick="cPanelSubPages.fmSave()">💾 Kaydet</button>
          </div>
          <textarea id="fmEditor" style="width:100%;height:480px;font-family:ui-monospace,monospace;font-size:13px;padding:12px;border:1px solid #dde3ec;border-radius:8px;box-sizing:border-box" spellcheck="false">${esc(d.content)}</textarea>
          <div style="margin-top:8px;font-size:12px;color:#889">${(d.content || '').split('\n').length} satır · ${(d.content || '').length.toLocaleString('tr-TR')} karakter</div>
        </div>`;
      document.getElementById('fmEditor').dataset.path = d.path;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  fmSave() {
    const ed = document.getElementById('fmEditor');
    if (!ed) return;
    PanelAPI.writeFile(ed.dataset.path, ed.value).then(() => {
      this.toast('✅ Dosya kaydedildi: ' + ed.dataset.path);
    }).catch(e => this.toast('❌ ' + e.message));
  },

  fmMkdir() {
    const name = prompt('Yeni klasör adı:');
    if (!name) return;
    const p = (document.getElementById('fmPath') || {}).value || '/home/' + realUser();
    PanelAPI.mkdir(p + '/' + name).then(() => {
      this.toast('✅ Klasör oluşturuldu');
      this.fmNav(p);
    }).catch(e => this.toast('❌ ' + e.message));
  },

  fmDelete(path, name) {
    if (!confirm(`"${name}" silinsin mi? (geri alınamaz)`)) return;
    PanelAPI.deletePath(path).then(() => {
      this.toast('🗑 Silindi: ' + name);
      this.fmNav(path.substring(0, path.lastIndexOf('/')));
    }).catch(e => this.toast('❌ ' + e.message));
  },

  fmRename(path, name) {
    const newName = prompt('Yeni ad:', name);
    if (!newName || newName === name) return;
    const dir = path.substring(0, path.lastIndexOf('/'));
    PanelAPI.renamePath(path, dir + '/' + newName).then(() => {
      this.toast('✅ Yeniden adlandırıldı');
      this.fmNav(dir);
    }).catch(e => this.toast('❌ ' + e.message));
  },

  fmUpload() {
    const p = (document.getElementById('fmPath') || {}).value || '/home/' + realUser();
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const isText = /^text\/|json|javascript|xml|yaml|yml|ini|conf|log|sh|py|js|ts|html|css|md|txt|toml/.test(f.type) || f.size < 1024 * 1024;
        if (isText && typeof reader.result === 'string') {
          PanelAPI.writeFile(p + '/' + f.name, reader.result).then(() => {
            this.toast('✅ Yüklendi: ' + f.name);
            this.fmNav(p);
          }).catch(e => this.toast('❌ ' + e.message));
        } else {
          this.toast('❌ Büyük/ikili dosyalar için terminal kullanın (örn. curl -o)');
        }
      };
      reader.readAsText(f);
    };
    inp.click();
  },

  /* ---------- Terminal (gerçek shell) ---------- */
  terminal() {
    return `
      ${this.renderBreadcrumb('Advanced', 'Terminal')}
      <div class="subpage-container">
        ${this.header('💻 Terminal', 'Gerçek shell — komutlar dursun kullanıcısı olarak çalışır')}
        <div class="x3-form-box" style="padding:0;overflow:hidden">
          <div id="termBody" style="background:#0d1117;color:#c9d1d9;font-family:ui-monospace,Consolas,monospace;font-size:13px;padding:14px;height:420px;overflow-y:auto;line-height:1.5" onclick="document.getElementById('termCmd').focus()">
            <div style="color:#8b949e;font-size:12px;margin-bottom:8px">
              OCP Panel Terminal · ${esc(realUser())}@${esc((PanelAPI.user || 'pi5'))} · ctrl+Enter çalıştırır<br>
              <span style="color:#e8740c">⚠ sudo gerektiren komutlar çalışmayabilir</span>
            </div>
          </div>
          <div style="display:flex;background:#161b22;border-top:1px solid #30363d">
            <span style="color:#3fb950;padding:10px 0 10px 14px;font-family:monospace;font-size:13px;white-space:nowrap">${esc(realUser())}@pi5:~$</span>
            <input type="text" id="termCmd" autocomplete="off" spellcheck="false" style="flex:1;background:transparent;border:none;outline:none;color:#c9d1d9;font-family:monospace;font-size:13px;padding:10px;box-sizing:border-box" onkeydown="if(event.key==='Enter')cPanelSubPages.termExec()">
          </div>
        </div>
        <div class="x3-form-box" style="margin-top:10px;padding:10px 14px;font-size:12px;color:#667">
          💡 Örnekler: <code>ls -la</code> · <code>df -h</code> · <code>systemctl status nginx</code> · <code>docker ps</code> · <code>htop</code> (yoksa: <code>sudo apt install htop</code>)
        </div>
      </div>`;
  },

  termExec() {
    const cmd = document.getElementById('termCmd').value.trim();
    const body = document.getElementById('termBody');
    if (!cmd || !body) return;
    if (cmd === 'clear') { body.innerHTML = ''; document.getElementById('termCmd').value = ''; return; }
    body.appendChild(this.termLine(cmd));
    const res = document.createElement('div');
    res.style.cssText = 'white-space:pre-wrap;word-break:break-all;color:#e6edf3;margin:2px 0 10px 0';
    res.textContent = 'Çalıştırılıyor…';
    body.appendChild(res);
    body.scrollTop = body.scrollHeight;
    document.getElementById('termCmd').value = '';
    PanelAPI.terminal(cmd).then(r => {
      res.textContent = r.output || '(çıktı yok)';
      if (!r.ok && r.code != null) res.textContent += '\n[çıkış kodu: ' + r.code + ']';
      body.scrollTop = body.scrollHeight;
    }).catch(e => {
      res.textContent = 'Hata: ' + e.message;
      body.scrollTop = body.scrollHeight;
    });
  },

  termLine(cmd) {
    const d = document.createElement('div');
    d.innerHTML = `<span style="color:#3fb950">${esc(realUser())}@pi5</span>:<span style="color:#58a6ff">~</span>$ ${esc(cmd)}`;
    d.style.cssText = 'margin:4px 0 2px 0;color:#c9d1d9';
    return d;
  },

  /* ---------- Cron Jobs (gerçek crontab) ---------- */
  cronJobs() {
    const html = `
      ${this.renderBreadcrumb('Advanced', 'Cron Jobs')}
      <div class="subpage-container">
        ${this.header('⏰ Cron Jobs', 'Gerçek crontab — ' + esc(realUser()) + ' kullanıcısı')}
        <div class="x3-form-box">
          <h3 style="margin-top:0">Crontab Düzenleyici</h3>
          <p style="font-size:13px;color:#667;margin-top:0">Format: <code>dakika saat gün ay haftanıngünü komut</code></p>
          <textarea id="cronEditor" style="width:100%;height:240px;font-family:ui-monospace,monospace;font-size:13px;padding:12px;border:1px solid #dde3ec;border-radius:8px;box-sizing:border-box" spellcheck="false"></textarea>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <button class="btn-x3-primary" onclick="cPanelSubPages.saveCron()">💾 Kaydet</button>
            <button class="btn-x3-sm" onclick="cPanelSubPages.addCronLine()">+ Örnek ekle</button>
            <button class="btn-x3-sm" onclick="cPanelSubPages.loadCron()">🔄 Yenile</button>
            <button class="btn-x3-sm danger" onclick="cPanelSubPages.clearCron()">🗑 Temizle</button>
          </div>
          <div id="cronMsg" style="margin-top:10px;font-size:13px"></div>
        </div>
      </div>`;
    setTimeout(() => this.loadCron(), 50);
    return html;
  },

  loadCron() {
    const ed = document.getElementById('cronEditor');
    if (!ed) return;
    PanelAPI.cron().then(d => {
      ed.value = d.content;
      const msg = document.getElementById('cronMsg');
      if (msg) msg.innerHTML = `<span style="color:#667">📋 ${d.jobs.length} zamanlanmış görev yüklendi</span>`;
    }).catch(e => {
      const msg = document.getElementById('cronMsg');
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  saveCron() {
    const ed = document.getElementById('cronEditor');
    if (!ed) return;
    PanelAPI.saveCron(ed.value).then(() => {
      this.toast('✅ Crontab kaydedildi');
      const msg = document.getElementById('cronMsg');
      if (msg) msg.innerHTML = '<span style="color:#27ae60">✅ Crontab güncellendi</span>';
    }).catch(e => this.toast('❌ ' + e.message));
  },

  addCronLine() {
    const ed = document.getElementById('cronEditor');
    if (!ed) return;
    const samples = [
      '# her gün 02:30 yedek al\n30 2 * * * tar -czf /home/' + realUser() + '/backup_$(date +\\%Y\\%m\\%d).tar.gz /home/' + realUser() + '/Documents\n',
      '# her 5 dakikada bir betik çalıştır\n*/5 * * * * /home/' + realUser() + '/.local/bin/check.sh\n',
      '# her pazartesi 09:00 rapor gönder\n0 9 * * 1 echo "Haftalık rapor" | mail -s "Rapor" admin@example.com\n'
    ];
    ed.value += samples[Math.floor(Math.random() * samples.length)];
    this.toast('📝 Örnek satır eklendi');
  },

  clearCron() {
    if (!confirm('Tüm crontab temizlensin mi?')) return;
    PanelAPI.saveCron('').then(() => {
      const ed = document.getElementById('cronEditor');
      if (ed) ed.value = '';
      this.toast('🗑 Crontab temizlendi');
    }).catch(e => this.toast('❌ ' + e.message));
  },

  /* ---------- Process Manager (gerçek ps) ---------- */
  processManager() {
    const html = `
      ${this.renderBreadcrumb('Advanced', 'Process Manager')}
      <div class="subpage-container">
        ${this.header('⚡ Process Manager', 'Gerçek proses listesi (CPU kullanımına göre sıralı)')}
        <div class="x3-form-box" style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
          <input type="text" id="procFilter" class="x3-input" placeholder="Proses ara… (örn: node, python)" style="flex:1" oninput="cPanelSubPages.loadProcesses()">
          <button class="btn-x3-primary" onclick="cPanelSubPages.loadProcesses()">🔄 Yenile</button>
        </div>
        <div id="procBody">${loadingBox('Prosesler listeleniyor…')}</div>
      </div>`;
    setTimeout(() => this.loadProcesses(), 50);
    return html;
  },

  loadProcesses() {
    const body = document.getElementById('procBody');
    if (!body) return;
    body.innerHTML = loadingBox('Prosesler listeleniyor…');
    PanelAPI.processes().then(d => {
      const q = ((document.getElementById('procFilter') || {}).value || '').toLowerCase();
      const list = d.processes.filter(p => !q || p.cmd.toLowerCase().includes(q) || (p.user || '').toLowerCase().includes(q) || ('' + p.pid).includes(q));
      const rows = list.map(p => `
        <tr>
          <td style="padding:6px 8px"><code>${p.pid}</code></td>
          <td style="padding:6px 8px;color:#667;font-size:13px">${esc(p.user)}</td>
          <td style="padding:6px 8px"><strong>${p.cpu}%</strong></td>
          <td style="padding:6px 8px">${p.mem}%</td>
          <td style="padding:6px 8px;color:#889;font-size:12px">${p.rssH}</td>
          <td style="padding:6px 8px;color:#889;font-size:12px">${esc(p.etime)}</td>
          <td style="padding:6px 8px;font-size:12px;color:#556;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.cmd)}</td>
          <td style="padding:6px 8px;text-align:right"><button class="btn-x3-sm danger" onclick="cPanelSubPages.killProc(${p.pid})">✕</button></td>
        </tr>`).join('');
      body.innerHTML = `
        <div class="x3-form-box" style="padding:10px 16px;margin-bottom:10px;font-size:13px;color:#667">
          <strong>${list.length}</strong> proses ${q ? '· filtre: "' + esc(q) + '"' : ''} · en üstte en yüksek CPU
        </div>
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:8px">PID</th><th style="padding:8px">Kullanıcı</th><th style="padding:8px">CPU</th><th style="padding:8px">MEM</th><th style="padding:8px">RSS</th><th style="padding:8px">Süre</th><th style="padding:8px">Komut</th><th style="padding:8px;text-align:right">Kill</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="8" style="padding:20px;text-align:center;color:#889">Proses bulunamadı</td></tr>'}</tbody>
          </table>
        </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  killProc(pid) {
    if (!confirm('Proses ' + pid + ' sonlandırılsın mı? (SIGTERM)')) return;
    PanelAPI.killProcess(pid, 'TERM').then(() => {
      this.toast('✅ Proses ' + pid + ' sonlandırıldı');
      this.loadProcesses();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  /* ---------- Error Logs (gerçek journalctl) ---------- */
  errors() {
    const html = `
      ${this.renderBreadcrumb('Logs', 'Error Logs')}
      <div class="subpage-container">
        ${this.header('🐞 Error Logs', 'Sistem hata logları (journalctl)')}
        <div class="x3-form-box" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="text" id="logUnit" class="x3-input" placeholder="Servis (örn: nginx, docker, mariadb) — boş = tüm sistem" style="flex:1;min-width:200px" onkeydown="if(event.key==='Enter')cPanelSubPages.loadErrors()">
          <button class="btn-x3-primary" onclick="cPanelSubPages.loadErrors()">🔍 Getir</button>
        </div>
        <div id="logBody">${loadingBox('Loglar okunuyor…')}</div>
      </div>`;
    setTimeout(() => this.loadErrors(), 50);
    return html;
  },

  loadErrors() {
    const body = document.getElementById('logBody');
    if (!body) return;
    const unit = (document.getElementById('logUnit') || {}).value || '';
    body.innerHTML = loadingBox('Loglar okunuyor…');
    PanelAPI.logs(unit, 300).then(d => {
      const lines = (d.logs || '').trim().split('\n').filter(Boolean);
      const last = lines.slice(-200);
      body.innerHTML = `
        <div class="x3-form-box" style="padding:0;overflow:hidden">
          <div style="background:#0d1117;color:#c9d1d9;font-family:ui-monospace,monospace;font-size:12px;padding:14px;height:480px;overflow-y:auto;line-height:1.6;white-space:pre-wrap;word-break:break-all">
            ${last.map(l => {
              const color = /error|fail|fatal|panic/i.test(l) ? '#f85149' : /warn|timeout/i.test(l) ? '#d29922' : '#c9d1d9';
              return `<div style="color:${color}">${esc(l)}</div>`;
            }).join('') || '<div style="color:#8b949e">Log yok</div>'}
          </div>
        </div>
        <div class="x3-form-box" style="margin-top:10px;padding:10px 14px;font-size:12px;color:#667">📄 ${lines.length} satır (son 200 gösteriliyor)</div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  /* ---------- Disk Usage (gerçek du) ---------- */
  diskUsage() {
    const html = `
      ${this.renderBreadcrumb('Files', 'Disk Space Usage')}
      <div class="subpage-container">
        ${this.header('📊 Disk Space Usage', 'Gerçek disk kullanımı')}
        <div class="x3-form-box" style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
          <input type="text" id="duPath" class="x3-input" style="flex:1;font-family:monospace" value="/home/${realUser()}" onkeydown="if(event.key==='Enter')cPanelSubPages.loadDiskUsage()">
          <button class="btn-x3-primary" onclick="cPanelSubPages.loadDiskUsage()">🔍 Analiz</button>
        </div>
        <div id="duBody">${loadingBox('Disk kullanımı analiz ediliyor…')}</div>
      </div>`;
    setTimeout(() => this.loadDiskUsage(), 50);
    return html;
  },

  loadDiskUsage() {
    const body = document.getElementById('duBody');
    if (!body) return;
    const p = (document.getElementById('duPath') || {}).value || '/home/' + realUser();
    body.innerHTML = loadingBox('Analiz ediliyor (büyük dizinlerde birkaç saniye sürebilir)…');
    PanelAPI.disk(p).then(d => {
      const maxSize = d.items.length ? d.items[0].size : 1;
      const bars = d.items.map(it => `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;gap:10px">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><code>${esc(it.path)}</code></span>
            <strong style="white-space:nowrap">${it.sizeH}</strong>
          </div>
          <div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${Math.max(2, Math.round((it.size / maxSize) * 100))}%;background:#2980b9"></div></div>
        </div>`).join('');
      const diskRows = d.disks.map(x => `
        <tr><td style="padding:6px 10px"><code>${esc(x.fs)}</code></td><td style="padding:6px 10px">${esc(x.mount)}</td><td style="padding:6px 10px">${fmtBytes(x.size)}</td><td style="padding:6px 10px">${fmtBytes(x.used)}</td><td style="padding:6px 10px">${fmtBytes(x.avail)}</td><td style="padding:6px 10px"><strong>${esc(x.pct)}</strong></td></tr>`).join('');
      body.innerHTML = `
        <div class="x3-form-box">
          <h3 style="margin-top:0">Bölümler</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:8px 10px">Dosya Sistemi</th><th style="padding:8px 10px">Bağlama</th><th style="padding:8px 10px">Toplam</th><th style="padding:8px 10px">Kullanılan</th><th style="padding:8px 10px">Boş</th><th style="padding:8px 10px">%</th></tr></thead>
            <tbody>${diskRows}</tbody>
          </table>
        </div>
        <div class="x3-form-box" style="margin-top:12px">
          <h3 style="margin-top:0">En Büyük Klasörler — <code>${esc(d.path)}</code></h3>
          ${bars || '<div style="color:#889;font-size:13px">Veri yok</div>'}
        </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  /* ---------- MySQL (gerçek mariadb) ---------- */
  mysql() {
    const html = `
      ${this.renderBreadcrumb('Databases', 'MySQL Databases')}
      <div class="subpage-container">
        ${this.header('🗄️ MySQL Databases', 'MariaDB durumu ve veritabanları')}
        <div id="myBody">${loadingBox('MySQL durumu kontrol ediliyor…')}</div>
      </div>`;
    PanelAPI.mysql().then(d => {
      const el = document.getElementById('myBody');
      if (!el) return;
      if (!d.active) {
        el.innerHTML = errBox('MariaDB servisi kapalı. Services modülünden başlatabilirsiniz.');
        return;
      }
      const rows = d.databases.map(db => `
        <tr><td style="padding:8px 10px"><code>${esc(db)}</code></td><td style="padding:8px 10px;text-align:right"><span class="badge-active">● Aktif</span></td></tr>`).join('');
      el.innerHTML = `
        <div class="x3-form-box" style="margin-bottom:12px;display:flex;gap:20px;flex-wrap:wrap;font-size:14px">
          <div><span style="color:#667">Durum:</span> <span class="badge-active">● Çalışıyor</span></div>
          <div><span style="color:#667">Sürüm:</span> <code>${esc(d.version || '—')}</code></div>
          <div><span style="color:#667">Tablo sayısı:</span> <code>${d.tables || '—'}</code></div>
        </div>
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:10px">Veritabanı</th><th style="padding:10px;text-align:right">Durum</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="2" style="padding:20px;text-align:center;color:#889">Veritabanı yok — phpMyAdmin veya komut satırından oluşturabilirsiniz</td></tr>'}</tbody>
          </table>
        </div>
        <div class="x3-form-box" style="margin-top:12px;padding:12px 16px;font-size:13px;color:#667">
          💡 Yeni veritabanı: <code>mysql -u root -e "CREATE DATABASE yeni_db;"</code>
        </div>`;
    }).catch(e => {
      const el = document.getElementById('myBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  },

  /* ---------- Resource Usage (gerçek) ---------- */
  resourceUsage() {
    const html = `
      ${this.renderBreadcrumb('Logs', 'Resource Usage')}
      <div class="subpage-container">
        ${this.header('📈 Resource Usage', 'Gerçek zamanlı kaynak kullanımı')}
        <div id="ruBody">${loadingBox('Ölçüm alınıyor…')}</div>
      </div>`;
    PanelAPI.stats().then(s => {
      const el = document.getElementById('ruBody');
      if (!el) return;
      el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">
          <div class="x3-form-box" style="margin:0;text-align:center">
            <div style="font-size:38px;font-weight:700;color:#e8740c">${s.cpu.usage}%</div>
            <div style="color:#667;font-size:13px">CPU Kullanımı</div>
            <div style="margin-top:8px"><div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${s.cpu.usage}%;background:#e8740c"></div></div></div>
          </div>
          <div class="x3-form-box" style="margin:0;text-align:center">
            <div style="font-size:38px;font-weight:700;color:#27ae60">${s.memory.pct}%</div>
            <div style="color:#667;font-size:13px">RAM Kullanımı</div>
            <div style="margin-top:8px"><div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${s.memory.pct}%;background:#27ae60"></div></div></div>
          </div>
          <div class="x3-form-box" style="margin:0;text-align:center">
            <div style="font-size:38px;font-weight:700;color:#2980b9">${s.disk.pct}%</div>
            <div style="color:#667;font-size:13px">Disk Kullanımı</div>
            <div style="margin-top:8px"><div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${s.disk.pct}%;background:#2980b9"></div></div></div>
          </div>
        </div>
        <div class="x3-form-box" style="margin-top:14px">
          <h3 style="margin-top:0">Detaylar</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#667">RAM</td><td>${fmtBytes(s.memory.used)} / ${fmtBytes(s.memory.total)} (${s.memory.pct}%)</td></tr>
            <tr><td style="padding:6px 0;color:#667">Disk</td><td>${fmtBytes(s.disk.used)} / ${fmtBytes(s.disk.total)} (${s.disk.pct}%)</td></tr>
            <tr><td style="padding:6px 0;color:#667">Load Average (1/5/15 dk)</td><td>${s.load.join(' / ')}</td></tr>
            <tr><td style="padding:6px 0;color:#667">CPU Modeli</td><td>${esc(s.cpu.model)}</td></tr>
            <tr><td style="padding:6px 0;color:#667">Çekirdek Sayısı</td><td>${s.cpu.cores}</td></tr>
            <tr><td style="padding:6px 0;color:#667">Sıcaklık</td><td>${s.temp != null ? s.temp + '°C' : '—'}</td></tr>
          </table>
          <div style="margin-top:12px"><button class="btn-x3-primary" onclick="cPanelSubPages.resourceUsage()">🔄 Yenile</button></div>
        </div>`;
    }).catch(e => {
      const el = document.getElementById('ruBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  },

  /* ---------- CPU / Concurrent (gerçek load) ---------- */
  cpuConcurrent() {
    const html = `
      ${this.renderBreadcrumb('Logs', 'CPU / Concurrent Connections')}
      <div class="subpage-container">
        ${this.header('🔄 CPU / Concurrent Connections', 'Gerçek yük ve bağlantı durumu')}
        <div id="cpuBody">${loadingBox('Ölçüm alınıyor…')}</div>
      </div>`;
    Promise.all([PanelAPI.stats(), PanelAPI.network()]).then(([s, n]) => {
      const el = document.getElementById('cpuBody');
      if (!el) return;
      const listening = n.conns.filter(c => c.state === 'LISTEN').length;
      const established = n.conns.filter(c => c.state === 'ESTAB').length;
      el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">
          <div class="x3-form-box" style="margin:0;text-align:center">
            <div style="font-size:38px;font-weight:700;color:#e8740c">${s.load[0]}</div>
            <div style="color:#667;font-size:13px">Load (1 dk)</div>
          </div>
          <div class="x3-form-box" style="margin:0;text-align:center">
            <div style="font-size:38px;font-weight:700;color:#2980b9">${s.cpu.usage}%</div>
            <div style="color:#667;font-size:13px">CPU Kullanımı</div>
          </div>
          <div class="x3-form-box" style="margin:0;text-align:center">
            <div style="font-size:38px;font-weight:700;color:#27ae60">${listening}</div>
            <div style="color:#667;font-size:13px">Dinleyen Port</div>
          </div>
          <div class="x3-form-box" style="margin:0;text-align:center">
            <div style="font-size:38px;font-weight:700;color:#8e44ad">${established}</div>
            <div style="color:#667;font-size:13px">Aktif Bağlantı</div>
          </div>
        </div>
        <div class="x3-form-box" style="margin-top:14px">
          <h3 style="margin-top:0">Load Average Tarihçesi</h3>
          <div style="display:flex;align-items:flex-end;gap:20px;height:100px;padding:10px 0">
            ${s.load.map((l, i) => {
              const h = Math.min(90, l * 40);
              const labels = ['1 dk', '5 dk', '15 dk'];
              return `<div style="text-align:center">
                <div style="width:50px;background:${i === 0 ? '#e8740c' : '#2980b9'};height:${h}px;border-radius:4px 4px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;color:#fff;font-size:12px;font-weight:700">${l}</div>
                <div style="font-size:11px;color:#667;margin-top:4px">${labels[i]}</div>
              </div>`;
            }).join('')}
          </div>
          <div style="font-size:12px;color:#667">Not: Çekirdek sayısı = ${s.cpu.cores} → load ${s.cpu.cores}'in altında olmalı</div>
          <div style="margin-top:12px"><button class="btn-x3-primary" onclick="cPanelSubPages.cpuConcurrent()">🔄 Yenile</button></div>
        </div>`;
    }).catch(e => {
      const el = document.getElementById('cpuBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  },

  /* ---------- Visitors (gerçek log) ---------- */
  visitors() {
    const html = `
      ${this.renderBreadcrumb('Logs', 'Latest Visitors')}
      <div class="subpage-container">
        ${this.header('👀 Latest Visitors', 'Son erişim kayıtları (auth.log + web logları)')}
        <div id="visBody">${loadingBox('Loglar taranıyor…')}</div>
      </div>`;
    PanelAPI.terminal('tail -n 60 /var/log/auth.log 2>/dev/null || journalctl -n 60 --no-pager 2>&1', 10000).then(r => {
      const el = document.getElementById('visBody');
      if (!el) return;
      const lines = (r.output || '').trim().split('\n').filter(Boolean).slice(-50);
      el.innerHTML = `
        <div class="x3-form-box" style="padding:0;overflow:hidden">
          <div style="background:#0d1117;color:#c9d1d9;font-family:ui-monospace,monospace;font-size:12px;padding:14px;height:440px;overflow-y:auto;line-height:1.6;white-space:pre-wrap;word-break:break-all">
            ${lines.map(l => {
              const color = /Accepted|session opened/i.test(l) ? '#3fb950' : /Failed|invalid/i.test(l) ? '#f85149' : '#c9d1d9';
              return `<div style="color:${color}">${esc(l)}</div>`;
            }).join('')}
          </div>
        </div>
        <div class="x3-form-box" style="margin-top:10px;padding:10px 14px;font-size:12px;color:#667">
          📄 /var/log/auth.log — son 60 satır (yeşil: başarılı giriş, kırmızı: başarısız)
        </div>`;
    }).catch(e => {
      const el = document.getElementById('visBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  },

  /* ---------- Bandwidth (gerçek rx/tx) ---------- */
  bandwidth() {
    const html = `
      ${this.renderBreadcrumb('Logs', 'Bandwidth')}
      <div class="subpage-container">
        ${this.header('📡 Bandwidth', 'Ağ arayüzü trafiği (kümülatif rx/tx)')}
        <div id="bwBody">${loadingBox('Trafik ölçülüyor…')}</div>
      </div>`;
    PanelAPI.network().then(d => {
      const el = document.getElementById('bwBody');
      if (!el) return;
      const real = d.ifaces.filter(i => i.name !== 'lo' && !i.name.startsWith('veth') && !i.name.startsWith('br-') && i.name !== 'docker0');
      const rows = real.map(i => `
        <tr>
          <td style="padding:9px 10px"><strong>${esc(i.name)}</strong> ${i.state === 'UP' ? '<span class="badge-active">● UP</span>' : '<span class="badge-warn">● ' + esc(i.state) + '</span>'}</td>
          <td style="padding:9px 10px">${esc((i.ips || []).join(', ') || '—')}</td>
          <td style="padding:9px 10px;text-align:right;color:#27ae60">⬇ ${fmtBytes(i.rx)}</td>
          <td style="padding:9px 10px;text-align:right;color:#e8740c">⬆ ${fmtBytes(i.tx)}</td>
          <td style="padding:9px 10px;text-align:right;color:#667">${fmtBytes((i.rx || 0) + (i.tx || 0))}</td>
        </tr>`).join('');
      el.innerHTML = `
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:10px">Arayüz</th><th style="padding:10px">IP</th><th style="padding:10px;text-align:right">Alınan</th><th style="padding:10px;text-align:right">Gönderilen</th><th style="padding:10px;text-align:right">Toplam</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#889">Fiziksel arayüz bulunamadı</td></tr>'}</tbody>
          </table>
        </div>
        <div class="x3-form-box" style="margin-top:12px;padding:12px 16px;font-size:12px;color:#667">
          📡 Kümülatif sayaçlar (açılıştan beri). Gerçek zamanlı izleme için: <code>sudo apt install vnstat</code> → <code>vnstat -l</code>
        </div>`;
    }).catch(e => {
      const el = document.getElementById('bwBody');
      if (el) el.innerHTML = errBox(e.message);
    });
    return html;
  }
});
