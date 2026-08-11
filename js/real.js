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

/* ============================================================
 * WHM MODÜLLERİ — Domain / Reseller / Paket Yönetimi
 * ============================================================ */
Object.assign(cPanelSubPages, {

  /* ---------- Hosting Packages ---------- */
  packages() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Hosting Packages')}
      <div class="subpage-container">
        ${this.header('📦 Hosting Packages', 'Hosting planları oluşturun ve yönetin')}
        <div class="x3-form-box">
          <h3 style="margin-top:0">Yeni Paket Oluştur</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">
            <div><label style="font-size:12px;color:#667">Paket Adı *</label><input type="text" id="pkgName" class="x3-input" placeholder="örn: Basic"></div>
            <div><label style="font-size:12px;color:#667">Disk (GB)</label><input type="number" id="pkgDisk" class="x3-input" value="5" min="0"></div>
            <div><label style="font-size:12px;color:#667">Domain Sayısı</label><input type="number" id="pkgDomains" class="x3-input" value="3" min="0"></div>
            <div><label style="font-size:12px;color:#667">E-posta Sayısı</label><input type="number" id="pkgEmails" class="x3-input" value="5" min="0"></div>
            <div><label style="font-size:12px;color:#667">Bant Genişliği (GB)</label><input type="number" id="pkgBW" class="x3-input" value="10" min="0"></div>
            <div><label style="font-size:12px;color:#667">Fiyat (₺)</label><input type="number" id="pkgPrice" class="x3-input" value="0" min="0"></div>
          </div>
          <div style="margin-top:10px"><button class="btn-x3-primary" onclick="cPanelSubPages.createPackage()">📦 Paket Oluştur</button></div>
          <div id="pkgMsg" style="margin-top:8px;font-size:13px"></div>
        </div>
        <div id="pkgBody" style="margin-top:14px">${loadingBox('Paketler yükleniyor…')}</div>
      </div>`;
    setTimeout(() => this.loadPackages(), 50);
    return html;
  },

  createPackage() {
    const pkg = {
      name: document.getElementById('pkgName').value.trim(),
      diskGB: +document.getElementById('pkgDisk').value || 0,
      domains: +document.getElementById('pkgDomains').value || 0,
      emails: +document.getElementById('pkgEmails').value || 0,
      bandwidthGB: +document.getElementById('pkgBW').value || 0,
      price: +document.getElementById('pkgPrice').value || 0
    };
    if (!pkg.name) { this.toast('Paket adı gerekli'); return; }
    PanelAPI.addPackage(pkg).then(() => {
      this.toast('✅ Paket oluşturuldu: ' + pkg.name);
      this.loadPackages();
      ['pkgName'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }).catch(e => this.toast('❌ ' + e.message));
  },

  loadPackages() {
    const body = document.getElementById('pkgBody');
    if (!body) return;
    PanelAPI.getPackages().then(d => {
      body.innerHTML = d.packages.length === 0
        ? '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px">Henüz paket yok — yukarıdan oluşturun</div>'
        : `<div class="x3-form-box" style="padding:0;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:10px 8px">Paket</th><th style="padding:10px 8px">Disk</th><th style="padding:10px 8px">Domain</th><th style="padding:10px 8px">E-posta</th><th style="padding:10px 8px">Bant</th><th style="padding:10px 8px">Fiyat</th><th style="padding:10px 8px;text-align:right">Aksiyon</th></tr></thead>
              <tbody>${d.packages.map(p => `
                <tr>
                  <td style="padding:9px 8px"><strong>${esc(p.name)}</strong></td>
                  <td style="padding:9px 8px">${p.diskGB} GB</td>
                  <td style="padding:9px 8px">${p.domains || '∞'}</td>
                  <td style="padding:9px 8px">${p.emails || '∞'}</td>
                  <td style="padding:9px 8px">${p.bandwidthGB || '∞'} GB</td>
                  <td style="padding:9px 8px">${p.price > 0 ? p.price + ' ₺' : 'Ücretsiz'}</td>
                  <td style="padding:9px 8px;text-align:right">
                    <button class="btn-x3-sm danger" onclick="cPanelSubPages.deletePkg('${esc(p.name)}')">🗑</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  deletePkg(name) {
    if (!confirm(`"${name}" paketi silinsin mi?`)) return;
    PanelAPI.deletePackage(name).then(() => {
      this.toast('🗑 Paket silindi');
      this.loadPackages();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  /* ---------- Reseller Manager ---------- */
  resellers() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Reseller Manager')}
      <div class="subpage-container">
        ${this.header('👥 Reseller Manager', 'Hosting reseller kullanıcıları yönetimi')}
        <div class="x3-form-box">
          <h3 style="margin-top:0">Yeni Reseller Oluştur</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">
            <div><label style="font-size:12px;color:#667">Kullanıcı Adı *</label><input type="text" id="rUser" class="x3-input" placeholder="örn: ali"></div>
            <div><label style="font-size:12px;color:#667">Parola *</label><input type="text" id="rPass" class="x3-input" placeholder="en az 6 karakter"></div>
            <div><label style="font-size:12px;color:#667">Paket *</label><select id="rPkg" class="x3-input"></select></div>
            <div><label style="font-size:12px;color:#667">E-posta</label><input type="email" id="rEmail" class="x3-input" placeholder="opsiyonel"></div>
          </div>
          <div style="margin-top:10px"><button class="btn-x3-primary" onclick="cPanelSubPages.createReseller()">➕ Reseller Oluştur</button></div>
          <div id="rMsg" style="margin-top:8px;font-size:13px"></div>
        </div>
        <div id="rBody" style="margin-top:14px">${loadingBox('Reseller\'lar yükleniyor…')}</div>
      </div>`;
    setTimeout(() => this.loadResellers(), 50);
    return html;
  },

  loadResellers() {
    const body = document.getElementById('rBody');
    const pkgSel = document.getElementById('rPkg');
    PanelAPI.getPackages().then(d => {
      if (pkgSel) pkgSel.innerHTML = d.packages.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('') || '<option value="">Paket yok — önce oluşturun</option>';
    }).catch(() => {});
    if (!body) return;
    PanelAPI.getResellers().then(d => {
      body.innerHTML = d.resellers.length === 0
        ? '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px">Henüz reseller yok</div>'
        : `<div class="x3-form-box" style="padding:0;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:10px 8px">Kullanıcı</th><th style="padding:10px 8px">Paket</th><th style="padding:10px 8px">Domain</th><th style="padding:10px 8px">Disk</th><th style="padding:10px 8px">Durum</th><th style="padding:10px 8px;text-align:right">Aksiyon</th></tr></thead>
              <tbody>${d.resellers.map(r => `
                <tr>
                  <td style="padding:9px 8px"><strong>${esc(r.username)}</strong></td>
                  <td style="padding:9px 8px"><span class="badge-active">${esc(r.package)}</span></td>
                  <td style="padding:9px 8px">${r.domainCount} ${r.packageInfo && r.packageInfo.domains ? '/ ' + r.packageInfo.domains : ''}</td>
                  <td style="padding:9px 8px">${r.diskUsedH}</td>
                  <td style="padding:9px 8px">${r.exists ? '<span class="badge-active">● Aktif</span>' : '<span class="badge-warn">● Sistemde yok</span>'}</td>
                  <td style="padding:9px 8px;text-align:right">
                    <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteReseller('${esc(r.username)}')">🗑</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  createReseller() {
    const u = document.getElementById('rUser').value.trim();
    const p = document.getElementById('rPass').value;
    const pkg = document.getElementById('rPkg').value;
    const em = document.getElementById('rEmail').value.trim();
    if (!u || !p || !pkg) { this.toast('Kullanıcı adı, parola ve paket zorunludur'); return; }
    PanelAPI.addReseller({ username: u, password: p, package: pkg, email: em }).then(() => {
      this.toast('✅ Reseller oluşturuldu: ' + u);
      this.loadResellers();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  deleteReseller(name) {
    if (!confirm(`"${name}" reseller'ı silinsin mi?\n\n⚠️ Tüm domain'leri ve verileri de silinecektir!`)) return;
    PanelAPI.deleteReseller(name).then(d => {
      this.toast('🗑 Silindi — ' + (d.removedDomains || 0) + ' domain kaldırıldı');
      this.loadResellers();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  /* ---------- Domain Manager ---------- */
  domains() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Domain Manager')}
      <div class="subpage-container">
        ${this.header('🌍 Domain Manager', 'Nginx vhost ile gerçek domain yönetimi')}
        <div class="x3-form-box">
          <h3 style="margin-top:0">Yeni Domain Ekle</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
            <div><label style="font-size:12px;color:#667">Domain Adı *</label><input type="text" id="dmName" class="x3-input" placeholder="örn: sitem.com"></div>
            <div><label style="font-size:12px;color:#667">Reseller</label><select id="dmReseller" class="x3-input"><option value="">— yok —</option></select></div>
            <div><label style="font-size:12px;color:#667">Kök Dizin</label><input type="text" id="dmRoot" class="x3-input" placeholder="otomatik oluşturulur"></div>
          </div>
          <div style="margin-top:10px"><button class="btn-x3-primary" onclick="cPanelSubPages.createDomain()">🌍 Domain Ekle</button></div>
          <div id="dmMsg" style="margin-top:8px;font-size:13px"></div>
        </div>
        <div id="dmBody" style="margin-top:14px">${loadingBox('Domain\'ler yükleniyor…')}</div>
      </div>`;
    setTimeout(() => this.loadDomains(), 50);
    return html;
  },

  loadDomains() {
    const body = document.getElementById('dmBody');
    const resSel = document.getElementById('dmReseller');
    PanelAPI.getResellers().then(d => {
      if (resSel) {
        const existing = resSel.value;
        resSel.innerHTML = '<option value="">— yok —</option>' + d.resellers.map(r => `<option value="${esc(r.username)}">${esc(r.username)} (${esc(r.package)})</option>`).join('');
        if (existing) resSel.value = existing;
      }
    }).catch(() => {});
    if (!body) return;
    PanelAPI.getDomains().then(d => {
      body.innerHTML = d.domains.length === 0
        ? '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px">Henüz domain yok</div>'
        : `<div class="x3-form-box" style="padding:0;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:10px 8px">Domain</th><th style="padding:10px 8px">Reseller</th><th style="padding:10px 8px">Dizin</th><th style="padding:10px 8px">Vhost</th><th style="padding:10px 8px">Disk</th><th style="padding:10px 8px;text-align:right">Aksiyon</th></tr></thead>
              <tbody>${d.domains.map(dm => `
                <tr>
                  <td style="padding:9px 8px"><strong>${esc(dm.name)}</strong></td>
                  <td style="padding:9px 8px;color:#667">${esc(dm.reseller || '—')}</td>
                  <td style="padding:9px 8px;font-size:11px;color:#889;font-family:monospace">${esc(dm.root)}</td>
                  <td style="padding:9px 8px">${dm.vhost ? '<span class="badge-active">● Aktif</span>' : '<span class="badge-warn">● Yok</span>'}</td>
                  <td style="padding:9px 8px">${dm.diskUsedH}</td>
                  <td style="padding:9px 8px;text-align:right">
                    <button class="btn-x3-sm" onclick="cPanelSubPages.visitDomain('${esc(dm.name)}')">🌐</button>
                    <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteDomain('${esc(dm.name)}')">🗑</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  createDomain() {
    const name = document.getElementById('dmName').value.trim();
    const res = document.getElementById('dmReseller').value;
    const root = document.getElementById('dmRoot').value.trim();
    if (!name) { this.toast('Domain adı gerekli'); return; }
    const data = { name };
    if (res) data.reseller = res;
    if (root) data.root = root;
    PanelAPI.addDomain(data).then(d => {
      this.toast('✅ Domain eklendi: ' + name + (d.nginx === 'reloaded' ? ' (nginx reload ✓)' : ''));
      this.loadDomains();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  deleteDomain(name) {
    if (!confirm(`"${name}" domain'i silinsin mi?\n\nNginx vhost ve /etc/hosts kaydı da kaldırılacaktır.`)) return;
    PanelAPI.deleteDomain(name).then(() => {
      this.toast('🗑 Domain silindi: ' + name);
      this.loadDomains();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  visitDomain(name) {
    window.open('http://' + name, '_blank');
  }
});

/* ============================================================
 * GERÇEK WHM MODÜLLERİ — cPanel WHM menü yapısı
 * Account Functions · Packages · Resellers · DNS Functions
 * ============================================================ */
Object.assign(cPanelSubPages, {

  /* ======================================================
   * ACCOUNT FUNCTIONS
   * ====================================================== */

  /* ---------- Create a New Account (WHM formu) ---------- */
  createAccount() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Account Functions » Create a New Account')}
      <div class="subpage-container">
        ${this.header('➕ Create a New Account', 'Yeni hosting hesabı oluşturun — gerçek sistem kullanıcısı + domain + paket')}
        <div class="x3-form-box">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
            <div><label style="font-size:12px;color:#667">Domain *</label><input type="text" id="caDomain" class="x3-input" placeholder="ornek.com"></div>
            <div><label style="font-size:12px;color:#667">Kullanıcı Adı *</label><input type="text" id="caUser" class="x3-input" placeholder="kullanici"></div>
            <div><label style="font-size:12px;color:#667">Parola *</label><input type="text" id="caPass" class="x3-input" placeholder="en az 6 karakter"></div>
            <div><label style="font-size:12px;color:#667">Paket *</label><select id="caPkg" class="x3-input"></select></div>
            <div><label style="font-size:12px;color:#667">E-posta</label><input type="email" id="caEmail" class="x3-input" placeholder="opsiyonel"></div>
            <div><label style="font-size:12px;color:#667">Kök Dizin</label><input type="text" id="caRoot" class="x3-input" placeholder="otomatik: /home/kullanici/public_html"></div>
          </div>
          <div style="margin-top:14px;display:flex;gap:10px;align-items:center">
            <button class="btn-x3-primary" onclick="cPanelSubPages.createAccountSubmit()">➕ Hesap Oluştur</button>
            <span style="font-size:12px;color:#889">Domain girilirse nginx vhost + DNS zone otomatik oluşturulur</span>
          </div>
          <div id="caMsg" style="margin-top:10px;font-size:13px"></div>
        </div>
      </div>`;
    setTimeout(() => this.loadCaPkgs(), 50);
    return html;
  },

  loadCaPkgs() {
    const sel = document.getElementById('caPkg');
    if (!sel) return;
    PanelAPI.getPackages().then(d => {
      sel.innerHTML = d.packages.map(p => `<option value="${esc(p.name)}">${esc(p.name)} (${p.diskGB}GB / ${p.domains || '∞'} domain)</option>`).join('') || '<option value="">Önce paket oluşturun (Add a Package)</option>';
    }).catch(() => {});
  },

  createAccountSubmit() {
    const domain = document.getElementById('caDomain').value.trim().toLowerCase();
    const user = document.getElementById('caUser').value.trim().toLowerCase();
    const pass = document.getElementById('caPass').value;
    const pkg = document.getElementById('caPkg').value;
    const email = document.getElementById('caEmail').value.trim();
    const root = document.getElementById('caRoot').value.trim();
    const msg = document.getElementById('caMsg');
    if (!domain || !user || !pass || !pkg) {
      if (msg) msg.innerHTML = '<span style="color:#c0392b">Domain, kullanıcı adı, parola ve paket zorunludur</span>';
      return;
    }
    if (msg) msg.innerHTML = '<span style="color:#667">⏳ Hesap oluşturuluyor… (sistem kullanıcısı + domain + vhost)</span>';
    // 1) reseller (sistem kullanıcısı)
    PanelAPI.addReseller({ username: user, password: pass, package: pkg, email }).then(() => {
      // 2) domain + vhost
      const data = { name: domain, reseller: user };
      if (root) data.root = root;
      return PanelAPI.addDomain(data);
    }).then(d => {
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ Hesap oluşturuldu: <strong>${esc(user)}</strong> — domain <strong>${esc(domain)}</strong> canlı${d.nginx === 'reloaded' ? ' (nginx ✓)' : ''}</span>`;
      this.toast('✅ Hesap oluşturuldu: ' + user + ' @ ' + domain);
      ['caDomain', 'caUser', 'caPass', 'caEmail', 'caRoot'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
      this.toast('❌ ' + e.message);
    });
  },

  /* ---------- List Accounts ---------- */
  listAccounts() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Account Functions » List Accounts')}
      <div class="subpage-container">
        ${this.header('📋 List Accounts', 'Tüm hosting hesapları — kullanıcı, domain, paket, disk')}
        <div class="x3-form-box" style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
          <input type="text" id="laFilter" class="x3-input" placeholder="Hesap ara…" style="flex:1" oninput="cPanelSubPages.loadListAccounts()">
          <button class="btn-x3-primary" onclick="cPanelSubPages.loadListAccounts()">🔄 Yenile</button>
        </div>
        <div id="laBody">${loadingBox('Hesaplar yükleniyor…')}</div>
      </div>`;
    setTimeout(() => this.loadListAccounts(), 50);
    return html;
  },

  loadListAccounts() {
    const body = document.getElementById('laBody');
    if (!body) return;
    const q = ((document.getElementById('laFilter') || {}).value || '').toLowerCase();
    Promise.all([PanelAPI.getResellers(), PanelAPI.getDomains()]).then(([rs, ds]) => {
      const rows = rs.resellers.map(r => {
        const doms = ds.domains.filter(d => d.reseller === r.username);
        const pkg = r.packageInfo;
        return `
          <tr>
            <td style="padding:8px"><strong>${esc(r.username)}</strong></td>
            <td style="padding:8px;font-size:12px">${doms.map(d => esc(d.name)).join('<br>') || '<span style="color:#889">—</span>'}</td>
            <td style="padding:8px"><span class="badge-active">${esc(r.package)}</span></td>
            <td style="padding:8px">${r.diskUsedH} ${pkg ? '/ ' + pkg.diskGB + ' GB' : ''}</td>
            <td style="padding:8px">${r.domainCount} ${pkg && pkg.domains ? '/ ' + pkg.domains : ''}</td>
            <td style="padding:8px">${r.exists ? '<span class="badge-active">●</span>' : '<span class="badge-warn">●</span>'}</td>
            <td style="padding:8px;font-size:11px;color:#889">${esc((r.created || '').slice(0, 10))}</td>
          </tr>`;
      }).join('');
      const filtered = rs.resellers.filter(r => !q || r.username.toLowerCase().includes(q) || (r.package || '').toLowerCase().includes(q));
      body.innerHTML = filtered.length === 0
        ? '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px">Hesap bulunamadı — Create a New Account ile oluşturun</div>'
        : `<div class="x3-form-box" style="padding:10px 16px;margin-bottom:10px;font-size:13px;color:#667"><strong>${filtered.length}</strong> hesap</div>
           <div class="x3-form-box" style="padding:0;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:8px">Kullanıcı</th><th style="padding:8px">Domain'ler</th><th style="padding:8px">Paket</th><th style="padding:8px">Disk</th><th style="padding:8px">Domain Limiti</th><th style="padding:8px">Durum</th><th style="padding:8px">Oluşturma</th></tr></thead>
              <tbody>${filtered.map(r => {
                const doms = ds.domains.filter(d => d.reseller === r.username);
                const pkg = r.packageInfo;
                return `
                <tr>
                  <td style="padding:8px"><strong>${esc(r.username)}</strong></td>
                  <td style="padding:8px;font-size:12px">${doms.map(d => esc(d.name)).join('<br>') || '<span style="color:#889">—</span>'}</td>
                  <td style="padding:8px"><span class="badge-active">${esc(r.package)}</span></td>
                  <td style="padding:8px">${r.diskUsedH} ${pkg ? '/ ' + pkg.diskGB + ' GB' : ''}</td>
                  <td style="padding:8px">${r.domainCount} ${pkg && pkg.domains ? '/ ' + pkg.domains : ''}</td>
                  <td style="padding:8px">${r.exists ? '<span class="badge-active">● Aktif</span>' : '<span class="badge-warn">● Yok</span>'}</td>
                  <td style="padding:8px;font-size:11px;color:#889">${esc((r.created || '').slice(0, 10))}</td>
                </tr>`;
              }).join('')}
              </tbody>
            </table>
          </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  /* ---------- Modify an Account ---------- */
  modifyAccount() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Account Functions » Modify an Account')}
      <div class="subpage-container">
        ${this.header('✏️ Modify an Account', 'Hesap düzenleme — paket, parola, e-posta değişikliği')}
        <div class="x3-form-box" style="margin-bottom:12px">
          <label style="font-size:12px;color:#667">Hesap Seç</label>
          <select id="maSel" class="x3-input" onchange="cPanelSubPages.loadModifyForm()" style="margin-top:4px"></select>
        </div>
        <div id="maBody"></div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getResellers().then(d => {
        const sel = document.getElementById('maSel');
        if (!sel) return;
        sel.innerHTML = d.resellers.map(r => `<option value="${esc(r.username)}">${esc(r.username)} (${esc(r.package)})</option>`).join('');
        if (d.resellers.length) this.loadModifyForm();
      }).catch(() => {});
    }, 50);
    return html;
  },

  loadModifyForm() {
    const sel = document.getElementById('maSel');
    const body = document.getElementById('maBody');
    if (!sel || !body) return;
    const uname = sel.value;
    if (!uname) { body.innerHTML = ''; return; }
    PanelAPI.getResellers().then(d => {
      const r = d.resellers.find(x => x.username === uname);
      if (!r) return;
      PanelAPI.getPackages().then(pd => {
        body.innerHTML = `
          <div class="x3-form-box">
            <h3 style="margin-top:0">Hesap: <code>${esc(r.username)}</code></h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
              <div><label style="font-size:12px;color:#667">Paket (Upgrade/Downgrade)</label>
                <select id="maPkg" class="x3-input">${pd.packages.map(p => `<option value="${esc(p.name)}" ${p.name === r.package ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
              <div><label style="font-size:12px;color:#667">Yeni Parola (boş = değişmez)</label><input type="text" id="maPass" class="x3-input" placeholder="boş bırakın"></div>
              <div><label style="font-size:12px;color:#667">E-posta</label><input type="email" id="maEmail" class="x3-input" value="${esc(r.email || '')}"></div>
            </div>
            <div style="margin-top:14px;display:flex;gap:8px">
              <button class="btn-x3-primary" onclick="cPanelSubPages.modifyAccountSubmit()">💾 Kaydet</button>
              <button class="btn-x3-sm danger" onclick="cPanelSubPages.terminateAccount()">🗑 Terminate</button>
            </div>
            <div id="maMsg" style="margin-top:10px;font-size:13px"></div>
          </div>`;
      }).catch(() => {});
    }).catch(() => {});
  },

  modifyAccountSubmit() {
    const sel = document.getElementById('maSel');
    const msg = document.getElementById('maMsg');
    const data = {};
    const pkg = document.getElementById('maPkg');
    if (pkg) data.package = pkg.value;
    const em = document.getElementById('maEmail');
    if (em) data.email = em.value.trim();
    const pw = document.getElementById('maPass');
    if (pw && pw.value) data.password = pw.value;
    PanelAPI.updateReseller(sel.value, data).then(() => {
      if (msg) msg.innerHTML = '<span style="color:#27ae60">✅ Hesap güncellendi</span>';
      this.toast('✅ Hesap güncellendi: ' + sel.value);
      this.loadModifyForm();
    }).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  /* ---------- Terminate an Account ---------- */
  terminateAccount() {
    const sel = document.getElementById('maSel');
    if (!sel || !sel.value) return;
    const uname = sel.value;
    if (!confirm(`Hesap "${uname}" sonlandırılsın mı?\n\n⚠️ Sistem kullanıcısı, tüm dosyalar ve domain'ler silinecek!`)) return;
    PanelAPI.deleteReseller(uname).then(d => {
      this.toast('🗑 Hesap sonlandırıldı: ' + uname + (d.removedDomains ? ' (' + d.removedDomains + ' domain)' : ''));
      location.reload();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  /* ======================================================
   * PACKAGES
   * ====================================================== */

  /* ---------- Add a Package ---------- */
  addPackage() {
    return this.packageForm('add');
  },

  /* ---------- Edit a Package ---------- */
  editPackage() {
    return this.packageForm('edit');
  },

  /* ---------- Delete a Package ---------- */
  deletePackage() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Packages » Delete a Package')}
      <div class="subpage-container">
        ${this.header('🗑 Delete a Package', 'Paket silme — kullanımdaki paketler silinemez')}
        <div id="dpBody">${loadingBox('Paketler yükleniyor…')}</div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getPackages().then(d => {
        const el = document.getElementById('dpBody');
        if (!el) return;
        el.innerHTML = d.packages.length === 0
          ? '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px">Paket yok</div>'
          : `<div class="x3-form-box" style="padding:0;overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:8px">Paket</th><th style="padding:8px">Disk</th><th style="padding:8px">Domain</th><th style="padding:8px">E-posta</th><th style="padding:8px">Bant</th><th style="padding:8px;text-align:right">Aksiyon</th></tr></thead>
                <tbody>${d.packages.map(p => `
                  <tr>
                    <td style="padding:8px"><strong>${esc(p.name)}</strong></td>
                    <td style="padding:8px">${p.diskGB} GB</td><td style="padding:8px">${p.domains || '∞'}</td><td style="padding:8px">${p.emails || '∞'}</td><td style="padding:8px">${p.bandwidthGB || '∞'} GB</td>
                    <td style="padding:8px;text-align:right"><button class="btn-x3-sm danger" onclick="cPanelSubPages.deletePackageSubmit('${esc(p.name)}')">🗑 Sil</button></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
      }).catch(e => {
        const el = document.getElementById('dpBody');
        if (el) el.innerHTML = errBox(e.message);
      });
    }, 50);
    return html;
  },

  deletePackageSubmit(name) {
    if (!confirm(`"${name}" paketi silinsin mi?`)) return;
    PanelAPI.deletePackage(name).then(() => {
      this.toast('🗑 Paket silindi: ' + name);
      cPanelSubPages.deletePackage();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  /* ---------- List Packages ---------- */
  listPackages() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Packages » List Packages')}
      <div class="subpage-container">
        ${this.header('📦 List Packages', 'Tüm hosting paketleri')}
        <div id="lpBody">${loadingBox('Paketler yükleniyor…')}</div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getPackages().then(d => {
        const el = document.getElementById('lpBody');
        if (!el) return;
        const inUse = name => {
          let n = 0;
          return PanelAPI.getResellers().then(rs => {
            n = rs.resellers.filter(r => r.package === name).length;
            return n;
          });
        };
        Promise.all(d.packages.map(p => inUse(p.name))).then(counts => {
          el.innerHTML = `<div class="x3-form-box" style="padding:0;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556"><th style="padding:8px">Paket</th><th style="padding:8px">Disk</th><th style="padding:8px">Domain</th><th style="padding:8px">E-posta</th><th style="padding:8px">Subdomain</th><th style="padding:8px">Bant</th><th style="padding:8px">Fiyat</th><th style="padding:8px">Kullanım</th></tr></thead>
              <tbody>${d.packages.map((p, i) => `
                <tr>
                  <td style="padding:8px"><strong>${esc(p.name)}</strong></td>
                  <td style="padding:8px">${p.diskGB} GB</td><td style="padding:8px">${p.domains || '∞'}</td><td style="padding:8px">${p.emails || '∞'}</td><td style="padding:8px">${p.subdomains || '∞'}</td><td style="padding:8px">${p.bandwidthGB || '∞'} GB</td><td style="padding:8px">${p.price > 0 ? p.price + ' ₺' : 'Ücretsiz'}</td>
                  <td style="padding:8px">${counts[i] ? counts[i] + ' hesap' : '<span style="color:#889">boşta</span>'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
        });
      }).catch(e => {
        const el = document.getElementById('lpBody');
        if (el) el.innerHTML = errBox(e.message);
      });
    }, 50);
    return html;
  },

  /* ---------- ortak paket formu ---------- */
  packageForm(mode) {
    const isEdit = mode === 'edit';
    const html = `
      ${this.renderBreadcrumb('WHM', 'Packages » ' + (isEdit ? 'Edit a Package' : 'Add a Package'))}
      <div class="subpage-container">
        ${this.header(isEdit ? '✏️ Edit a Package' : '➕ Add a Package', isEdit ? 'Mevcut paketi düzenleyin' : 'Yeni hosting paketi oluşturun')}
        ${isEdit ? `<div class="x3-form-box" style="margin-bottom:12px"><label style="font-size:12px;color:#667">Paket Seç</label><select id="pfSel" class="x3-input" onchange="cPanelSubPages.loadPackageForm()" style="margin-top:4px"></select></div>` : ''}
        <div class="x3-form-box">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px">
            <div><label style="font-size:12px;color:#667">Paket Adı *</label><input type="text" id="pfName" class="x3-input" placeholder="örn: Basic" ${isEdit ? 'readonly style="background:#f0f2f5"' : ''}></div>
            <div><label style="font-size:12px;color:#667">Disk (GB)</label><input type="number" id="pfDisk" class="x3-input" value="5" min="0"></div>
            <div><label style="font-size:12px;color:#667">Domain Sayısı</label><input type="number" id="pfDomains" class="x3-input" value="3" min="0"></div>
            <div><label style="font-size:12px;color:#667">E-posta Sayısı</label><input type="number" id="pfEmails" class="x3-input" value="5" min="0"></div>
            <div><label style="font-size:12px;color:#667">Subdomain Sayısı</label><input type="number" id="pfSub" class="x3-input" value="5" min="0"></div>
            <div><label style="font-size:12px;color:#667">Bant Genişliği (GB)</label><input type="number" id="pfBW" class="x3-input" value="10" min="0"></div>
            <div><label style="font-size:12px;color:#667">Fiyat (₺)</label><input type="number" id="pfPrice" class="x3-input" value="0" min="0"></div>
          </div>
          <div style="margin-top:14px"><button class="btn-x3-primary" onclick="cPanelSubPages.packageFormSubmit('${mode}')">${isEdit ? '💾 Güncelle' : '➕ Oluştur'}</button></div>
          <div id="pfMsg" style="margin-top:8px;font-size:13px"></div>
        </div>
      </div>`;
    if (isEdit) {
      setTimeout(() => {
        PanelAPI.getPackages().then(d => {
          const sel = document.getElementById('pfSel');
          if (!sel) return;
          sel.innerHTML = d.packages.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
          if (d.packages.length) this.loadPackageForm();
        }).catch(() => {});
      }, 50);
    }
    return html;
  },

  loadPackageForm() {
    const sel = document.getElementById('pfSel');
    if (!sel || !sel.value) return;
    PanelAPI.getPackages().then(d => {
      const p = d.packages.find(x => x.name === sel.value);
      if (!p) return;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      set('pfName', p.name); set('pfDisk', p.diskGB); set('pfDomains', p.domains);
      set('pfEmails', p.emails); set('pfSub', p.subdomains); set('pfBW', p.bandwidthGB); set('pfPrice', p.price);
    }).catch(() => {});
  },

  packageFormSubmit(mode) {
    const msg = document.getElementById('pfMsg');
    const data = {
      name: document.getElementById('pfName').value.trim(),
      diskGB: +document.getElementById('pfDisk').value || 0,
      domains: +document.getElementById('pfDomains').value || 0,
      emails: +document.getElementById('pfEmails').value || 0,
      subdomains: +document.getElementById('pfSub').value || 0,
      bandwidthGB: +document.getElementById('pfBW').value || 0,
      price: +document.getElementById('pfPrice').value || 0
    };
    if (!data.name) { if (msg) msg.innerHTML = '<span style="color:#c0392b">Paket adı gerekli</span>'; return; }
    const done = () => {
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ Paket ${mode === 'edit' ? 'güncellendi' : 'oluşturuldu'}: ${esc(data.name)}</span>`;
      this.toast(mode === 'edit' ? '💾 Paket güncellendi' : '✅ Paket oluşturuldu');
      if (mode === 'add') { const el = document.getElementById('pfName'); if (el) el.value = ''; }
      else this.loadPackageForm();
    };
    const req = mode === 'edit'
      ? PanelAPI.updatePackage(data.name, { diskGB: data.diskGB, domains: data.domains, emails: data.emails, subdomains: data.subdomains, bandwidthGB: data.bandwidthGB, price: data.price })
      : PanelAPI.addPackage(data);
    req.then(done).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
      this.toast('❌ ' + e.message);
    });
  },

  /* ======================================================
   * RESELLERS
   * ====================================================== */

  /* ---------- Reseller Center ---------- */
  resellerCenter() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Resellers » Reseller Center')}
      <div class="subpage-container">
        ${this.header('🏪 Reseller Center', 'Reseller hesapları, paketleri ve istatistikleri')}
        <div id="rcBody">${loadingBox('Reseller\'lar yükleniyor…')}</div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getResellers().then(d => {
        const el = document.getElementById('rcBody');
        if (!el) return;
        const totalDisk = d.resellers.reduce((a, r) => a + (r.diskUsed || 0), 0);
        const cards = d.resellers.map(r => `
          <div class="x3-form-box" style="margin:0">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:15px">${esc(r.username)}</strong>
              ${r.exists ? '<span class="badge-active">● Aktif</span>' : '<span class="badge-warn">● Yok</span>'}
            </div>
            <div style="margin-top:8px;font-size:12px;color:#667">
              <div>Paket: <span class="badge-active">${esc(r.package)}</span></div>
              <div style="margin-top:4px">Domain: <strong>${r.domainCount}</strong>${r.packageInfo && r.packageInfo.domains ? ' / ' + r.packageInfo.domains : ''}</div>
              <div style="margin-top:4px">Disk: <strong>${r.diskUsedH}</strong>${r.packageInfo ? ' / ' + r.packageInfo.diskGB + ' GB' : ''}</div>
              <div style="margin-top:4px">E-posta: ${esc(r.email || '—')}</div>
              <div style="margin-top:4px;font-size:11px;color:#889">Oluşturma: ${esc((r.created || '').slice(0, 10))}</div>
            </div>
          </div>`).join('');
        el.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
            ${cards || '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px;grid-column:1/-1">Reseller yok — Create a Reseller ile oluşturun</div>'}
          </div>
          <div class="x3-form-box" style="margin-top:12px;padding:12px 16px;font-size:13px;color:#667">
            📊 Toplam <strong>${d.resellers.length}</strong> reseller · toplam disk kullanımı <strong>${fmtBytes(totalDisk)}</strong>
          </div>`;
      }).catch(e => {
        const el = document.getElementById('rcBody');
        if (el) el.innerHTML = errBox(e.message);
      });
    }, 50);
    return html;
  },

  /* ---------- Create a Reseller ---------- */
  createReseller() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Resellers » Create a Reseller')}
      <div class="subpage-container">
        ${this.header('➕ Create a Reseller', 'Yeni reseller hesabı — sistem kullanıcısı olarak oluşturulur')}
        <div class="x3-form-box">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
            <div><label style="font-size:12px;color:#667">Kullanıcı Adı *</label><input type="text" id="crUser" class="x3-input" placeholder="kucuk-harf"></div>
            <div><label style="font-size:12px;color:#667">Parola *</label><input type="text" id="crPass" class="x3-input" placeholder="en az 6 karakter"></div>
            <div><label style="font-size:12px;color:#667">Paket *</label><select id="crPkg" class="x3-input"></select></div>
            <div><label style="font-size:12px;color:#667">E-posta</label><input type="email" id="crEmail" class="x3-input" placeholder="opsiyonel"></div>
          </div>
          <div style="margin-top:14px"><button class="btn-x3-primary" onclick="cPanelSubPages.createResellerSubmit()">➕ Reseller Oluştur</button></div>
          <div id="crMsg" style="margin-top:10px;font-size:13px"></div>
        </div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getPackages().then(d => {
        const sel = document.getElementById('crPkg');
        if (sel) sel.innerHTML = d.packages.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
      }).catch(() => {});
    }, 50);
    return html;
  },

  createResellerSubmit() {
    const msg = document.getElementById('crMsg');
    const data = {
      username: document.getElementById('crUser').value.trim().toLowerCase(),
      password: document.getElementById('crPass').value,
      package: document.getElementById('crPkg').value,
      email: document.getElementById('crEmail').value.trim()
    };
    if (!data.username || !data.password || !data.package) {
      if (msg) msg.innerHTML = '<span style="color:#c0392b">Kullanıcı adı, parola ve paket zorunludur</span>';
      return;
    }
    PanelAPI.addReseller(data).then(() => {
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ Reseller oluşturuldu: <strong>${esc(data.username)}</strong></span>`;
      this.toast('✅ Reseller oluşturuldu: ' + data.username);
      ['crUser', 'crPass', 'crEmail'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  /* ---------- Reseller Modification ---------- */
  resellerModification() {
    return this.modifyAccount(); // WHM'de aynı akış — hesap düzenleme
  },

  /* ---------- Terminate a Reseller ---------- */
  terminateReseller() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Resellers » Terminate a Reseller')}
      <div class="subpage-container">
        ${this.header('🗑 Terminate a Reseller', 'Reseller hesabını sonlandır — tüm veriler silinir')}
        <div class="x3-form-box" style="margin-bottom:12px">
          <label style="font-size:12px;color:#667">Reseller Seç</label>
          <select id="trSel" class="x3-input" style="margin-top:4px"></select>
        </div>
        <div class="x3-form-box" style="border-color:#e74c3c">
          <p style="margin:0 0 10px;font-size:13px;color:#c0392b"><strong>⚠️ Dikkat:</strong> Bu işlem sistem kullanıcısını, ev dizinini ve tüm domain'lerini kalıcı olarak siler.</p>
          <button class="btn-x3-sm danger" onclick="cPanelSubPages.terminateResellerSubmit()">🗑 Reseller\'ı Sonlandır</button>
          <div id="trMsg" style="margin-top:8px;font-size:13px"></div>
        </div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getResellers().then(d => {
        const sel = document.getElementById('trSel');
        if (sel) sel.innerHTML = d.resellers.map(r => `<option value="${esc(r.username)}">${esc(r.username)} (${r.domainCount} domain)</option>`).join('');
      }).catch(() => {});
    }, 50);
    return html;
  },

  terminateResellerSubmit() {
    const sel = document.getElementById('trSel');
    const msg = document.getElementById('trMsg');
    if (!sel || !sel.value) return;
    const uname = sel.value;
    if (!confirm(`"${uname}" reseller'ı sonlandırılsın mı? TÜM VERİLER SİLİNECEK!`)) return;
    PanelAPI.deleteReseller(uname).then(d => {
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ Sonlandırıldı — ${d.removedDomains || 0} domain kaldırıldı</span>`;
      this.toast('🗑 Reseller sonlandırıldı');
      setTimeout(() => location.reload(), 1200);
    }).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  /* ======================================================
   * DNS FUNCTIONS
   * ====================================================== */

  /* ---------- DNS Zone Manager ---------- */
  dnsZoneManager() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'DNS Functions » DNS Zone Manager')}
      <div class="subpage-container">
        ${this.header('🌐 DNS Zone Manager', 'Tüm domain\'lerin DNS kayıtları (A, CNAME, MX, NS, TXT)')}
        <div id="dzBody">${loadingBox('Zone\'lar yükleniyor…')}</div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getDnsZones().then(d => {
        const el = document.getElementById('dzBody');
        if (!el) return;
        el.innerHTML = `
          <div class="x3-form-box" style="padding:10px 16px;margin-bottom:10px;font-size:13px;color:#667">
            Nameserver: <code>${esc(d.nameserver)}</code> · Sunucu IP: <code>${esc(d.ip)}</code> · ${d.zones.length} zone
          </div>
          ${d.zones.map(z => `
            <div class="x3-form-box" style="margin-bottom:12px;padding:0;overflow:hidden">
              <div style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e5e9f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                <strong>${esc(z.domain)}</strong>
                <span style="font-size:11px;color:#889">Serial: ${z.serial}</span>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:12px">
                <thead><tr style="text-align:left;color:#556;border-bottom:1px solid #eef1f5"><th style="padding:6px 10px">Tip</th><th style="padding:6px 10px">Ad</th><th style="padding:6px 10px">TTL</th><th style="padding:6px 10px">Değer</th><th style="padding:6px 10px;text-align:right">Aksiyon</th></tr></thead>
                <tbody>${z.records.map(r => `
                  <tr>
                    <td style="padding:6px 10px"><span class="badge-active" style="font-size:10px">${esc(r.type)}</span></td>
                    <td style="padding:6px 10px;font-family:monospace">${esc(r.name)}</td>
                    <td style="padding:6px 10px;color:#889">${r.ttl}</td>
                    <td style="padding:6px 10px;font-family:monospace">${esc(r.value)}</td>
                    <td style="padding:6px 10px;text-align:right">${r.type === 'A' ? `<button class="btn-x3-sm" onclick="cPanelSubPages.editDnsZone('${esc(z.domain)}')">✏️</button>` : ''}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`).join('') || '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px">Zone yok — Add a DNS Zone ile ekleyin</div>'}`;
      }).catch(e => {
        const el = document.getElementById('dzBody');
        if (el) el.innerHTML = errBox(e.message);
      });
    }, 50);
    return html;
  },

  /* ---------- Add a DNS Zone ---------- */
  addDnsZone() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'DNS Functions » Add a DNS Zone')}
      <div class="subpage-container">
        ${this.header('➕ Add a DNS Zone', 'Yeni domain için DNS zone + nginx vhost oluşturun')}
        <div class="x3-form-box">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
            <div><label style="font-size:12px;color:#667">Domain *</label><input type="text" id="azDomain" class="x3-input" placeholder="ornek.com"></div>
            <div><label style="font-size:12px;color:#667">Reseller (opsiyonel)</label><select id="azReseller" class="x3-input"><option value="">— yok —</option></select></div>
            <div><label style="font-size:12px;color:#667">Kök Dizin</label><input type="text" id="azRoot" class="x3-input" placeholder="otomatik"></div>
          </div>
          <div style="margin-top:14px"><button class="btn-x3-primary" onclick="cPanelSubPages.addDnsZoneSubmit()">➕ Zone Oluştur</button></div>
          <div id="azMsg" style="margin-top:10px;font-size:13px"></div>
        </div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getResellers().then(d => {
        const sel = document.getElementById('azReseller');
        if (sel) sel.innerHTML = '<option value="">— yok —</option>' + d.resellers.map(r => `<option value="${esc(r.username)}">${esc(r.username)}</option>`).join('');
      }).catch(() => {});
    }, 50);
    return html;
  },

  addDnsZoneSubmit() {
    const msg = document.getElementById('azMsg');
    const data = {
      name: document.getElementById('azDomain').value.trim().toLowerCase(),
      reseller: document.getElementById('azReseller').value,
      root: document.getElementById('azRoot').value.trim()
    };
    if (!data.name) { if (msg) msg.innerHTML = '<span style="color:#c0392b">Domain gerekli</span>'; return; }
    if (!data.root) delete data.root;
    PanelAPI.addDomain(data).then(d => {
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ Zone oluşturuldu: <strong>${esc(data.name)}</strong> — A, CNAME, MX, NS, TXT kayıtları hazır${d.nginx === 'reloaded' ? ' (nginx ✓)' : ''}</span>`;
      this.toast('✅ DNS zone eklendi: ' + data.name);
      ['azDomain', 'azRoot'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  /* ---------- Edit DNS Zone ---------- */
  editDnsZone(domain) {
    if (!domain) {
      // modül olarak açıldığında: zone seçtir
      const html = `
        ${this.renderBreadcrumb('WHM', 'DNS Functions » Edit DNS Zone')}
        <div class="subpage-container">
          ${this.header('✏️ Edit DNS Zone', 'A kaydı IP adresini değiştirin (gerçek /etc/hosts güncellemesi)')}
          <div class="x3-form-box" style="margin-bottom:12px">
            <label style="font-size:12px;color:#667">Zone Seç</label>
            <select id="ezSel" class="x3-input" onchange="cPanelSubPages.editDnsZone(this.value)" style="margin-top:4px"></select>
          </div>
          <div id="ezBody"></div>
        </div>`;
      setTimeout(() => {
        PanelAPI.getDnsZones().then(d => {
          const sel = document.getElementById('ezSel');
          if (sel) sel.innerHTML = d.zones.map(z => `<option value="${esc(z.domain)}">${esc(z.domain)}</option>`).join('');
        }).catch(() => {});
      }, 50);
      return html;
    }
    // seçili zone için form
    const body = document.getElementById('ezBody');
    const sel = document.getElementById('ezSel');
    if (sel) sel.value = domain;
    if (!body) {
      // doğrudan çağrıldıysa (DNS Zone Manager'dan) — sayfayı değiştir
      const container = document.getElementById('mainContentArea');
      if (container) {
        container.innerHTML = this.editDnsZone();
        setTimeout(() => {
          const s2 = document.getElementById('ezSel');
          if (s2) { s2.value = domain; this.loadEditZone(domain); }
        }, 300);
      }
      return;
    }
    this.loadEditZone(domain);
  },

  loadEditZone(domain) {
    const body = document.getElementById('ezBody');
    if (!body || !domain) return;
    body.innerHTML = loadingBox('Zone okunuyor…');
    PanelAPI.getDnsZones().then(d => {
      const z = d.zones.find(x => x.domain === domain);
      if (!z) { body.innerHTML = errBox('Zone bulunamadı'); return; }
      const aRec = z.records.find(r => r.type === 'A');
      body.innerHTML = `
        <div class="x3-form-box">
          <h3 style="margin-top:0">Zone: <code>${esc(z.domain)}</code></h3>
          <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
            <div><label style="font-size:12px;color:#667">A Kaydı (IP Adresi)</label>
              <input type="text" id="ezIp" class="x3-input" value="${esc(aRec ? aRec.value : d.ip)}" style="width:180px;font-family:monospace"></div>
            <button class="btn-x3-primary" onclick="cPanelSubPages.editDnsZoneSubmit('${esc(z.domain)}')">💾 Kaydet</button>
          </div>
          <div id="ezMsg" style="margin-top:10px;font-size:13px"></div>
          <div style="margin-top:14px;border-top:1px solid #eef1f5;padding-top:10px">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="text-align:left;color:#556"><th style="padding:5px 8px">Tip</th><th style="padding:5px 8px">Ad</th><th style="padding:5px 8px">TTL</th><th style="padding:5px 8px">Değer</th></tr></thead>
              <tbody>${z.records.map(r => `<tr><td style="padding:5px 8px"><span class="badge-active" style="font-size:10px">${esc(r.type)}</span></td><td style="padding:5px 8px;font-family:monospace">${esc(r.name)}</td><td style="padding:5px 8px;color:#889">${r.ttl}</td><td style="padding:5px 8px;font-family:monospace">${esc(r.value)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  editDnsZoneSubmit(domain) {
    const ip = document.getElementById('ezIp').value.trim();
    const msg = document.getElementById('ezMsg');
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      if (msg) msg.innerHTML = '<span style="color:#c0392b">Geçersiz IP adresi</span>';
      return;
    }
    PanelAPI.updateDnsZone(domain, ip).then(d => {
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ ${esc(d.output || 'A kaydı güncellendi')}</span>`;
      this.toast('✅ A kaydı güncellendi: ' + domain + ' → ' + ip);
      setTimeout(() => this.loadEditZone(domain), 600);
    }).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  /* ==========================================================
   * WHM — EMAIL FUNCTIONS (gerçek postfix + dovecot)
   * ========================================================== */

  /* ---------- Email Accounts ---------- */
  whmEmails() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Email Functions » Email Accounts')}
      <div class="subpage-container">
        ${this.header('📧 Email Accounts', 'Tüm sanal e-posta hesapları — postfix + dovecot (maildir)')}
        <div class="x3-form-box" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="weDomain" class="x3-input" style="width:200px" onchange="cPanelSubPages.loadWhmEmails()"></select>
          <button class="btn-x3-primary" onclick="cPanelSubPages.loadWhmEmails()">🔄 Yenile</button>
          <div style="flex:1;text-align:right;font-size:12px;color:#889" id="weCount"></div>
        </div>
        <div id="weBody">${loadingBox('E-posta hesapları yükleniyor…')}</div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getDomains().then(d => {
        const sel = document.getElementById('weDomain');
        if (!sel) return;
        sel.innerHTML = '<option value="">— tüm domainler —</option>' + d.domains.map(x => `<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
        this.loadWhmEmails();
      }).catch(() => this.loadWhmEmails());
    }, 50);
    return html;
  },

  loadWhmEmails() {
    const body = document.getElementById('weBody');
    if (!body) return;
    const domain = (document.getElementById('weDomain') || {}).value || '';
    PanelAPI.getEmails(domain).then(d => {
      const cnt = document.getElementById('weCount');
      if (cnt) cnt.textContent = d.total + ' hesap' + (domain ? ' (' + domain + ')' : '');
      if (!d.emails.length) {
        body.innerHTML = '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px">E-posta hesabı yok — Create an Email Account ile oluşturun</div>';
        return;
      }
      body.innerHTML = `
        <div class="x3-form-box" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556">
              <th style="padding:8px">E-posta</th><th style="padding:8px">Domain</th><th style="padding:8px">Kota</th>
              <th style="padding:8px">Kullanım</th><th style="padding:8px">Oluşturma</th><th style="padding:8px;text-align:right">Aksiyon</th>
            </tr></thead>
            <tbody>${d.emails.map(a => {
              const pct = a.quotaMB ? Math.min(100, Math.round((a.size / (a.quotaMB * 1048576)) * 100)) : 0;
              return `
              <tr>
                <td style="padding:8px"><strong>${esc(a.email)}</strong></td>
                <td style="padding:8px"><span class="badge-active" style="font-size:10px">${esc(a.domain)}</span></td>
                <td style="padding:8px">${a.quotaMB ? a.quotaMB + ' MB' : '∞'}</td>
                <td style="padding:8px;min-width:140px">
                  <div style="display:flex;align-items:center;gap:6px">
                    <div style="flex:1;height:6px;background:#eef1f5;border-radius:3px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${pct > 90 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e'}"></div></div>
                    <span style="font-size:11px;color:#667">${esc(a.sizeH)}</span>
                  </div>
                </td>
                <td style="padding:8px;font-size:11px;color:#889">${esc((a.created || '').slice(0, 10) || '—')}</td>
                <td style="padding:8px;text-align:right;white-space:nowrap">
                  <button class="btn-x3-sm" onclick="cPanelSubPages.whmEmailModify('${esc(a.email)}')">✏️</button>
                  <button class="btn-x3-sm danger" onclick="cPanelSubPages.whmEmailDelete('${esc(a.email)}')">🗑</button>
                </td>
              </tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  /* ---------- Create an Email Account ---------- */
  whmEmailCreate() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Email Functions » Create an Email Account')}
      <div class="subpage-container">
        ${this.header('➕ Create an Email Account', 'Gerçek postfix/dovecot hesabı — maildir + SMTP/IMAP erişimi')}
        <div class="x3-form-box">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
            <div>
              <label style="font-size:12px;color:#667">E-posta Adresi *</label>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
                <input type="text" id="ceUser" class="x3-input" placeholder="info" style="flex:1">
                <span style="color:#889">@</span>
                <select id="ceDomain" class="x3-input" style="flex:1.4"></select>
              </div>
            </div>
            <div><label style="font-size:12px;color:#667">Parola *</label><input type="password" id="cePass" class="x3-input" placeholder="en az 6 karakter"></div>
            <div><label style="font-size:12px;color:#667">Kota (MB, 0 = sınırsız)</label><input type="number" id="ceQuota" class="x3-input" value="200" min="0"></div>
          </div>
          <div style="margin-top:14px"><button class="btn-x3-primary" onclick="cPanelSubPages.whmEmailCreateSubmit()">➕ Hesap Oluştur</button></div>
          <div id="ceMsg" style="margin-top:10px;font-size:13px"></div>
        </div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getDomains().then(d => {
        const sel = document.getElementById('ceDomain');
        if (sel) sel.innerHTML = d.domains.map(x => `<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('') || '<option value="">— domain yok —</option>';
      }).catch(() => {});
    }, 50);
    return html;
  },

  whmEmailCreateSubmit() {
    const msg = document.getElementById('ceMsg');
    const user = (document.getElementById('ceUser') || {}).value.trim().toLowerCase();
    const domain = (document.getElementById('ceDomain') || {}).value;
    const pass = (document.getElementById('cePass') || {}).value;
    const quota = +(document.getElementById('ceQuota') || {}).value || 0;
    if (!user || !domain) { if (msg) msg.innerHTML = '<span style="color:#c0392b">Kullanıcı adı ve domain gerekli</span>'; return; }
    PanelAPI.addEmail({ email: user + '@' + domain, password: pass, quotaMB: quota }).then(d => {
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ Hesap oluşturuldu: <strong>${esc(d.email)}</strong> (kota ${d.quotaMB || '∞'} MB, postfix maps ${esc(d.maps)})</span>`;
      this.toast('✅ E-posta hesabı oluşturuldu: ' + d.email);
      ['ceUser', 'cePass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  /* ---------- Modify Email Account ---------- */
  whmEmailModify(email) {
    if (!email) {
      const html = `
        ${this.renderBreadcrumb('WHM', 'Email Functions » Modify Email Account')}
        <div class="subpage-container">
          ${this.header('✏️ Modify Email Account', 'Parola ve kota değişikliği — dovecot passwd-file güncellemesi')}
          <div class="x3-form-box" style="margin-bottom:12px">
            <label style="font-size:12px;color:#667">Hesap Seç</label>
            <select id="meSel" class="x3-input" onchange="cPanelSubPages.whmEmailModify(this.value)" style="margin-top:4px"></select>
          </div>
          <div id="meBody"></div>
        </div>`;
      setTimeout(() => {
        PanelAPI.getEmails().then(d => {
          const sel = document.getElementById('meSel');
          if (sel) sel.innerHTML = d.emails.map(a => `<option value="${esc(a.email)}">${esc(a.email)}</option>`).join('') || '<option value="">— hesap yok —</option>';
        }).catch(() => {});
      }, 50);
      return html;
    }
    const body = document.getElementById('meBody');
    const sel = document.getElementById('meSel');
    if (sel) sel.value = email;
    if (!body) {
      const container = document.getElementById('mainContentArea');
      if (container) {
        container.innerHTML = this.whmEmailModify();
        setTimeout(() => {
          const s2 = document.getElementById('meSel');
          if (s2) { s2.value = email; this.loadWhmEmailModify(email); }
        }, 300);
      }
      return;
    }
    this.loadWhmEmailModify(email);
  },

  loadWhmEmailModify(email) {
    const body = document.getElementById('meBody');
    if (!body || !email) return;
    PanelAPI.getEmails().then(d => {
      const a = d.emails.find(x => x.email === email);
      if (!a) { body.innerHTML = errBox('Hesap bulunamadı'); return; }
      body.innerHTML = `
        <div class="x3-form-box">
          <h3 style="margin-top:0">Hesap: <code>${esc(a.email)}</code></h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
            <div><label style="font-size:12px;color:#667">Yeni Parola (boş bırakılırsa değişmez)</label><input type="password" id="mePass" class="x3-input" placeholder="en az 6 karakter"></div>
            <div><label style="font-size:12px;color:#667">Kota (MB, 0 = sınırsız)</label><input type="number" id="meQuota" class="x3-input" value="${a.quotaMB}" min="0"></div>
          </div>
          <div style="margin-top:14px"><button class="btn-x3-primary" onclick="cPanelSubPages.whmEmailModifySubmit('${esc(a.email)}')">💾 Kaydet</button></div>
          <div id="meMsg" style="margin-top:10px;font-size:13px"></div>
        </div>`;
    }).catch(e => { body.innerHTML = errBox(e.message); });
  },

  whmEmailModifySubmit(email) {
    const pass = (document.getElementById('mePass') || {}).value;
    const quota = +(document.getElementById('meQuota') || {}).value;
    const msg = document.getElementById('meMsg');
    const data = { quotaMB: quota };
    if (pass) data.password = pass;
    PanelAPI.updateEmail(email, data).then(d => {
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ Güncellendi: <strong>${esc(d.email)}</strong> — kota ${d.quotaMB || '∞'} MB${d.passwordChanged ? ', parola değişti' : ''}</span>`;
      this.toast('✅ E-posta hesabı güncellendi: ' + email);
    }).catch(e => {
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  /* ---------- Delete Email Account ---------- */
  whmEmailDelete(email) {
    if (!email) {
      const html = `
        ${this.renderBreadcrumb('WHM', 'Email Functions » Delete Email Account')}
        <div class="subpage-container">
          ${this.header('🗑 Delete Email Account', 'Hesap + maildir tamamen silinir (geri alınamaz)')}
          <div class="x3-form-box" style="margin-bottom:12px">
            <label style="font-size:12px;color:#667">Hesap Seç</label>
            <select id="deSel" class="x3-input" style="margin-top:4px"></select>
          </div>
          <button class="btn-x3-primary danger" onclick="cPanelSubPages.whmEmailDeleteSubmit()">🗑 Hesabı Sil</button>
          <div id="deMsg" style="margin-top:10px;font-size:13px"></div>
        </div>`;
      setTimeout(() => {
        PanelAPI.getEmails().then(d => {
          const sel = document.getElementById('deSel');
          if (sel) sel.innerHTML = d.emails.map(a => `<option value="${esc(a.email)}">${esc(a.email)}</option>`).join('') || '<option value="">— hesap yok —</option>';
        }).catch(() => {});
      }, 50);
      return html;
    }
    if (!confirm(`"${email}" hesabı ve tüm mailleri silinsin mi?`)) return;
    PanelAPI.deleteEmail(email).then(d => {
      this.toast('🗑 E-posta hesabı silindi: ' + d.email);
      const body = document.getElementById('weBody');
      if (body) this.loadWhmEmails();
    }).catch(e => this.toast('❌ ' + e.message));
  },

  whmEmailDeleteSubmit() {
    const sel = document.getElementById('deSel');
    const email = sel ? sel.value : '';
    if (!email) { const msg = document.getElementById('deMsg'); if (msg) msg.innerHTML = '<span style="color:#c0392b">Hesap seçin</span>'; return; }
    if (!confirm(`"${email}" hesabı ve tüm mailleri silinsin mi? (geri alınamaz)`)) return;
    PanelAPI.deleteEmail(email).then(d => {
      const msg = document.getElementById('deMsg');
      if (msg) msg.innerHTML = `<span style="color:#27ae60">✅ Silindi: <strong>${esc(d.email)}</strong></span>`;
      this.toast('🗑 E-posta hesabı silindi: ' + d.email);
      PanelAPI.getEmails().then(r => {
        const s2 = document.getElementById('deSel');
        if (s2) s2.innerHTML = r.emails.map(a => `<option value="${esc(a.email)}">${esc(a.email)}</option>`).join('') || '<option value="">— hesap yok —</option>';
      }).catch(() => {});
    }).catch(e => {
      const msg = document.getElementById('deMsg');
      if (msg) msg.innerHTML = `<span style="color:#c0392b">❌ ${esc(e.message)}</span>`;
    });
  },

  /* ---------- Email Disk Usage ---------- */
  whmEmailDisk() {
    const html = `
      ${this.renderBreadcrumb('WHM', 'Email Functions » Email Disk Usage')}
      <div class="subpage-container">
        ${this.header('💾 Email Disk Usage', 'Maildir kullanımı — hesap bazında kota doluluk oranı')}
        <div id="edBody">${loadingBox('Kullanım hesaplanıyor…')}</div>
      </div>`;
    setTimeout(() => {
      PanelAPI.getEmails().then(d => {
        const el = document.getElementById('edBody');
        if (!el) return;
        if (!d.emails.length) { el.innerHTML = '<div class="x3-form-box" style="text-align:center;color:#889;padding:24px">E-posta hesabı yok</div>'; return; }
        const maxSize = Math.max(...d.emails.map(a => a.size), 1);
        const domainTotals = Object.entries(d.totals || {}).map(([dom, sz]) => ({ dom, sz })).sort((a, b) => b.sz - a.sz);
        el.innerHTML = `
          <div class="x3-form-box" style="padding:0;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr style="text-align:left;border-bottom:2px solid #e5e9f0;color:#556">
                <th style="padding:8px">E-posta</th><th style="padding:8px">Kullanım</th><th style="padding:8px">Kota</th><th style="padding:8px">Doluluk</th>
              </tr></thead>
              <tbody>${d.emails.map(a => {
                const pct = a.quotaMB ? Math.min(100, Math.round((a.size / (a.quotaMB * 1048576)) * 100)) : null;
                const barW = Math.max(2, Math.round((a.size / maxSize) * 100));
                return `
                <tr>
                  <td style="padding:8px"><strong>${esc(a.email)}</strong></td>
                  <td style="padding:8px;min-width:160px">
                    <div style="display:flex;align-items:center;gap:6px">
                      <div style="flex:1;height:8px;background:#eef1f5;border-radius:4px;overflow:hidden"><div style="width:${barW}%;height:100%;background:${pct === null ? '#38bdf8' : pct > 90 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e'}"></div></div>
                      <span style="font-size:11px;color:#667;white-space:nowrap">${esc(a.sizeH)}</span>
                    </div>
                  </td>
                  <td style="padding:8px">${a.quotaMB ? a.quotaMB + ' MB' : '∞'}</td>
                  <td style="padding:8px;font-size:12px">${pct === null ? '—' : pct + '%'}</td>
                </tr>`;
              }).join('')}
              </tbody>
            </table>
          </div>
          <div class="x3-form-box" style="margin-top:12px;padding:12px 16px">
            <strong style="font-size:13px">Domain Toplamları</strong>
            ${domainTotals.map(t => `
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                <span style="font-size:12px;width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.dom)}</span>
                <div style="flex:1;height:8px;background:#eef1f5;border-radius:4px;overflow:hidden"><div style="width:${Math.max(2, Math.round((t.sz / Math.max(...domainTotals.map(x => x.sz), 1)) * 100))}%;height:100%;background:#6366f1"></div></div>
                <span style="font-size:12px;color:#667">${fmtBytes(t.sz)}</span>
              </div>`).join('')}
          </div>`;
      }).catch(e => {
        const el = document.getElementById('edBody');
        if (el) el.innerHTML = errBox(e.message);
      });
    }, 50);
    return html;
  }
});
