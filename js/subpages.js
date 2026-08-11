/* ============================================================
 * OCP Panel — Modül Sayfaları (tüm cPanel fonksiyonları)
 * Her modül: render fonksiyonu + etkileşim (localStorage tabanlı)
 * ============================================================ */
const cPanelSubPages = {

  renderBreadcrumb(catName, pageTitle) {
    return `
      <div class="breadcrumb-bar">
        <a href="#" onclick="cPanelApp.showDashboard(); return false;">Home</a> &gt;
        <span>${catName}</span> &gt;
        <strong>${pageTitle}</strong>
      </div>
    `;
  },

  header(title, subtitle = '') {
    return `
      <div class="subpage-header">
        <h2>${title}</h2>
        <button class="btn-x3" onclick="cPanelApp.showDashboard()">✕ Dashboard</button>
      </div>
      ${subtitle ? `<p class="subpage-subtitle">${subtitle}</p>` : ''}
    `;
  },

  toast(msg) { cPanelApp.showToast(msg); },

  /* ==========================================================
   * GENERIC — bilinmeyen/eksik modül için fallback
   * ========================================================== */
  generic(action) {
    return `
      ${this.renderBreadcrumb('Module', action)}
      <div class="subpage-container">
        ${this.header(action.toUpperCase() + ' Module')}
        <div class="x3-form-box">
          <p>Simulating cPanel X3 module <strong>${action}</strong>.</p>
        </div>
      </div>
    `;
  },

  /* ==========================================================
   * PREFERENCES
   * ========================================================== */

  /* --- Getting Started Wizard --- */
  wizard() {
    const tasks = X3Store.list('tasks');
    const doneCount = tasks.filter(t => t.done).length;
    const rows = tasks.map(t => `
      <tr>
        <td><input type="checkbox" ${t.done ? 'checked' : ''} onchange="cPanelSubPages.toggleTask(${t.id}, this.checked)"></td>
        <td>${t.label}</td>
        <td>${t.done ? '<span class="badge-active">✓ Tamamlandı</span>' : '<span class="badge-warn">Bekliyor</span>'}</td>
      </tr>
    `).join('');

    return `
      ${this.renderBreadcrumb('Preferences', 'Getting Started Wizard')}
      <div class="subpage-container">
        ${this.header('🚀 Getting Started Wizard', 'Hesabınızı kurmanıza yardımcı olacak görev listesi.')}
        <div class="wizard-progress">
          <div class="x3-progress"><div class="x3-progress-fill" style="width:${(doneCount / Math.max(tasks.length, 1)) * 100}%"></div></div>
          <p>${doneCount} / ${tasks.length} görev tamamlandı</p>
        </div>
        <table class="x3-data-table">
          <thead><tr><th style="width:40px"></th><th>Görev</th><th>Durum</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  toggleTask(id, checked) {
    X3Store.update('tasks', id, { done: checked });
    cPanelApp.showToast(checked ? 'Görev tamamlandı ✓' : 'Görev beklemede');
    this.wizard();
    document.getElementById('mainContentArea').innerHTML = this.wizard();
  },

  /* --- Video Tutorials --- */
  tutorials() {
    const vids = [
      { title: 'cPanel Genel Bakış', dur: '4:32', cat: 'Başlangıç' },
      { title: 'E-posta Hesabı Oluşturma', dur: '3:15', cat: 'E-posta' },
      { title: 'File Manager Kullanımı', dur: '5:48', cat: 'Dosyalar' },
      { title: 'MySQL Veritabanı Kurulumu', dur: '6:02', cat: 'Veritabanları' },
      { title: 'SSL Sertifikası Yükleme', dur: '4:55', cat: 'Güvenlik' },
      { title: 'Yedekleme ve Geri Yükleme', dur: '7:10', cat: 'Dosyalar' },
      { title: 'Cron Job Ayarlama', dur: '3:40', cat: 'Gelişmiş' },
      { title: 'Domain ve Subdomain Yönetimi', dur: '5:22', cat: 'Domainler' },
    ];
    const cards = vids.map(v => `
      <div class="video-card" onclick="cPanelApp.showToast('▶ ${v.title} oynatılıyor...')">
        <div class="video-thumb">🎬</div>
        <div class="video-info">
          <strong>${v.title}</strong>
          <span>${v.cat} · ${v.dur}</span>
        </div>
      </div>
    `).join('');

    return `
      ${this.renderBreadcrumb('Preferences', 'Video Tutorials')}
      <div class="subpage-container">
        ${this.header('🎬 Video Tutorials', 'cPanel yönetimi için video rehberler.')}
        <div class="video-grid">${cards}</div>
      </div>
    `;
  },

  /* --- Change Password --- */
  changePassword() {
    return `
      ${this.renderBreadcrumb('Preferences', 'Change Password')}
      <div class="subpage-container">
        ${this.header('🔑 Change Password', 'cPanel hesabınızın şifresini değiştirin.')}
        <div class="x3-form-box">
          <h3>Yeni Şifre Belirleyin</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Mevcut Şifre:</label>
              <input type="password" id="pwCurrent" class="x3-input" placeholder="••••••••">
            </div>
            <div class="form-group">
              <label>Yeni Şifre:</label>
              <input type="password" id="pwNew" class="x3-input" placeholder="En az 8 karakter">
            </div>
            <div class="form-group">
              <label>Yeni Şifre (Tekrar):</label>
              <input type="password" id="pwNew2" class="x3-input" placeholder="••••••••">
            </div>
            <div class="form-group">
              <label>Şifre Gücü:</label>
              <div class="pw-strength" id="pwStrength">—</div>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.savePassword()">Şifreyi Değiştir</button>
          <div id="pwResult"></div>
        </div>
      </div>
    `;
  },

  savePassword() {
    const n = document.getElementById('pwNew').value;
    const n2 = document.getElementById('pwNew2').value;
    const res = document.getElementById('pwResult');
    if (n.length < 8) { res.innerHTML = '<p class="error-msg">Şifre en az 8 karakter olmalı.</p>'; return; }
    if (n !== n2) { res.innerHTML = '<p class="error-msg">Şifreler eşleşmiyor.</p>'; return; }
    res.innerHTML = '<p class="success-msg">✅ Şifreniz başarıyla güncellendi.</p>';
    this.toast('Şifre değiştirildi');
  },

  /* --- Update Contact Information --- */
  contactInfo() {
    const a = X3Store.getAccount();
    return `
      ${this.renderBreadcrumb('Preferences', 'Update Contact Information')}
      <div class="subpage-container">
        ${this.header('📧 Update Contact Information', 'Bildirimlerin gönderileceği iletişim bilgileri.')}
        <div class="x3-form-box">
          <h3>İletişim Bilgileri</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>E-posta Adresi:</label>
              <input type="email" id="ctEmail" class="x3-input" value="${a.contact}">
            </div>
            <div class="form-group">
              <label>Telefon:</label>
              <input type="tel" id="ctPhone" class="x3-input" value="${a.phone}">
            </div>
            <div class="form-group">
              <label>Alternatif E-posta:</label>
              <input type="email" id="ctAlt" class="x3-input" placeholder="yedek@ornek.com">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.saveContact()">Bilgileri Kaydet</button>
          <div id="ctResult"></div>
        </div>
      </div>
    `;
  },

  saveContact() {
    X3Store.saveAccount({
      contact: document.getElementById('ctEmail').value,
      phone: document.getElementById('ctPhone').value,
    });
    document.getElementById('ctResult').innerHTML = '<p class="success-msg">✅ İletişim bilgileri güncellendi.</p>';
    this.toast('İletişim bilgileri kaydedildi');
  },

  /* --- Branding Editor --- */
  branding() {
    const a = X3Store.getAccount();
    return `
      ${this.renderBreadcrumb('Preferences', 'Branding Editor')}
      <div class="subpage-container">
        ${this.header('🎨 Branding Editor', 'Panelinizin görsel kimliğini özelleştirin.')}
        <div class="x3-form-box">
          <h3>Marka Ayarları</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Marka Adı:</label>
              <input type="text" id="brName" class="x3-input" value="${a.brandName}">
            </div>
            <div class="form-group">
              <label>Logo URL:</label>
              <input type="text" id="brLogo" class="x3-input" placeholder="https://ornek.com/logo.png">
            </div>
            <div class="form-group">
              <label>Vurgu Rengi:</label>
              <input type="color" id="brColor" class="x3-input" value="#f08c00" style="height:42px;padding:4px">
            </div>
            <div class="form-group">
              <label>Panel Başlığı:</label>
              <input type="text" id="brTitle" class="x3-input" value="cPanel X3 Control Panel">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.saveBranding()">Kaydet</button>
          <div id="brResult"></div>
        </div>
      </div>
    `;
  },

  saveBranding() {
    X3Store.saveAccount({ brandName: document.getElementById('brName').value });
    document.getElementById('brResult').innerHTML = '<p class="success-msg">✅ Marka ayarları kaydedildi.</p>';
    this.toast('Marka güncellendi');
  },

  /* --- Change Style --- */
  changeStyle() {
    return `
      ${this.renderBreadcrumb('Preferences', 'Change Style')}
      <div class="subpage-container">
        ${this.header('🎨 Change Style', 'Panel görünüm temasını seçin.')}
        <div class="theme-grid">
          <div class="theme-card" onclick="cPanelApp.changeTheme('light')">
            <div class="theme-preview theme-light-prev"></div>
            <strong>Aydınlık (X3 Klasik)</strong>
          </div>
          <div class="theme-card" onclick="cPanelApp.changeTheme('dark')">
            <div class="theme-preview theme-dark-prev"></div>
            <strong>Koyu (Modern)</strong>
          </div>
          <div class="theme-card" onclick="cPanelApp.changeTheme('x2')">
            <div class="theme-preview theme-x2-prev"></div>
            <strong>X2 (Eski Klasik)</strong>
          </div>
          <div class="theme-card" onclick="cPanelApp.changeTheme('paper')">
            <div class="theme-preview theme-paper-prev"></div>
            <strong>Paper Lantern (Yeni)</strong>
          </div>
        </div>
      </div>
    `;
  },

  /* --- Change Language --- */
  changeLanguage() {
    const langs = ['Türkçe', 'English', 'Deutsch', 'Français', 'Español', 'Русский', 'العربية', '中文', '日本語'];
    const items = langs.map(l => `
      <label class="lang-item">
        <input type="radio" name="lang" ${l === 'Türkçe' ? 'checked' : ''} onchange="cPanelSubPages.setLanguage('${l}')">
        ${l}
      </label>
    `).join('');
    return `
      ${this.renderBreadcrumb('Preferences', 'Change Language')}
      <div class="subpage-container">
        ${this.header('🌐 Change Language', 'Panel arayüz dilini seçin.')}
        <div class="x3-form-box">
          <h3>Dil Seçin</h3>
          <div class="lang-grid">${items}</div>
        </div>
      </div>
    `;
  },

  setLanguage(lang) {
    X3Store.saveAccount({ language: lang });
    this.toast('Dil değiştirildi: ' + lang);
  },

  /* --- Shortcuts --- */
  shortcuts() {
    const tools = [];
    this.appCategories().forEach(c => c.tools.forEach(t => tools.push(t)));
    const html = tools.map(t => `
      <div class="shortcut-item" onclick="cPanelApp.openTool('${t.action}')">
        <div class="x3-tool-icon x3-tool-icon-sm">${X3Icons[t.icon] || X3Icons.genericTool}</div>
        <span>${t.name}</span>
      </div>
    `).join('');
    return `
      ${this.renderBreadcrumb('Preferences', 'Shortcuts')}
      <div class="subpage-container">
        ${this.header('⚡ Shortcuts', 'Sık kullanılan araçlara hızlı erişim.')}
        <div class="shortcut-grid">${html}</div>
      </div>
    `;
  },

  appCategories() {
    return cPanelApp.categories;
  },

  /* --- User Manager --- */
  userManager() {
    const users = [
      { id: 1, name: 'adamowen', type: 'cPanel', priv: 'Tam Erişim', status: 'active' },
      { id: 2, name: 'adamowen_db', type: 'MySQL', priv: 'DB Yönetimi', status: 'active' },
      { id: 3, name: 'ftpuser1', type: 'FTP', priv: 'public_html', status: 'active' },
      { id: 4, name: 'misafir', type: 'cPanel', priv: 'Kısıtlı', status: 'suspended' },
    ];
    const rows = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td><span class="badge-${u.type === 'cPanel' ? 'info' : 'warn'}">${u.type}</span></td>
        <td>${u.priv}</td>
        <td>${u.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-danger">Askıda</span>'}</td>
        <td>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('${u.name} düzenleniyor...')">Düzenle</button>
          <button class="btn-x3-sm danger" onclick="cPanelApp.showToast('${u.name} silindi (simülasyon)')">Sil</button>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Preferences', 'User Manager')}
      <div class="subpage-container">
        ${this.header('👥 User Manager', 'Hesap kullanıcılarını ve yetkilerini yönetin.')}
        <table class="x3-data-table">
          <thead><tr><th>Kullanıcı</th><th>Tip</th><th>Yetki</th><th>Durum</th><th>İşlemler</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* --- My Account --- */
  myAccount() {
    const a = X3Store.getAccount();
    return `
      ${this.renderBreadcrumb('Preferences', 'My Account')}
      <div class="subpage-container">
        ${this.header('👤 My Account', 'Hesap bilgileriniz ve kullanım özeti.')}
        <div class="x3-form-box">
          <h3>Hesap Özeti</h3>
          <table class="x3-data-table">
            <tbody>
              <tr><td><strong>Kullanıcı Adı</strong></td><td>${a.user}</td></tr>
              <tr><td><strong>Ana Domain</strong></td><td>${a.domain}</td></tr>
              <tr><td><strong>Birincil E-posta</strong></td><td>${a.email}</td></tr>
              <tr><td><strong>Hesap Açılış</strong></td><td>${a.createdAt}</td></tr>
              <tr><td><strong>Disk Kullanımı</strong></td><td>${(a.diskUsed / 1024).toFixed(2)} GB / ${(a.diskQuota / 1024).toFixed(0)} GB (${X3Store.diskPercent()}%)</td></tr>
              <tr><td><strong>Bant Genişliği</strong></td><td>${(a.bandwidthUsed / 1024).toFixed(2)} GB / ${(a.bandwidthQuota / 1024).toFixed(0)} GB (${X3Store.bandwidthPercent()}%)</td></tr>
              <tr><td><strong>IP Adresi</strong></td><td>185.199.108.153</td></tr>
              <tr><td><strong>Sunucu</strong></td><td>cp1.ocp-panel.dev (Apache/2.4.58, PHP ${X3Store.get().phpVersion})</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* ==========================================================
   * MAIL
   * ========================================================== */

  /* --- Email Accounts --- */
  email() {
    const domain = X3Store.getAccount().domain;
    const accounts = X3Store.list('emails');
    const rows = accounts.map(e => `
      <tr>
        <td><strong>${e.user}@${e.domain}</strong></td>
        <td>
          ${e.used} MB / ${e.quota} MB (${Math.min(100, Math.round((e.used / e.quota) * 100))}%)
          <div class="x3-progress"><div class="x3-progress-fill" style="width:${Math.min(100, (e.used / e.quota) * 100)}%"></div></div>
        </td>
        <td>${e.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-danger">Askıda</span>'}</td>
        <td>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('${e.user}@${e.domain} webmail açılıyor')">Webmail</button>
          <button class="btn-x3-sm" onclick="cPanelSubPages.toggleEmail(${e.id})">${e.status === 'active' ? 'Askıya Al' : 'Aktifleştir'}</button>
          <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteEmail(${e.id})">Sil</button>
        </td>
      </tr>
    `).join('');

    return `
      ${this.renderBreadcrumb('Mail', 'Email Accounts')}
      <div class="subpage-container">
        ${this.header('📧 Email Accounts', domain + ' alan adı için e-posta hesaplarını yönetin.')}
        <div class="x3-form-box">
          <h3>Add an Email Account</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Email:</label>
              <div style="display:flex; align-items:center; gap:0.4rem;">
                <input type="text" id="subEmailUser" class="x3-input" placeholder="user">
                <span>@ ${domain}</span>
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
          <thead><tr><th>Account (@${domain})</th><th>Usage / Quota / %</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  addEmail() {
    const u = document.getElementById('subEmailUser').value.trim();
    const p = document.getElementById('subEmailPass').value;
    const q = parseInt(document.getElementById('subEmailQuota').value) || 250;
    if (!u) { this.toast('Kullanıcı adı gerekli'); return; }
    if (p.length < 8) { this.toast('Şifre en az 8 karakter'); return; }
    const domain = X3Store.getAccount().domain;
    X3Store.add('emails', { user: u, domain, quota: q, used: 0, status: 'active', forward: '' });
    this.toast('E-posta hesabı oluşturuldu: ' + u + '@' + domain);
    document.getElementById('mainContentArea').innerHTML = this.email();
    cPanelApp.updateStats();
  },

  toggleEmail(id) { X3Store.toggleStatus('emails', id); this.toast('Hesap durumu güncellendi'); this.reload(); },
  deleteEmail(id) { X3Store.remove('emails', id); this.toast('Hesap silindi'); this.reload(); },
  reload() { document.getElementById('mainContentArea').innerHTML = this[this._last] ? this[this._last]() : this.email(); },

  /* --- Webmail --- */
  webmail() {
    const apps = [
      { name: 'Roundcube', icon: '✉️', desc: 'Modern web e-posta istemcisi' },
      { name: 'Horde', icon: '📬', desc: 'Klasik web e-posta istemcisi' },
      { name: 'SquirrelMail', icon: '🐿️', desc: 'Hafif web e-posta istemcisi' },
    ];
    const cards = apps.map(a => `
      <div class="video-card" onclick="cPanelApp.showToast('${a.name} yükleniyor...')">
        <div class="video-thumb">${a.icon}</div>
        <div class="video-info">
          <strong>${a.name}</strong>
          <span>${a.desc}</span>
        </div>
      </div>
    `).join('');
    return `
      ${this.renderBreadcrumb('Mail', 'Webmail')}
      <div class="subpage-container">
        ${this.header('🌐 Webmail', 'E-postalarınıza tarayıcıdan erişin.')}
        <div class="video-grid">${cards}</div>
        <div class="x3-form-box" style="margin-top:20px">
          <h3>Webmail URL</h3>
          <p>Webmail adresiniz: <code>https://${X3Store.getAccount().domain}/webmail</code></p>
        </div>
      </div>
    `;
  },

  /* --- BoxTrapper --- */
  boxtrapper() {
    const emails = X3Store.list('emails').map(e => e.user + '@' + e.domain);
    const opts = emails.map(e => `<option>${e}</option>`).join('');
    return `
      ${this.renderBreadcrumb('Mail', 'BoxTrapper')}
      <div class="subpage-container">
        ${this.header('📥 BoxTrapper', 'E-posta doğrulama sistemi — spam mesajları kutuya girmeden önce yakalar.')}
        <div class="x3-form-box">
          <h3>E-posta Hesabı Seçin</h3>
          <select id="btEmail" class="x3-input" style="max-width:320px">${opts}</select>
          <button class="btn-x3-primary" onclick="cPanelSubPages.enableBoxtrapper()">BoxTrapper\'u Etkinleştir</button>
          <div id="btResult"></div>
        </div>
        <h3>Karantina (Son 5 Mesaj)</h3>
        <table class="x3-data-table">
          <thead><tr><th>Zaman</th><th>Gönderen</th><th>Konu</th><th>İşlem</th></tr></thead>
          <tbody>
            <tr><td>10:32</td><td>spammer@ornek.net</td><td>Kazanç fırsatı!!!</td><td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Mesaj silindi')">Sil</button></td></tr>
            <tr><td>09:15</td><td>news@bulten.com</td><td>Haftalık bülten</td><td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Mesaj teslim edildi')">Teslim Et</button></td></tr>
            <tr><td>Dün</td><td>spam@kazan.com</td><td>Ücretsiz deneme</td><td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Mesaj silindi')">Sil</button></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  enableBoxtrapper() {
    document.getElementById('btResult').innerHTML = '<p class="success-msg">✅ BoxTrapper etkinleştirildi.</p>';
    this.toast('BoxTrapper açıldı');
  },

  /* --- Apache SpamAssassin --- */
  spamAssassin() {
    return `
      ${this.renderBreadcrumb('Mail', 'Apache SpamAssassin')}
      <div class="subpage-container">
        ${this.header('🧠 Apache SpamAssassin', 'E-posta spam filtreleme motoru.')}
        <div class="x3-form-box">
          <h3>Durum</h3>
          <p>SpamAssassin: <span class="badge-active">Etkin</span> — Sistem geneli skor eşiği: <strong>5.0</strong></p>
          <label class="switch-row">
            <input type="checkbox" checked onchange="cPanelApp.showToast('SpamAssassin durumu değiştirildi')">
            Kullanıcı bazlı filtreleme
          </label>
          <label class="switch-row">
            <input type="checkbox" checked onchange="cPanelApp.showToast('Kara liste güncellendi')">
            Otomatik kara liste güncellemeleri
          </label>
        </div>
        <div class="x3-form-box">
          <h3>Spam Skoru Testi</h3>
          <p>Mesaj içeriğini yapıştırıp spam skorunu test edin.</p>
          <textarea id="saTest" class="x3-input" rows="5" placeholder="Test mesajı içeriği..."></textarea>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Analiz tamamlandı — Skor: 2.1 (spam değil)')">Test Et</button>
        </div>
      </div>
    `;
  },

  /* --- Forwarders --- */
  forwarders() {
    const fws = X3Store.list('forwarders');
    const rows = fws.map(f => `
      <tr>
        <td><strong>${f.from}</strong></td>
        <td>→ ${f.to}</td>
        <td><span class="badge-active">Aktif</span></td>
        <td>
          <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteForwarder(${f.id})">Sil</button>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Mail', 'Forwarders')}
      <div class="subpage-container">
        ${this.header('↪️ Forwarders', 'E-postaları başka adreslere yönlendirin.')}
        <div class="x3-form-box">
          <h3>Add Forwarder</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Gelen Adres:</label>
              <div style="display:flex;gap:0.4rem;align-items:center">
                <input type="text" id="fwFrom" class="x3-input" placeholder="destek">
                <span>@ ${X3Store.getAccount().domain}</span>
              </div>
            </div>
            <div class="form-group">
              <label>Yönlendirilecek Adres:</label>
              <input type="email" id="fwTo" class="x3-input" placeholder="hedef@ornek.com">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addForwarder()">+ Add Forwarder</button>
        </div>
        <h3>Current Forwarders</h3>
        <table class="x3-data-table">
          <thead><tr><th>From</th><th>To</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">Henüz yönlendirme yok.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  addForwarder() {
    const from = document.getElementById('fwFrom').value.trim();
    const to = document.getElementById('fwTo').value.trim();
    if (!from || !to) { this.toast('Tüm alanları doldurun'); return; }
    X3Store.add('forwarders', { from: from + '@' + X3Store.getAccount().domain, to, status: 'active' });
    this.toast('Yönlendirme eklendi');
    document.getElementById('mainContentArea').innerHTML = this.forwarders();
  },
  deleteForwarder(id) { X3Store.remove('forwarders', id); this.toast('Yönlendirme silindi'); document.getElementById('mainContentArea').innerHTML = this.forwarders(); },

  /* --- Autoresponders --- */
  autoresponders() {
    const list = X3Store.list('autoresponders');
    const rows = list.map(a => `
      <tr>
        <td><strong>${a.email}</strong></td>
        <td>${a.subject}</td>
        <td>${a.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-warn">Pasif</span>'}</td>
        <td><button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteAuto(${a.id})">Sil</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Mail', 'Autoresponders')}
      <div class="subpage-container">
        ${this.header('🤖 Autoresponders', 'Otomatik yanıt mesajları.')}
        <div class="x3-form-box">
          <h3>Add Autoresponder</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>E-posta:</label>
              <input type="text" id="arEmail" class="x3-input" placeholder="info@${X3Store.getAccount().domain}">
            </div>
            <div class="form-group">
              <label>Konu:</label>
              <input type="text" id="arSubject" class="x3-input" value="Mesajınız alındı">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label>Yanıt Metni:</label>
              <textarea id="arBody" class="x3-input" rows="3">Teşekkür ederiz. Mesajınız en kısa sürede yanıtlanacaktır.</textarea>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addAuto()">+ Create Autoresponder</button>
        </div>
        <h3>Current Autoresponders</h3>
        <table class="x3-data-table">
          <thead><tr><th>Email</th><th>Subject</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">Yok.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  addAuto() {
    const email = document.getElementById('arEmail').value.trim();
    const subject = document.getElementById('arSubject').value.trim();
    const body = document.getElementById('arBody').value.trim();
    if (!email) { this.toast('E-posta gerekli'); return; }
    X3Store.add('autoresponders', { email, subject, body, status: 'active' });
    this.toast('Otomatik yanıt eklendi');
    document.getElementById('mainContentArea').innerHTML = this.autoresponders();
  },
  deleteAuto(id) { X3Store.remove('autoresponders', id); this.toast('Silindi'); document.getElementById('mainContentArea').innerHTML = this.autoresponders(); },

  /* --- Mailing Lists --- */
  mailingLists() {
    return `
      ${this.renderBreadcrumb('Mail', 'Mailing Lists')}
      <div class="subpage-container">
        ${this.header('📋 Mailing Lists', 'E-posta listeleri oluşturun ve yönetin.')}
        <div class="x3-form-box">
          <h3>Create Mailing List</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Liste Adı:</label>
              <div style="display:flex;gap:0.4rem;align-items:center">
                <input type="text" id="mlName" class="x3-input" placeholder="duyurular">
                <span>@ ${X3Store.getAccount().domain}</span>
              </div>
            </div>
            <div class="form-group">
              <label>Yönetici E-postası:</label>
              <input type="email" id="mlAdmin" class="x3-input" value="${X3Store.getAccount().email}">
            </div>
            <div class="form-group">
              <label>Şifre:</label>
              <input type="password" id="mlPass" class="x3-input">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.createMailingList()">+ Create</button>
        </div>
        <h3>Current Lists</h3>
        <table class="x3-data-table">
          <thead><tr><th>Liste</th><th>Üye Sayısı</th><th>İşlemler</th></tr></thead>
          <tbody><tr><td colspan="3">Henüz liste yok.</td></tr></tbody>
        </table>
      </div>
    `;
  },

  createMailingList() {
    const n = document.getElementById('mlName').value.trim();
    if (!n) { this.toast('Liste adı gerekli'); return; }
    this.toast('Mail listesi oluşturuldu: ' + n + '@' + X3Store.getAccount().domain);
    document.getElementById('mainContentArea').innerHTML = this.mailingLists();
  },

  /* --- Email Deliverability --- */
  deliverability() {
    const a = X3Store.getAccount();
    return `
      ${this.renderBreadcrumb('Mail', 'Email Deliverability')}
      <div class="subpage-container">
        ${this.header('📨 Email Deliverability', 'E-postalarınızın teslim edilebilirlik durumu.')}
        <div class="deliverability-score">
          <div class="score-circle">92<span>/100</span></div>
          <div>
            <h3>İyi Durumda</h3>
            <p>${a.domain} için teslim edilebilirlik puanı sağlıklı seviyede.</p>
          </div>
        </div>
        <h3>Öneriler</h3>
        <table class="x3-data-table">
          <thead><tr><th>Alan</th><th>Durum</th><th>Öneri</th></tr></thead>
          <tbody>
            <tr><td>SPF Kaydı</td><td><span class="badge-active">✓ Doğrulandı</span></td><td>—</td></tr>
            <tr><td>DKIM İmzası</td><td><span class="badge-active">✓ Doğrulandı</span></td><td>—</td></tr>
            <tr><td>DMARC Politikası</td><td><span class="badge-warn">⚠ Eksik</span></td><td>DMARC kaydı ekleyin</td></tr>
            <tr><td>PTR Kaydı</td><td><span class="badge-warn">⚠ Kontrol edin</span></td><td>IP ters çözümleme doğrulayın</td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  /* --- Email Authentication --- */
  emailAuth() {
    const a = X3Store.getAccount();
    return `
      ${this.renderBreadcrumb('Mail', 'Email Authentication')}
      <div class="subpage-container">
        ${this.header('🔐 Email Authentication', 'SPF, DKIM ve DMARC kayıtlarını yönetin.')}
        <div class="x3-form-box">
          <h3>SPF Kaydı</h3>
          <code class="dns-code">v=spf1 include:spf.${a.domain} ~all</code>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('SPF kaydı kopyalandı')">📋 Kopyala</button>
        </div>
        <div class="x3-form-box">
          <h3>DKIM Kaydı</h3>
          <p>DKIM: <span class="badge-active">Etkin</span> — Selector: <code>default</code></p>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('DKIM yeniden oluşturuldu')">↻ Yeniden Oluştur</button>
          <button class="btn-x3-sm danger" onclick="cPanelApp.showToast('DKIM devre dışı')">Devre Dışı Bırak</button>
        </div>
        <div class="x3-form-box">
          <h3>DMARC Kaydı</h3>
          <code class="dns-code">v=DMARC1; p=none; rua=mailto:dmarc@${a.domain}</code>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('DMARC kaydı kopyalandı')">📋 Kopyala</button>
        </div>
      </div>
    `;
  },

  /* --- Email Filters --- */
  emailFilters() {
    const filters = X3Store.list('mailFilters');
    const rows = filters.map(f => `
      <tr>
        <td><strong>${f.name}</strong></td>
        <td>${f.rules}</td>
        <td>${f.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-warn">Pasif</span>'}</td>
        <td><button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteFilter(${f.id})">Sil</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Mail', 'Email Filters')}
      <div class="subpage-container">
        ${this.header('🔍 Email Filters', 'Hesap bazlı e-posta filtreleri.')}
        <div class="x3-form-box">
          <h3>Create Filter</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Filtre Adı:</label>
              <input type="text" id="flName" class="x3-input" placeholder="Spam engelle">
            </div>
            <div class="form-group">
              <label>Kural:</label>
              <select id="flRule" class="x3-input">
                <option>Konu içeriyor</option>
                <option>Gönderen içeriyor</option>
                <option>Gövde içeriyor</option>
                <option>Ek boyutu büyük</option>
              </select>
            </div>
            <div class="form-group">
              <label>Değer:</label>
              <input type="text" id="flValue" class="x3-input" placeholder="viagra">
            </div>
            <div class="form-group">
              <label>Eylem:</label>
              <select id="flAction" class="x3-input">
                <option>Mesajı sil</option>
                <option>Çöp kutusuna taşı</option>
                <option>Yönlendir</option>
              </select>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addFilter()">+ Create Filter</button>
        </div>
        <h3>Current Filters</h3>
        <table class="x3-data-table">
          <thead><tr><th>Name</th><th>Rules</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">Yok.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  addFilter() {
    const n = document.getElementById('flName').value.trim();
    const v = document.getElementById('flValue').value.trim();
    if (!n || !v) { this.toast('Ad ve değer gerekli'); return; }
    const rule = document.getElementById('flRule').value;
    const action = document.getElementById('flAction').value;
    X3Store.add('mailFilters', { name: n, rules: `${rule} "${v}" → ${action}`, status: 'active' });
    this.toast('Filtre oluşturuldu');
    document.getElementById('mainContentArea').innerHTML = this.emailFilters();
  },
  deleteFilter(id) { X3Store.remove('mailFilters', id); this.toast('Filtre silindi'); document.getElementById('mainContentArea').innerHTML = this.emailFilters(); },

  /* --- Global Email Filters --- */
  globalFilters() {
    return `
      ${this.renderBreadcrumb('Mail', 'Global Email Filters')}
      <div class="subpage-container">
        ${this.header('🌍 Global Email Filters', 'Tüm e-posta hesaplarına uygulanan filtreler.')}
        <div class="x3-form-box">
          <h3>Add Global Filter</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Filtre Adı:</label>
              <input type="text" id="gfName" class="x3-input" placeholder="Global spam">
            </div>
            <div class="form-group">
              <label>Kural:</label>
              <select id="gfRule" class="x3-input"><option>Gönderen içeriyor</option><option>Konu içeriyor</option></select>
            </div>
            <div class="form-group">
              <label>Değer:</label>
              <input type="text" id="gfValue" class="x3-input" placeholder="kazan">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addGlobalFilter()">+ Add</button>
        </div>
        <table class="x3-data-table">
          <thead><tr><th>Name</th><th>Rules</th><th>Actions</th></tr></thead>
          <tbody><tr><td colspan="3">Global filtre yok.</td></tr></tbody>
        </table>
      </div>
    `;
  },
  addGlobalFilter() { this.toast('Global filtre eklendi'); document.getElementById('mainContentArea').innerHTML = this.globalFilters(); },

  /* --- Track Delivery --- */
  trackDelivery() {
    const logs = [
      { id: 1, to: 'adam@adamowen.co.uk', from: 'info@adamowen.co.uk', date: '2024-04-01 14:30', status: 'delivered' },
      { id: 2, to: 'destek@ornek.com', from: 'adam@adamowen.co.uk', date: '2024-04-01 13:12', status: 'pending' },
      { id: 3, to: 'spam@ornek.net', from: 'adam@adamowen.co.uk', date: '2024-03-31 18:44', status: 'failed' },
    ];
    const rows = logs.map(l => `
      <tr>
        <td>${l.to}</td>
        <td>${l.from}</td>
        <td>${l.date}</td>
        <td>${l.status === 'delivered' ? '<span class="badge-active">✓ Teslim edildi</span>'
          : l.status === 'pending' ? '<span class="badge-warn">⏳ Bekliyor</span>'
          : '<span class="badge-danger">✗ Hata</span>'}</td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Mail', 'Track Delivery')}
      <div class="subpage-container">
        ${this.header('📬 Track Delivery', 'Mesaj teslim durumlarını izleyin.')}
        <table class="x3-data-table">
          <thead><tr><th>Alıcı</th><th>Gönderen</th><th>Tarih</th><th>Durum</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* --- Email Disk Usage --- */
  emailDiskUsage() {
    const accounts = X3Store.list('emails');
    const rows = accounts.map(e => `
      <tr>
        <td><strong>${e.user}@${e.domain}</strong></td>
        <td>${e.used} MB</td>
        <td>${e.quota} MB</td>
        <td>
          <div class="x3-progress"><div class="x3-progress-fill" style="width:${Math.min(100, (e.used / e.quota) * 100)}%"></div></div>
        </td>
        <td>${Math.min(100, Math.round((e.used / e.quota) * 100))}%</td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Mail', 'Email Disk Usage')}
      <div class="subpage-container">
        ${this.header('💾 Email Disk Usage', 'E-posta hesaplarının disk kullanımı.')}
        <table class="x3-data-table">
          <thead><tr><th>Account</th><th>Used</th><th>Quota</th><th>Bar</th><th>%</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* --- MX Entry --- */
  mxEntry() {
    const domain = X3Store.getAccount().domain;
    return `
      ${this.renderBreadcrumb('Mail', 'MX Entry')}
      <div class="subpage-container">
        ${this.header('📡 MX Entry', 'Mail exchange kayıtlarını yönetin.')}
        <div class="x3-form-box">
          <h3>MX Kayıtları — ${domain}</h3>
          <table class="x3-data-table">
            <thead><tr><th>Öncelik</th><th>Hedef</th><th>İşlem</th></tr></thead>
            <tbody>
              <tr><td>10</td><td>mail.${domain}</td><td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Kayıt silindi')">Sil</button></td></tr>
              <tr><td>20</td><td>backup.${domain}</td><td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Kayıt silindi')">Sil</button></td></tr>
            </tbody>
          </table>
          <div class="form-grid" style="margin-top:15px">
            <div class="form-group">
              <label>Öncelik:</label>
              <input type="number" id="mxPrio" class="x3-input" value="10">
            </div>
            <div class="form-group">
              <label>Hedef:</label>
              <input type="text" id="mxTarget" class="x3-input" placeholder="mail.ornek.com">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('MX kaydı eklendi')">+ Add MX Record</button>
        </div>
      </div>
    `;
  },

  /* --- Calendars and Contacts --- */
  calendars() {
    return `
      ${this.renderBreadcrumb('Mail', 'Calendars and Contacts')}
      <div class="subpage-container">
        ${this.header('📅 Calendars and Contacts', 'CalDAV ve CardDAV erişim bilgileri.')}
        <div class="x3-form-box">
          <h3>CalDAV Sunucu Bilgileri</h3>
          <p><strong>Sunucu:</strong> <code>https://${X3Store.getAccount().domain}/caldav</code></p>
          <p><strong>Kullanıcı:</strong> <code>${X3Store.getAccount().user}</code></p>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('CalDAV ayarları doğrulandı')">Bağlantıyı Test Et</button>
        </div>
        <div class="x3-form-box">
          <h3>CardDAV Sunucu Bilgileri</h3>
          <p><strong>Sunucu:</strong> <code>https://${X3Store.getAccount().domain}/carddav</code></p>
          <p><strong>Kullanıcı:</strong> <code>${X3Store.getAccount().user}</code></p>
        </div>
      </div>
    `;
  },

  /* --- Email Routing --- */
  emailRouting() {
    return `
      ${this.renderBreadcrumb('Mail', 'Email Routing')}
      <div class="subpage-container">
        ${this.header('🚦 Email Routing', 'Alan adı e-posta yönlendirme yapılandırması.')}
        <div class="x3-form-box">
          <h3>${X3Store.getAccount().domain}</h3>
          <p>Yönlendirme: <span class="badge-active">Yerel Mail Exchange</span></p>
          <p class="subpage-subtitle">MX kayıtları bu sunucuya işaret ediyor — e-postalar yerel olarak teslim edilir.</p>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Yönlendirme değiştirildi')">Yönlendirmeyi Değiştir</button>
        </div>
      </div>
    `;
  },

  /* ==========================================================
   * FILES (Faz 1 kapsamı — Faz 3'te genişletilecek)
   * ========================================================== */

  fileManager() {
    const files = X3Store.list('files');
    const rows = files.map(f => `
      <tr>
        <td>${f.type === 'dir' ? '📁' : '📄'} <strong>${f.name}</strong></td>
        <td>${f.type === 'dir' ? 'Dizin' : 'Dosya'}</td>
        <td>${f.size}</td>
        <td>${f.modified}</td>
        <td>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('${f.name} düzenleniyor')">✏️</button>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('${f.name} indiriliyor')">⬇</button>
          <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteFile(${f.id})">🗑</button>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Files', 'File Manager')}
      <div class="subpage-container">
        ${this.header('📁 File Manager', '/home/' + X3Store.getAccount().user + '/public_html')}
        <div class="fm-toolbar">
          <button class="fm-btn" onclick="cPanelSubPages.promptNewFile()">📄 New File</button>
          <button class="fm-btn" onclick="cPanelSubPages.promptNewFolder()">📂 New Folder</button>
          <button class="fm-btn" onclick="cPanelApp.showToast('Kopyalama (simülasyon)')">📋 Copy</button>
          <button class="fm-btn" onclick="cPanelApp.showToast('Taşıma (simülasyon)')">✂️ Move</button>
          <button class="fm-btn highlight" onclick="cPanelApp.showToast('Yükleme başlatıldı (simülasyon)')">⬆ Upload</button>
          <button class="fm-btn" onclick="cPanelApp.showToast('İndirme başlatıldı')">⬇ Download</button>
          <button class="fm-btn danger" onclick="cPanelApp.showToast('Silme onayı (simülasyon)')">🗑️ Delete</button>
        </div>
        <table class="x3-data-table">
          <thead><tr><th>Ad</th><th>Tip</th><th>Boyut</th><th>Değiştirilme</th><th>İşlemler</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  promptNewFile() {
    const name = prompt('Yeni dosya adı (public_html/ içinde):');
    if (name) {
      X3Store.add('files', { name, path: '/public_html', size: '0 KB', type: 'file', modified: '2024-04-01' });
      this.toast('Dosya oluşturuldu: ' + name);
      document.getElementById('mainContentArea').innerHTML = this.fileManager();
    }
  },

  promptNewFolder() {
    const name = prompt('Yeni klasör adı:');
    if (name) {
      X3Store.add('files', { name, path: '/public_html', size: '—', type: 'dir', modified: '2024-04-01' });
      this.toast('Klasör oluşturuldu: ' + name);
      document.getElementById('mainContentArea').innerHTML = this.fileManager();
    }
  },

  deleteFile(id) { X3Store.remove('files', id); this.toast('Silindi'); document.getElementById('mainContentArea').innerHTML = this.fileManager(); },

  legacyFileManager() { return this.fileManager(); },

  /* --- Disk Space Usage --- */
  diskUsage() {
    const a = X3Store.getAccount();
    const dirs = [
      { name: '/public_html', size: '1.2 GB' },
      { name: '/mail', size: '142 MB' },
      { name: '/logs', size: '85 MB' },
      { name: '/.trash', size: '23 MB' },
    ];
    const rows = dirs.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>${d.size}</td>
        <td>
          <div class="x3-progress"><div class="x3-progress-fill" style="width:${Math.random() * 40 + 10}%"></div></div>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Files', 'Disk Space Usage')}
      <div class="subpage-container">
        ${this.header('💾 Disk Space Usage', 'Genel kullanım: ' + (a.diskUsed / 1024).toFixed(2) + ' GB / ' + (a.diskQuota / 1024).toFixed(0) + ' GB')}
        <div class="x3-progress x3-progress-lg"><div class="x3-progress-fill" style="width:${X3Store.diskPercent()}%"></div></div>
        <p>${X3Store.diskPercent()}% kullanıldı</p>
        <table class="x3-data-table">
          <thead><tr><th>Dizin</th><th>Boyut</th><th>Dağılım</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* --- Web Disk --- */
  webDisk() {
    return `
      ${this.renderBreadcrumb('Files', 'Web Disk')}
      <div class="subpage-container">
        ${this.header('💿 Web Disk', 'Dosyalarınıza masaüstü gibi erişin (WebDAV).')}
        <div class="x3-form-box">
          <h3>Web Disk Erişimi</h3>
          <p><strong>URL:</strong> <code>https://${X3Store.getAccount().domain}:2078</code></p>
          <p><strong>Kullanıcı:</strong> <code>${X3Store.getAccount().user}</code></p>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Web Disk istemcisi başlatılıyor')">🚀 Web Disk'i Başlat</button>
        </div>
        <div class="x3-form-box">
          <h3>İstemci Kurulum Dosyaları</h3>
          <table class="x3-data-table">
            <thead><tr><th>Platform</th><th>Durum</th></tr></thead>
            <tbody>
              <tr><td>Windows</td><td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Windows kurulum dosyası indirildi')">İndir</button></td></tr>
              <tr><td>macOS</td><td><button class="btn-x3-sm" onclick="cPanelApp.showToast('macOS kurulum dosyası indirildi')">İndir</button></td></tr>
              <tr><td>Linux</td><td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Linux kurulum dosyası indirildi')">İndir</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* --- FTP Accounts --- */
  ftp() {
    const accounts = X3Store.list('ftpAccounts');
    const rows = accounts.map(f => `
      <tr>
        <td><strong>${f.user}</strong></td>
        <td>${f.dir}</td>
        <td>${f.used} MB / ${f.quota} MB</td>
        <td>${f.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-danger">Askıda</span>'}</td>
        <td>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('${f.user} için parola sıfırlandı')">Parola Sıfırla</button>
          <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteFtp(${f.id})">Sil</button>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Files', 'FTP Accounts')}
      <div class="subpage-container">
        ${this.header('📤 FTP Accounts', 'FTP kullanıcılarını yönetin.')}
        <div class="x3-form-box">
          <h3>Add FTP Account</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Kullanıcı Adı:</label>
              <input type="text" id="ftpUser" class="x3-input" placeholder="ftpuser">
            </div>
            <div class="form-group">
              <label>Şifre:</label>
              <input type="password" id="ftpPass" class="x3-input">
            </div>
            <div class="form-group">
              <label>Dizin:</label>
              <input type="text" id="ftpDir" class="x3-input" value="/home/${X3Store.getAccount().user}/public_html">
            </div>
            <div class="form-group">
              <label>Kota (MB):</label>
              <input type="number" id="ftpQuota" class="x3-input" value="1024">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addFtp()">+ Create FTP Account</button>
        </div>
        <h3>FTP Accounts</h3>
        <table class="x3-data-table">
          <thead><tr><th>User</th><th>Directory</th><th>Usage</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  addFtp() {
    const u = document.getElementById('ftpUser').value.trim();
    const p = document.getElementById('ftpPass').value;
    const dir = document.getElementById('ftpDir').value.trim();
    const q = parseInt(document.getElementById('ftpQuota').value) || 1024;
    if (!u || p.length < 8) { this.toast('Kullanıcı adı ve 8+ karakter şifre gerekli'); return; }
    X3Store.add('ftpAccounts', { user: u, dir, quota: q, used: 0, status: 'active' });
    this.toast('FTP hesabı oluşturuldu: ' + u);
    document.getElementById('mainContentArea').innerHTML = this.ftp();
  },
  deleteFtp(id) { X3Store.remove('ftpAccounts', id); this.toast('FTP hesabı silindi'); document.getElementById('mainContentArea').innerHTML = this.ftp(); },

  /* --- FTP Connections --- */
  ftpConnections() {
    const conns = [
      { ip: '78.176.55.201', user: 'ftpuser1', time: '14:22:10', files: 12, status: 'connected' },
      { ip: '88.241.90.14', user: 'adamowen', time: '13:58:44', files: 3, status: 'connected' },
    ];
    const rows = conns.map(c => `
      <tr>
        <td>${c.ip}</td>
        <td>${c.user}</td>
        <td>${c.time}</td>
        <td>${c.files}</td>
        <td><span class="badge-active">Bağlı</span></td>
        <td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Bağlantı kesildi')">Kes</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Files', 'FTP Connections')}
      <div class="subpage-container">
        ${this.header('🔌 FTP Connections', 'Aktif FTP oturumları.')}
        <table class="x3-data-table">
          <thead><tr><th>IP</th><th>Kullanıcı</th><th>Giriş</th><th>Dosya</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* --- Backups --- */
  backups() {
    const backups = X3Store.list('backups');
    const rows = backups.map(b => `
      <tr>
        <td>📦 ${b.name}</td>
        <td>${b.size}</td>
        <td>${b.date}</td>
        <td><span class="badge-active">${b.status}</span></td>
        <td>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('${b.name} indiriliyor')">⬇ İndir</button>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('${b.name} geri yükleniyor')">↻ Geri Yükle</button>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Files', 'Backups')}
      <div class="subpage-container">
        ${this.header('🗄️ Backups', 'Yedeklerinizi indirin veya geri yükleyin.')}
        <div class="x3-form-box">
          <h3>Full Backup</h3>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Tam yedekleme başlatıldı')">📦 Generate Full Backup</button>
        </div>
        <h3>Mevcut Yedekler</h3>
        <table class="x3-data-table">
          <thead><tr><th>Dosya</th><th>Boyut</th><th>Tarih</th><th>Durum</th><th>İşlemler</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* --- Backup Wizard --- */
  backupWizard() {
    return `
      ${this.renderBreadcrumb('Files', 'Backup Wizard')}
      <div class="subpage-container">
        ${this.header('🧙 Backup Wizard', 'Yedekleme sihirbazı — adım adım.')}
        <div class="wizard-steps">
          <div class="wizard-step active">1. Yedekle veya Geri Yükle</div>
          <div class="wizard-step">2. Tür Seç</div>
          <div class="wizard-step">3. Onayla</div>
        </div>
        <div class="x3-form-box">
          <h3>Ne yapmak istiyorsunuz?</h3>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Yedekleme sihirbazı başlatıldı')">📦 Yedekle</button>
          <button class="btn-x3" onclick="cPanelApp.showToast('Geri yükleme sihirbazı başlatıldı')">↻ Geri Yükle</button>
        </div>
      </div>
    `;
  },

  /* --- Git Version Control --- */
  git() {
    const repos = [
      { name: 'adamowen-site', branch: 'main', commit: 'a3f9c21', status: 'uptodate' },
      { name: 'blog-theme', branch: 'main', commit: '8d02be4', status: 'behind' },
    ];
    const rows = repos.map(r => `
      <tr>
        <td><strong>${r.name}</strong></td>
        <td>${r.branch}</td>
        <td><code>${r.commit}</code></td>
        <td>${r.status === 'uptodate' ? '<span class="badge-active">Güncel</span>' : '<span class="badge-warn">Geri'}</td>
        <td><button class="btn-x3-sm" onclick="cPanelApp.showToast('${r.name} çekiliyor (git pull)')">↻ Pull</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Files', 'Git Version Control')}
      <div class="subpage-container">
        ${this.header('🌿 Git Version Control', 'Git depolarınızı yönetin.')}
        <div class="x3-form-box">
          <h3>Create Repository</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Depo Yolu:</label>
              <input type="text" id="gitPath" class="x3-input" value="/home/${X3Store.getAccount().user}/repo">
            </div>
            <div class="form-group">
              <label>Kaynak:</label>
              <select id="gitSrc" class="x3-input"><option>Yeni boş depo</option><option>GitHub'dan klonla</option></select>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Depo oluşturuldu')">+ Create</button>
        </div>
        <h3>Repositories</h3>
        <table class="x3-data-table">
          <thead><tr><th>Depo</th><th>Dal</th><th>Son Commit</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* --- Images --- */
  images() {
    return `
      ${this.renderBreadcrumb('Files', 'Images')}
      <div class="subpage-container">
        ${this.header('🖼️ Images', 'Sunucudaki görselleri yönetin (thumbnails, görüntü ayarları).')}
        <div class="x3-form-box">
          <h3>Thumbnail Oluşturucu</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Dizin:</label>
              <input type="text" class="x3-input" value="/home/${X3Store.getAccount().user}/public_html/images">
            </div>
            <div class="form-group">
              <label>Boyut:</label>
              <input type="text" class="x3-input" value="200x200">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Thumbnail üretimi başladı (simülasyon)')">Generate Thumbnails</button>
        </div>
        <div class="x3-form-box">
          <h3>Görüntü Dönüştürücü</h3>
          <p>PNG, JPG, GIF, WebP formatları arasında dönüştürme.</p>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Dönüştürme başlatıldı')">🔄 Convert Images</button>
        </div>
      </div>
    `;
  },

  /* --- Directory Privacy --- */
  directoryPrivacy() {
    const protectedDirs = [
      { name: 'admin', user: 'admin_user', status: 'protected' },
      { name: 'private', user: 'gizli', status: 'protected' },
    ];
    const rows = protectedDirs.map(d => `
      <tr>
        <td><strong>/public_html/${d.name}</strong></td>
        <td>${d.user}</td>
        <td><span class="badge-active">Korumalı</span></td>
        <td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Koruma kaldırıldı')">Korumayı Kaldır</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Files', 'Directory Privacy')}
      <div class="subpage-container">
        ${this.header('🔒 Directory Privacy', 'Dizinleri parola ile koruyun.')}
        <div class="x3-form-box">
          <h3>Dizin Koru</h3>
          <div class="form-group">
            <label>Dizin Yolu:</label>
            <input type="text" id="dpPath" class="x3-input" value="/home/${X3Store.getAccount().user}/public_html/admin">
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Dizin korumaya alındı')">🔒 Koru</button>
        </div>
        <h3>Korumalı Dizinler</h3>
        <table class="x3-data-table">
          <thead><tr><th>Dizin</th><th>Kullanıcı</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* ==========================================================
   * LOGS
   * ========================================================== */

  visitors() {
    const v = X3Store.list('visitors');
    const rows = v.map(x => `
      <tr>
        <td>${x.ip}</td>
        <td>${x.date} ${x.time}</td>
        <td>${x.url}</td>
        <td>${x.ref}</td>
        <td>${x.ua}</td>
        <td>${x.code}</td>
        <td>${x.bytes}</td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Logs', 'Latest Visitors')}
      <div class="subpage-container">
        ${this.header('👁️ Latest Visitors', 'Son ziyaretçi kayıtları.')}
        <table class="x3-data-table">
          <thead><tr><th>IP</th><th>Tarih/Saat</th><th>URL</th><th>Referans</th><th>Tarayıcı</th><th>Kod</th><th>Boyut</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  bandwidth() {
    const a = X3Store.getAccount();
    const months = [
      { m: 'Ocak', v: '3.1 GB' }, { m: 'Şubat', v: '3.4 GB' }, { m: 'Mart', v: '3.2 GB' },
    ];
    const rows = months.map(x => `
      <tr>
        <td>${x.m} 2024</td>
        <td>${x.v}</td>
        <td><div class="x3-progress"><div class="x3-progress-fill" style="width:${Math.random() * 30 + 10}%"></div></div></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Logs', 'Bandwidth')}
      <div class="subpage-container">
        ${this.header('📊 Bandwidth', 'Bu ay: ' + (a.bandwidthUsed / 1024).toFixed(2) + ' GB / ' + (a.bandwidthQuota / 1024).toFixed(0) + ' GB')}
        <div class="x3-progress x3-progress-lg"><div class="x3-progress-fill" style="width:${X3Store.bandwidthPercent()}%"></div></div>
        <table class="x3-data-table">
          <thead><tr><th>Ay</th><th>Kullanım</th><th>Grafik</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  webalizer() {
    return `
      ${this.renderBreadcrumb('Logs', 'Webalizer')}
      <div class="subpage-container">
        ${this.header('📈 Webalizer', 'Web sitesi istatistik raporu.')}
        <div class="stats-grid">
          <div class="stat-card"><strong>12,482</strong><span>Ziyaret</span></div>
          <div class="stat-card"><strong>48,201</strong><span>Sayfa Görüntüleme</span></div>
          <div class="stat-card"><strong>3.2 GB</strong><span>Bant Genişliği</span></div>
          <div class="stat-card"><strong>1,204</strong><span>Tekil Ziyaretçi</span></div>
        </div>
        <div class="x3-form-box">
          <h3>Aylık Raporlar</h3>
          <table class="x3-data-table">
            <thead><tr><th>Ay</th><th>Ziyaret</th><th>Görüntüleme</th></tr></thead>
            <tbody>
              <tr><td>Mart 2024</td><td>4,102</td><td>15,884</td></tr>
              <tr><td>Şubat 2024</td><td>4,486</td><td>17,220</td></tr>
              <tr><td>Ocak 2024</td><td>3,894</td><td>15,097</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  errors() {
    const logs = X3Store.list('errorLogs');
    const rows = logs.map(l => `
      <tr>
        <td>${l.date}</td>
        <td>${l.time}</td>
        <td><span class="badge-${l.type === 'error' ? 'danger' : 'warn'}">${l.type}</span></td>
        <td><code>${l.msg}</code></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Logs', 'Errors')}
      <div class="subpage-container">
        ${this.header('❌ Errors', 'Apache hata günlüğü.')}
        <button class="btn-x3" onclick="cPanelApp.showToast('Günlük temizlendi (simülasyon)')">🗑 Günlüğü Temizle</button>
        <table class="x3-data-table" style="margin-top:15px">
          <thead><tr><th>Tarih</th><th>Saat</th><th>Tip</th><th>Mesaj</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  resourceUsage() {
    return `
      ${this.renderBreadcrumb('Logs', 'Resource Usage')}
      <div class="subpage-container">
        ${this.header('🖥️ Resource Usage', 'Sunucu kaynak kullanım grafikleri.')}
        <div class="stats-grid">
          <div class="stat-card"><strong>%12</strong><span>CPU</span></div>
          <div class="stat-card"><strong>%38</strong><span>Bellek</span></div>
          <div class="stat-card"><strong>12</strong><span>İşlem</span></div>
          <div class="stat-card"><strong>0.8</strong><span>Ort. Yük (1dk)</span></div>
        </div>
        <div class="x3-form-box">
          <h3>Son 24 Saat CPU Kullanımı</h3>
          <div class="chart-bars" id="cpuChart"></div>
        </div>
      </div>
    `;
  },

  cpuConcurrent() {
    return `
      ${this.renderBreadcrumb('Logs', 'CPU / Concurrent Connections')}
      <div class="subpage-container">
        ${this.header('⚙️ CPU / Concurrent Connections', 'Kaynak kullanım limitleri ve mevcut durum.')}
        <div class="x3-form-box">
          <h3>Limit Durumu</h3>
          <table class="x3-data-table">
            <thead><tr><th>Kaynak</th><th>Kullanım</th><th>Limit</th></tr></thead>
            <tbody>
              <tr><td>CPU</td><td>12%</td><td>100% (paylaşımlı)</td></tr>
              <tr><td>Eşzamanlı Bağlantı</td><td>4</td><td>20</td></tr>
              <tr><td>IO Kullanımı</td><td>2.1 MB/s</td><td>10 MB/s</td></tr>
              <tr><td>İşlem Sayısı</td><td>12</td><td>50</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  sqlErrors() {
    return `
      ${this.renderBreadcrumb('Logs', 'SQL Error Logs')}
      <div class="subpage-container">
        ${this.header('🗃️ SQL Error Logs', 'MySQL hata günlüğü.')}
        <div class="x3-form-box">
          <p><span class="badge-active">Günlük boş</span> — Son kontrol: şimdi</p>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('SQL günlüğü yenilendi')">↻ Yenile</button>
        </div>
      </div>
    `;
  },

  indexes() {
    return `
      ${this.renderBreadcrumb('Logs', 'Indexes')}
      <div class="subpage-container">
        ${this.header('📑 Indexes', 'Dizin görüntüleme ayarları.')}
        <div class="x3-form-box">
          <h3>Dizin Görüntüleme</h3>
          <p>Varsayılan: <span class="badge-warn">İndeksleme Kapalı</span></p>
          <div class="form-grid">
            <div class="form-group">
              <label>Dizin:</label>
              <input type="text" class="x3-input" value="/home/${X3Store.getAccount().user}/public_html">
            </div>
            <div class="form-group">
              <label>Mod:</label>
              <select class="x3-input">
                <option>İndeksleme Kapalı</option>
                <option>İndeksleme Açık</option>
                <option>HTML İndeksleme</option>
              </select>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Ayarlar uygulandı')">Uygula</button>
        </div>
      </div>
    `;
  },

  /* ==========================================================
   * DATABASES
   * ========================================================== */

  mysql() {
    const dbs = X3Store.list('databases');
    const rows = dbs.map(d => `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.user}</td>
        <td>${d.size}</td>
        <td>${d.tables} tablo</td>
        <td>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('phpMyAdmin açılıyor: ${d.name}')">phpMyAdmin</button>
          <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteDb(${d.id})">Sil</button>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Databases', 'MySQL Databases')}
      <div class="subpage-container">
        ${this.header('🗄️ MySQL® Databases', 'MySQL veritabanlarını yönetin.')}
        <div class="x3-form-box">
          <h3>Create New Database</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Veritabanı Adı:</label>
              <div style="display:flex;gap:0.4rem;align-items:center">
                <span>${X3Store.getAccount().user}_</span>
                <input type="text" id="dbName" class="x3-input" placeholder="yeni_db">
              </div>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addDb()">+ Create Database</button>
        </div>
        <h3>Current Databases</h3>
        <table class="x3-data-table">
          <thead><tr><th>Database</th><th>User</th><th>Size</th><th>Tables</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  addDb() {
    const n = document.getElementById('dbName').value.trim();
    if (!n) { this.toast('Veritabanı adı gerekli'); return; }
    const user = X3Store.getAccount().user;
    X3Store.add('databases', { name: user + '_' + n, user: user + '_admin', size: '0.00 MB', collation: 'utf8mb4_general_ci', tables: 0 });
    this.toast('Veritabanı oluşturuldu: ' + user + '_' + n);
    document.getElementById('mainContentArea').innerHTML = this.mysql();
    cPanelApp.updateStats();
  },
  deleteDb(id) { X3Store.remove('databases', id); this.toast('Veritabanı silindi'); document.getElementById('mainContentArea').innerHTML = this.mysql(); cPanelApp.updateStats(); },

  mysqlWizard() {
    return `
      ${this.renderBreadcrumb('Databases', 'MySQL Database Wizard')}
      <div class="subpage-container">
        ${this.header('🧙 MySQL Database Wizard', 'Veritabanı + kullanıcıyı tek adımda oluşturun.')}
        <div class="wizard-steps">
          <div class="wizard-step active">1. Veritabanı</div>
          <div class="wizard-step">2. Kullanıcı</div>
          <div class="wizard-step">3. Yetkiler</div>
        </div>
        <div class="x3-form-box">
          <h3>Adım 1 — Veritabanı Adı</h3>
          <div class="form-group">
            <label>Veritabanı:</label>
            <div style="display:flex;gap:0.4rem;align-items:center">
              <span>${X3Store.getAccount().user}_</span>
              <input type="text" id="wizDb" class="x3-input" placeholder="uygulama">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Adım 1 tamam — kullanıcı oluşturmaya geçiliyor')">İleri →</button>
        </div>
      </div>
    `;
  },

  phpMyAdmin() {
    return `
      ${this.renderBreadcrumb('Databases', 'phpMyAdmin')}
      <div class="subpage-container">
        ${this.header('🐘 phpMyAdmin', 'MySQL yönetim arayüzü (simülasyon).')}
        <div class="pma-shell">
          <div class="pma-nav">
            <span>phpMyAdmin 5.2.1</span>
            <span class="badge-active">Bağlı: localhost</span>
          </div>
          <div class="pma-body">
            <div class="pma-sidebar">
              <div class="pma-db-item" onclick="cPanelApp.showToast('Veritabanı açıldı')">📊 adamowen_blog</div>
              <div class="pma-db-item" onclick="cPanelApp.showToast('Veritabanı açıldı')">📊 adamowen_portal</div>
              <div class="pma-db-item" onclick="cPanelApp.showToast('Yeni veritabanı')">➕ Yeni...</div>
            </div>
            <div class="pma-main">
              <h3>Hoş geldiniz!</h3>
              <p>phpMyAdmin, MySQL veritabanlarınızı yönetmenizi sağlar. Sol menüden bir veritabanı seçin.</p>
              <div class="x3-form-box">
                <h4>Sunucu Bilgisi</h4>
                <p>Sunucu: localhost:3306 · MySQL 8.0.36 · Karakter seti: UTF-8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  remoteMysql() {
    const hosts = [
      { id: 1, host: '185.199.108.15', status: 'active' },
    ];
    const rows = hosts.map(h => `
      <tr>
        <td><code>${h.host}</code></td>
        <td><span class="badge-active">İzinli</span></td>
        <td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Erişim kaldırıldı')">Kaldır</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Databases', 'Remote MySQL')}
      <div class="subpage-container">
        ${this.header('🌐 Remote MySQL', 'Uzak sunuculardan MySQL erişimine izin verin.')}
        <div class="x3-form-box">
          <h3>Add Access Host</h3>
          <div class="form-group">
            <label>Host (IP veya wildcard):</label>
            <input type="text" id="rmHost" class="x3-input" placeholder="192.168.1.%">
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Host eklendi')">+ Add Host</button>
        </div>
        <h3>Access Hosts</h3>
        <table class="x3-data-table">
          <thead><tr><th>Host</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  postgres() {
    return `
      ${this.renderBreadcrumb('Databases', 'PostgreSQL')}
      <div class="subpage-container">
        ${this.header('🐘 PostgreSQL', 'PostgreSQL veritabanı yönetimi.')}
        <div class="x3-form-box">
          <p><span class="badge-warn">PostgreSQL bu sunucuda kurulu değil.</span></p>
          <p>PostgreSQL'i etkinleştirmek için barındırma sağlayıcınıza başvurun.</p>
        </div>
      </div>
    `;
  },

  /* ==========================================================
   * DOMAINS
   * ========================================================== */

  domains() {
    const a = X3Store.getAccount();
    return `
      ${this.renderBreadcrumb('Domains', 'Domains')}
      <div class="subpage-container">
        ${this.header('🌐 Domains', 'Alan adlarınızı yönetin.')}
        <table class="x3-data-table">
          <thead><tr><th>Domain</th><th>Tip</th><th>Document Root</th><th>Durum</th></tr></thead>
          <tbody>
            <tr><td><strong>${a.domain}</strong></td><td>Ana Domain</td><td>/home/${a.user}/public_html</td><td><span class="badge-active">Aktif</span></td></tr>
            <tr><td><strong>blog.${a.domain}</strong></td><td>Subdomain</td><td>/home/${a.user}/public_html/blog</td><td><span class="badge-active">Aktif</span></td></tr>
            <tr><td><strong>${a.user}.net</strong></td><td>Addon</td><td>/home/${a.user}/public_html/net</td><td><span class="badge-active">Aktif</span></td></tr>
            <tr><td><strong>${a.user}.org</strong></td><td>Alias</td><td>→ ${a.domain}</td><td><span class="badge-active">Aktif</span></td></tr>
          </tbody>
        </table>
        <div class="x3-form-box">
          <h3>Domain Ekle</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Alan Adı:</label>
              <input type="text" id="domNew" class="x3-input" placeholder="yenisite.com">
            </div>
            <div class="form-group">
              <label>Tip:</label>
              <select id="domType" class="x3-input">
                <option>Addon Domain</option>
                <option>Alias</option>
                <option>Subdomain</option>
              </select>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Domain eklendi (simülasyon)')">+ Domain Ekle</button>
        </div>
      </div>
    `;
  },

  subdomains() {
    const subs = X3Store.list('subdomains');
    const rows = subs.map(s => `
      <tr>
        <td><strong>${s.prefix}.${s.domain}</strong></td>
        <td>${s.root}</td>
        <td>${s.redirect ? '→ ' + s.redirect : '—'}</td>
        <td>${s.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-danger">Askıda</span>'}</td>
        <td>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('${s.prefix}.${s.domain} yönetiliyor')">Yönet</button>
          <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteSub(${s.id})">Sil</button>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Domains', 'Subdomains')}
      <div class="subpage-container">
        ${this.header('🌍 Subdomains', 'Alt alan adlarını yönetin.')}
        <div class="x3-form-box">
          <h3>Create a Subdomain</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Subdomain Prefix:</label>
              <input type="text" id="subSubPrefix" class="x3-input" placeholder="blog">
            </div>
            <div class="form-group">
              <label>Domain:</label>
              <select class="x3-input"><option>${X3Store.getAccount().domain}</option></select>
            </div>
            <div class="form-group">
              <label>Document Root:</label>
              <input type="text" id="subSubRoot" class="x3-input" value="public_html/blog">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addSubdomain()">+ Create Subdomain</button>
        </div>
        <h3>Current Subdomains</h3>
        <table class="x3-data-table">
          <thead><tr><th>Subdomain</th><th>Document Root</th><th>Redirect</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">Yok.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  addSubdomain() {
    const p = document.getElementById('subSubPrefix').value.trim();
    const r = document.getElementById('subSubRoot').value.trim() || 'public_html/' + p;
    if (!p) { this.toast('Subdomain öneki gerekli'); return; }
    X3Store.add('subdomains', { prefix: p, domain: X3Store.getAccount().domain, root: '/home/' + X3Store.getAccount().user + '/' + r, redirect: '', status: 'active' });
    this.toast('Subdomain oluşturuldu: ' + p + '.' + X3Store.getAccount().domain);
    document.getElementById('mainContentArea').innerHTML = this.subdomains();
    cPanelApp.updateStats();
  },
  deleteSub(id) { X3Store.remove('subdomains', id); this.toast('Subdomain silindi'); document.getElementById('mainContentArea').innerHTML = this.subdomains(); cPanelApp.updateStats(); },

  addonDomains() {
    const addons = X3Store.list('addonDomains');
    const rows = addons.map(a => `
      <tr>
        <td><strong>${a.domain}</strong></td>
        <td>${a.root}</td>
        <td>${a.redirect ? '→ ' + a.redirect : '—'}</td>
        <td>${a.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-danger">Askıda</span>'}</td>
        <td><button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteAddon(${a.id})">Sil</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Domains', 'Addon Domains')}
      <div class="subpage-container">
        ${this.header('➕ Addon Domains', 'Ana domaininize ek alan adları bağlayın.')}
        <div class="x3-form-box">
          <h3>Create Addon Domain</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Alan Adı:</label>
              <input type="text" id="adDomain" class="x3-input" placeholder="yenisite.com">
            </div>
            <div class="form-group">
              <label>Document Root:</label>
              <input type="text" id="adRoot" class="x3-input" value="/home/${X3Store.getAccount().user}/public_html/yenisite">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addAddon()">+ Add Addon Domain</button>
        </div>
        <h3>Current Addon Domains</h3>
        <table class="x3-data-table">
          <thead><tr><th>Domain</th><th>Document Root</th><th>Redirect</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">Yok.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  addAddon() {
    const d = document.getElementById('adDomain').value.trim();
    if (!d) { this.toast('Alan adı gerekli'); return; }
    X3Store.add('addonDomains', { domain: d, root: '/home/' + X3Store.getAccount().user + '/public_html/' + d.split('.')[0], redirect: '', status: 'active' });
    this.toast('Addon domain eklendi: ' + d);
    document.getElementById('mainContentArea').innerHTML = this.addonDomains();
    cPanelApp.updateStats();
  },
  deleteAddon(id) { X3Store.remove('addonDomains', id); this.toast('Addon domain silindi'); document.getElementById('mainContentArea').innerHTML = this.addonDomains(); cPanelApp.updateStats(); },

  aliases() {
    const aliases = X3Store.list('aliases');
    const rows = aliases.map(a => `
      <tr>
        <td><strong>${a.domain}</strong></td>
        <td>→ ${a.redirect}</td>
        <td>${a.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-danger">Askıda</span>'}</td>
        <td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Alias silindi')">Sil</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Domains', 'Aliases')}
      <div class="subpage-container">
        ${this.header('🔗 Aliases', 'Alan adı takma adları (park edilmiş domainler).')}
        <div class="x3-form-box">
          <h3>Create Alias</h3>
          <div class="form-group">
            <label>Alan Adı:</label>
            <input type="text" id="alDomain" class="x3-input" placeholder="takmaad.com">
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Alias eklendi (simülasyon)')">+ Create Alias</button>
        </div>
        <h3>Current Aliases</h3>
        <table class="x3-data-table">
          <thead><tr><th>Domain</th><th>Redirect</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">Yok.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  redirects() {
    const redirs = X3Store.list('redirects');
    const rows = redirs.map(r => `
      <tr>
        <td>${r.from}</td>
        <td>→ ${r.to}</td>
        <td><span class="badge-info">${r.type}</span></td>
        <td>${r.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-danger">Pasif</span>'}</td>
        <td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Yönlendirme silindi')">Sil</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Domains', 'Redirects')}
      <div class="subpage-container">
        ${this.header('↩️ Redirects', 'URL yönlendirmeleri oluşturun.')}
        <div class="x3-form-box">
          <h3>Add Redirect</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Kaynak URL:</label>
              <input type="text" id="rdFrom" class="x3-input" placeholder="/eski-sayfa">
            </div>
            <div class="form-group">
              <label>Hedef URL:</label>
              <input type="text" id="rdTo" class="x3-input" placeholder="https://${X3Store.getAccount().domain}/yeni-sayfa">
            </div>
            <div class="form-group">
              <label>Tip:</label>
              <select id="rdType" class="x3-input"><option>301 (Kalıcı)</option><option>302 (Geçici)</option></select>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Yönlendirme eklendi')">+ Add Redirect</button>
        </div>
        <h3>Current Redirects</h3>
        <table class="x3-data-table">
          <thead><tr><th>From</th><th>To</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">Yok.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  zoneEditor() {
    const records = X3Store.list('dnsRecords');
    const rows = records.map(r => `
      <tr>
        <td>${r.type}</td>
        <td><strong>${r.name}</strong></td>
        <td>${r.ttl}</td>
        <td><code>${r.value}</code></td>
        <td>${r.priority || '—'}</td>
        <td>
          <button class="btn-x3-sm" onclick="cPanelApp.showToast('Kayıt düzenleniyor')">✏️</button>
          <button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteDns(${r.id})">🗑</button>
        </td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Domains', 'Zone Editor')}
      <div class="subpage-container">
        ${this.header('🌐 Zone Editor', 'DNS kayıtlarını yönetin (' + X3Store.getAccount().domain + ').')}
        <div class="x3-form-box">
          <h3>Add Record</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Tip:</label>
              <select id="dnsType" class="x3-input">
                <option>A</option><option>AAAA</option><option>CNAME</option>
                <option>MX</option><option>TXT</option><option>SRV</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ad:</label>
              <input type="text" id="dnsName" class="x3-input" placeholder="@">
            </div>
            <div class="form-group">
              <label>TTL:</label>
              <input type="text" id="dnsTtl" class="x3-input" value="14400">
            </div>
            <div class="form-group">
              <label>Değer:</label>
              <input type="text" id="dnsValue" class="x3-input" placeholder="185.199.108.153">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addDns()">+ Add Record</button>
        </div>
        <h3>DNS Records</h3>
        <table class="x3-data-table">
          <thead><tr><th>Type</th><th>Name</th><th>TTL</th><th>Value</th><th>Priority</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  addDns() {
    X3Store.add('dnsRecords', {
      type: document.getElementById('dnsType').value,
      name: document.getElementById('dnsName').value || '@',
      ttl: document.getElementById('dnsTtl').value,
      value: document.getElementById('dnsValue').value,
      priority: '',
    });
    this.toast('DNS kaydı eklendi');
    document.getElementById('mainContentArea').innerHTML = this.zoneEditor();
  },
  deleteDns(id) { X3Store.remove('dnsRecords', id); this.toast('DNS kaydı silindi'); document.getElementById('mainContentArea').innerHTML = this.zoneEditor(); },

  dynamicDns() {
    return `
      ${this.renderBreadcrumb('Domains', 'Dynamic DNS')}
      <div class="subpage-container">
        ${this.header('🔄 Dynamic DNS', 'Dinamik IP güncelleme servisi.')}
        <div class="x3-form-box">
          <h3>Dynamic DNS Hesapları</h3>
          <table class="x3-data-table">
            <thead><tr><th>Host</th><th>Token</th><th>Durum</th></tr></thead>
            <tbody>
              <tr><td><code>ev.adamowen.co.uk</code></td><td><code>••••a3f9</code></td><td><span class="badge-active">Aktif</span></td></tr>
            </tbody>
          </table>
          <button class="btn-x3-primary" style="margin-top:15px" onclick="cPanelApp.showToast('Dynamic DNS hesabı oluşturuldu')">+ Create Dynamic DNS</button>
        </div>
      </div>
    `;
  },

  /* ==========================================================
   * SECURITY
   * ========================================================== */

  sshAccess() {
    const a = X3Store.getAccount();
    return `
      ${this.renderBreadcrumb('Security', 'SSH/Terminal Access')}
      <div class="subpage-container">
        ${this.header('🔐 SSH/Terminal Access', 'SSH erişim durumu.')}
        <div class="x3-form-box">
          <h3>SSH Erişimi</h3>
          <p>SSH: <span class="badge-active">Etkin</span></p>
          <p><strong>Host:</strong> ${a.domain} · <strong>Port:</strong> 22</p>
          <p><strong>Kullanıcı:</strong> ${a.user}</p>
          <button class="btn-x3-primary" onclick="cPanelApp.openTool('terminal')">🖥 Terminal Aç</button>
        </div>
      </div>
    `;
  },

  ssl() {
    const ssl = X3Store.get().ssl;
    const rows = ssl.certs.map(c => `
      <tr>
        <td><strong>${c.domain}</strong></td>
        <td>${c.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-danger">Süresi doldu</span>'}</td>
        <td>${c.expires}</td>
        <td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Sertifika yenilendi')">↻ Yenile</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Security', 'SSL/TLS Status')}
      <div class="subpage-container">
        ${this.header('🔒 SSL/TLS Status', 'Sertifika durumları.')}
        <div class="x3-form-box">
          <h3>Genel Durum</h3>
          <p>Otomatik SSL: <span class="badge-active">${ssl.type}</span></p>
          <p>Sağlayıcı: ${ssl.issuer} · Son kullanma: ${ssl.expires}</p>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('AutoSSL taraması başlatıldı')">🔄 AutoSSL Taraması</button>
        </div>
        <h3>Sertifikalar</h3>
        <table class="x3-data-table">
          <thead><tr><th>Domain</th><th>Durum</th><th>Bitiş</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  sslManager() {
    return `
      ${this.renderBreadcrumb('Security', 'SSL/TLS Manager')}
      <div class="subpage-container">
        ${this.header('🛡️ SSL/TLS Manager', 'Özel sertifika yükleme.')}
        <div class="x3-form-box">
          <h3>CSR Oluştur</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Domain:</label>
              <input type="text" class="x3-input" value="${X3Store.getAccount().domain}">
            </div>
            <div class="form-group">
              <label>Ülke (2 harf):</label>
              <input type="text" class="x3-input" value="TR">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('CSR oluşturuldu')">Generate CSR</button>
        </div>
        <div class="x3-form-box">
          <h3>Sertifika Yükle</h3>
          <textarea class="x3-input" rows="4" placeholder="-----BEGIN CERTIFICATE-----"></textarea>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Sertifika yüklendi')">Yükle</button>
        </div>
      </div>
    `;
  },

  sshKeys() {
    return `
      ${this.renderBreadcrumb('Security', 'SSH Keys')}
      <div class="subpage-container">
        ${this.header('🗝️ SSH Keys', 'SSH anahtarlarını yönetin.')}
        <div class="x3-form-box">
          <h3>Generate Key</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Anahtar Adı:</label>
              <input type="text" id="keyName" class="x3-input" value="id_ed25519">
            </div>
            <div class="form-group">
              <label>Tür:</label>
              <select id="keyType" class="x3-input"><option>Ed25519</option><option>RSA 2048</option><option>RSA 4096</option></select>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Anahtar üretildi')">Generate Key</button>
        </div>
        <h3>Mevcut Anahtarlar</h3>
        <table class="x3-data-table">
          <thead><tr><th>Anahtar</th><th>Fingerprint</th><th>İşlem</th></tr></thead>
          <tbody>
            <tr><td><code>id_rsa</code></td><td>SHA256:Ab3d...x9F2</td><td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Anahtar yönetiliyor')">Yönet</button></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  ipBlocker() {
    const blocked = X3Store.list('ipBlocker');
    const rows = blocked.map(b => `
      <tr>
        <td><code>${b.ip}</code></td>
        <td><span class="badge-danger">Engellendi</span></td>
        <td><button class="btn-x3-sm" onclick="cPanelSubPages.unblockIp(${b.id})">Engeli Kaldır</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Security', 'IP Blocker')}
      <div class="subpage-container">
        ${this.header('🚫 IP Blocker', 'IP adreslerini veya aralıklarını engelleyin.')}
        <div class="x3-form-box">
          <h3>Add IP or Range</h3>
          <div class="form-group">
            <label>IP veya Aralık:</label>
            <input type="text" id="ipNew" class="x3-input" placeholder="192.168.1.100 veya 192.168.1.%">
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.blockIp()">+ Add IP</button>
        </div>
        <h3>Blocked IPs</h3>
        <table class="x3-data-table">
          <thead><tr><th>IP</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  blockIp() {
    const ip = document.getElementById('ipNew').value.trim();
    if (!ip) { this.toast('IP gerekli'); return; }
    X3Store.add('ipBlocker', { ip, status: 'blocked' });
    this.toast('IP engellendi: ' + ip);
    document.getElementById('mainContentArea').innerHTML = this.ipBlocker();
  },
  unblockIp(id) { X3Store.remove('ipBlocker', id); this.toast('Engel kaldırıldı'); document.getElementById('mainContentArea').innerHTML = this.ipBlocker(); },

  hotlink() {
    const h = X3Store.get().hotlinkProtected;
    return `
      ${this.renderBreadcrumb('Security', 'Hotlink Protection')}
      <div class="subpage-container">
        ${this.header('🔥 Hotlink Protection', 'Görsellerinizin başka sitelerde kullanılmasını engelleyin.')}
        <div class="x3-form-box">
          <h3>Durum: ${h.enabled ? '<span class="badge-active">Etkin</span>' : '<span class="badge-warn">Pasif</span>'}</h3>
          <p><strong>İzinli URL'ler:</strong></p>
          <ul>
            ${h.urls.map(u => `<li><code>${u}</code></li>`).join('')}
          </ul>
          <p><strong>Korunan uzantılar:</strong> ${h.extensions.map(e => e).join(', ')}</p>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Hotlink koruması güncellendi')">Kaydet</button>
          <button class="btn-x3 danger" onclick="cPanelApp.showToast('Koruma kapatıldı')">Kapat</button>
        </div>
      </div>
    `;
  },

  leech() {
    return `
      ${this.renderBreadcrumb('Security', 'Leech Protection')}
      <div class="subpage-container">
        ${this.header('🦠 Leech Protection', 'Parola korumalı dizinlerdeki sızıntıları engelleyin.')}
        <div class="x3-form-box">
          <h3>Korumalı Dizin Seçin</h3>
          <select class="x3-input" style="max-width:400px">
            <option>/home/${X3Store.getAccount().user}/public_html/admin</option>
          </select>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Leech koruması etkinleştirildi')">Etkinleştir</button>
        </div>
        <div class="x3-form-box">
          <h3>Bilgi</h3>
          <p>Leech Protection, bir dizine sınırsız giriş denemesi yapan kullanıcıları otomatik engeller.</p>
        </div>
      </div>
    `;
  },

  modSecurity() {
    const m = X3Store.get().modSecurity;
    return `
      ${this.renderBreadcrumb('Security', 'ModSecurity')}
      <div class="subpage-container">
        ${this.header('🛡️ ModSecurity', 'Web uygulama güvenlik duvarı (WAF).')}
        <div class="x3-form-box">
          <h3>ModSecurity: ${m.enabled ? '<span class="badge-active">Etkin</span>' : '<span class="badge-warn">Pasif</span>'}</h3>
          <p>Yüklü kural sayısı: <strong>${m.rules.toLocaleString()}</strong></p>
          <div class="form-grid">
            <div class="form-group">
              <label>Kural Seti:</label>
              <select class="x3-input">
                <option>OWASP CRS 3.3</option>
                <option>Kurumsal Kural Seti</option>
              </select>
            </div>
            <div class="form-group">
              <label>Günlük Modu:</label>
              <select class="x3-input">
                <option>Engelleme (On)</option>
                <option>Yalnızca Günlük (Detection)</option>
              </select>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('ModSecurity ayarları kaydedildi')">Kaydet</button>
        </div>
      </div>
    `;
  },

  twoFactor() {
    const a = X3Store.getAccount();
    return `
      ${this.renderBreadcrumb('Security', '2-Factor Authentication')}
      <div class="subpage-container">
        ${this.header('📱 2-Factor Authentication', 'Hesap güvenliğini iki adımlı doğrulamayla artırın.')}
        <div class="x3-form-box">
          <h3>Durum: ${a.twoFactor ? '<span class="badge-active">Etkin</span>' : '<span class="badge-warn">Pasif</span>'}</h3>
          <p>TOTP zaman tabanlı tek kullanımlık şifreler kullanılır (Google Authenticator, Authy, 1Password uyumlu).</p>
          <button class="btn-x3-primary" onclick="cPanelSubPages.enable2fa()">📱 İki Adımlı Doğrulamayı Başlat</button>
          <div id="tfaResult"></div>
        </div>
      </div>
    `;
  },

  enable2fa() {
    const res = document.getElementById('tfaResult');
    if (!res) { this.toast('2FA başlatıldı'); return; }
    res.innerHTML = `
      <div style="margin-top:15px">
        <p>QR kodu (simülasyon):</p>
        <div class="qr-sim">🔳🔳⬜🔳<br>⬜🔳🔳⬜<br>🔳⬜🔳🔳<br>⬜🔳⬜🔳</div>
        <p>Kod: <code>OCPP-XXXX-YYYY</code></p>
        <button class="btn-x3-primary" onclick="cPanelApp.showToast('2FA etkinleştirildi ✅')">Doğrula ve Etkinleştir</button>
      </div>
    `;
    X3Store.saveAccount({ twoFactor: true });
  },

  passwordProtection() {
    return `
      ${this.renderBreadcrumb('Security', 'Password Protection')}
      <div class="subpage-container">
        ${this.header('🔑 Password Protection', 'Dizinleri parola ile koruyun.')}
        <div class="x3-form-box">
          <h3>Dizin Koru</h3>
          <div class="form-group">
            <label>Dizin:</label>
            <input type="text" class="x3-input" value="/home/${X3Store.getAccount().user}/public_html/private">
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Dizin korumaya alındı')">🔒 Koru</button>
        </div>
        <h3>Korumalı Dizinler</h3>
        <table class="x3-data-table">
          <thead><tr><th>Dizin</th><th>Kullanıcı</th><th>Durum</th></tr></thead>
          <tbody>
            <tr><td>/public_html/admin</td><td>admin_user</td><td><span class="badge-active">Korumalı</span></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  /* ==========================================================
   * SOFTWARE
   * ========================================================== */

  selectPhp() {
    const versions = ['8.2.7', '8.1.20', '8.0.30', '7.4.33'];
    const a = X3Store.get().phpVersion;
    const btns = versions.map(v => `
      <div class="php-version-card ${v === a ? 'selected' : ''}" onclick="cPanelSubPages.setPhp('${v}')">
        <strong>PHP ${v}</strong>
        <span>${v === a ? '✓ Aktif' : 'Kullanılabilir'}</span>
      </div>
    `).join('');
    return `
      ${this.renderBreadcrumb('Software', 'Select PHP Version')}
      <div class="subpage-container">
        ${this.header('🐘 Select PHP Version', 'Hesabınız için PHP sürümünü seçin.')}
        <div class="php-grid">${btns}</div>
        <div class="x3-form-box">
          <h3>Aktif Sürüm: PHP ${a}</h3>
          <p>Bu sürüm tüm alan adlarınız için geçerlidir.</p>
        </div>
      </div>
    `;
  },

  setPhp(v) {
    const d = X3Store.load();
    d.phpVersion = v;
    X3Store.save(d);
    this.toast('PHP sürümü değiştirildi: ' + v);
    document.getElementById('mainContentArea').innerHTML = this.selectPhp();
  },

  multiPhp() {
    return `
      ${this.renderBreadcrumb('Software', 'MultiPHP Manager')}
      <div class="subpage-container">
        ${this.header('🧩 MultiPHP Manager', 'Her alan adı için PHP sürümü atayın.')}
        <table class="x3-data-table">
          <thead><tr><th>Domain</th><th>PHP Sürümü</th><th>İşlem</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>${X3Store.getAccount().domain}</strong></td>
              <td><select class="x3-input" onchange="cPanelApp.showToast('Sürüm değiştirildi: ' + this.value)">
                <option>PHP 8.2</option><option selected>PHP 8.1</option><option>PHP 8.0</option><option>PHP 7.4</option>
              </select></td>
              <td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Uygulandı')">Uygula</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  phpIni() {
    const s = X3Store.get().phpSettings;
    return `
      ${this.renderBreadcrumb('Software', 'MultiPHP INI Editor')}
      <div class="subpage-container">
        ${this.header('⚙️ MultiPHP INI Editor', 'PHP yapılandırma ayarları.')}
        <div class="x3-form-box">
          <h3>PHP Ayarları</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>memory_limit:</label>
              <input type="text" id="iniMem" class="x3-input" value="${s.memory_limit}">
            </div>
            <div class="form-group">
              <label>max_execution_time:</label>
              <input type="text" id="iniExec" class="x3-input" value="${s.max_execution_time}">
            </div>
            <div class="form-group">
              <label>upload_max_filesize:</label>
              <input type="text" id="iniUpload" class="x3-input" value="${s.upload_max_filesize}">
            </div>
            <div class="form-group">
              <label>post_max_size:</label>
              <input type="text" id="iniPost" class="x3-input" value="${s.post_max_size}">
            </div>
            <div class="form-group">
              <label>max_input_vars:</label>
              <input type="text" id="iniVars" class="x3-input" value="${s.max_input_vars}">
            </div>
            <div class="form-group">
              <label>date.timezone:</label>
              <input type="text" id="iniTz" class="x3-input" value="${s.date_timezone}">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.savePhpIni()">Kaydet</button>
          <div id="iniResult"></div>
        </div>
      </div>
    `;
  },

  savePhpIni() {
    const d = X3Store.load();
    d.phpSettings = {
      memory_limit: document.getElementById('iniMem').value,
      max_execution_time: document.getElementById('iniExec').value,
      upload_max_filesize: document.getElementById('iniUpload').value,
      post_max_size: document.getElementById('iniPost').value,
      max_input_vars: document.getElementById('iniVars').value,
      date_timezone: document.getElementById('iniTz').value,
    };
    X3Store.save(d);
    document.getElementById('iniResult').innerHTML = '<p class="success-msg">✅ PHP ayarları kaydedildi.</p>';
    this.toast('PHP INI güncellendi');
  },

  pear() {
    return `
      ${this.renderBreadcrumb('Software', 'PHP PEAR Packages')}
      <div class="subpage-container">
        ${this.header('📦 PHP PEAR Packages', 'PEAR paketlerini yönetin.')}
        <div class="x3-form-box">
          <h3>Install Package</h3>
          <div class="form-group">
            <label>Paket Adı:</label>
            <input type="text" id="pearPkg" class="x3-input" placeholder="Mail_Mime">
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('PEAR paketi yüklendi (simülasyon)')">Install</button>
        </div>
        <h3>Kurulu Paketler</h3>
        <table class="x3-data-table">
          <thead><tr><th>Paket</th><th>Sürüm</th><th>İşlem</th></tr></thead>
          <tbody>
            <tr><td>Archive_Tar</td><td>1.4.14</td><td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Kaldırıldı')">Kaldır</button></td></tr>
            <tr><td>Mail</td><td>1.4.1</td><td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Kaldırıldı')">Kaldır</button></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  rubyGems() {
    return `
      ${this.renderBreadcrumb('Software', 'RubyGems')}
      <div class="subpage-container">
        ${this.header('💎 RubyGems', 'Ruby gem paketlerini yönetin.')}
        <div class="x3-form-box">
          <h3>Install Gem</h3>
          <div class="form-group">
            <label>Gem Adı:</label>
            <input type="text" class="x3-input" placeholder="rails">
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Gem yüklendi (simülasyon)')">Install</button>
        </div>
        <p style="margin-top:15px"><span class="badge-info">Ruby sürümü: 3.1.2</span> <span class="badge-info">Gem: 3.4.6</span></p>
      </div>
    `;
  },

  nodejs() {
    const apps = [
      { name: 'myapp', version: '20.11.0', root: '/home/' + X3Store.getAccount().user + '/myapp', status: 'running' },
    ];
    const rows = apps.map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td>Node ${a.version}</td>
        <td>${a.root}</td>
        <td><span class="badge-active">Çalışıyor</span></td>
        <td><button class="btn-x3-sm" onclick="cPanelApp.showToast('Uygulama yeniden başlatıldı')">↻ Restart</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Software', 'Node.js Selector')}
      <div class="subpage-container">
        ${this.header('🟢 Node.js Selector', 'Node.js uygulamalarınızı yönetin.')}
        <div class="x3-form-box">
          <h3>Create Application</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Uygulama Adı:</label>
              <input type="text" class="x3-input" placeholder="myapp">
            </div>
            <div class="form-group">
              <label>Node.js Sürümü:</label>
              <select class="x3-input"><option>20.11.0 LTS</option><option>18.19.0 LTS</option><option>21.6.1</option></select>
            </div>
            <div class="form-group">
              <label>Uygulama Kökü:</label>
              <input type="text" class="x3-input" value="/home/${X3Store.getAccount().user}/myapp">
            </div>
            <div class="form-group">
              <label>Başlatma Dosyası:</label>
              <input type="text" class="x3-input" value="app.js">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Node.js uygulaması oluşturuldu')">+ Create</button>
        </div>
        <h3>Applications</h3>
        <table class="x3-data-table">
          <thead><tr><th>Uygulama</th><th>Sürüm</th><th>Kök</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  python() {
    return `
      ${this.renderBreadcrumb('Software', 'Python Selector')}
      <div class="subpage-container">
        ${this.header('🐍 Python Selector', 'Python uygulamalarınızı yönetin.')}
        <div class="x3-form-box">
          <h3>Create Application</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Uygulama Adı:</label>
              <input type="text" class="x3-input" placeholder="flaskapp">
            </div>
            <div class="form-group">
              <label>Python Sürümü:</label>
              <select class="x3-input"><option>3.11.7</option><option>3.10.13</option><option>3.9.18</option></select>
            </div>
            <div class="form-group">
              <label>Framework:</label>
              <select class="x3-input"><option>Flask</option><option>Django</option><option>Yok</option></select>
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Python uygulaması oluşturuldu')">+ Create</button>
        </div>
        <table class="x3-data-table">
          <thead><tr><th>Uygulama</th><th>Sürüm</th><th>Durum</th></tr></thead>
          <tbody><tr><td colspan="3">Python uygulaması yok.</td></tr></tbody>
        </table>
      </div>
    `;
  },

  appManager() {
    return `
      ${this.renderBreadcrumb('Software', 'Application Manager')}
      <div class="subpage-container">
        ${this.header('📱 Application Manager', 'WordPress ve diğer uygulamaları yönetin.')}
        <div class="x3-form-box">
          <h3>Install Application</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Uygulama:</label>
              <select class="x3-input">
                <option>WordPress</option><option>Joomla!</option><option>Drupal</option>
                <option>Laravel</option><option>Next.js</option>
              </select>
            </div>
            <div class="form-group">
              <label>Dizin:</label>
              <input type="text" class="x3-input" value="/home/${X3Store.getAccount().user}/public_html">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Uygulama kurulumu başlatıldı')">+ Install</button>
        </div>
        <table class="x3-data-table">
          <thead><tr><th>Uygulama</th><th>Dizin</th><th>Sürüm</th><th>Durum</th></tr></thead>
          <tbody>
            <tr><td>WordPress</td><td>/public_html</td><td>6.5.2</td><td><span class="badge-active">Kurulu</span></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  optimize() {
    return `
      ${this.renderBreadcrumb('Software', 'Optimize Website')}
      <div class="subpage-container">
        ${this.header('🚀 Optimize Website', 'Web sitesi hızlandırma.')}
        <div class="x3-form-box">
          <h3>Optimizasyon Profili</h3>
          <select class="x3-input" style="max-width:400px">
            <option>Varsayılan (Dengeli)</option>
            <option>Maksimum Performans</option>
            <option>Maksimum Uyumluluk</option>
          </select>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Optimizasyon profili uygulandı')">Uygula</button>
        </div>
        <div class="x3-form-box">
          <h3>Öneriler</h3>
          <ul>
            <li>✅ Gzip sıkıştırma etkin</li>
            <li>✅ Tarayıcı önbelleği etkin</li>
            <li>⚠️ Etag yanıt başlıkları kapalı</li>
            <li>⚠️ Görsel optimizasyonu önerilir</li>
          </ul>
        </div>
      </div>
    `;
  },

  /* ==========================================================
   * ADVANCED
   * ========================================================== */

  terminal() {
    return `
      ${this.renderBreadcrumb('Advanced', 'Terminal')}
      <div class="subpage-container">
        ${this.header('🖥️ Terminal', 'Web tabanlı SSH terminali (simülasyon).')}
        <div class="terminal-shell">
          <div class="terminal-bar">📟 ${X3Store.getAccount().user}@ocp-panel: ~</div>
          <div class="terminal-body" id="termBody">
            <p>OCP Panel Terminal — simülasyon modu</p>
            <p>Kullanılabilir komutlar: <code>help</code>, <code>ls</code>, <code>pwd</code>, <code>whoami</code>, <code>clear</code></p>
            <p class="term-line"><span class="term-prompt">[${X3Store.getAccount().user}@ocp-panel ~]$</span> <span id="termInput"></span></p>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:10px">
          <input type="text" id="termCmd" class="x3-input" placeholder="komut girin..." onkeydown="if(event.key==='Enter')cPanelSubPages.termExec()" style="flex:1">
          <button class="btn-x3-primary" onclick="cPanelSubPages.termExec()">▶ Çalıştır</button>
        </div>
      </div>
    `;
  },

  termExec() {
    const cmd = document.getElementById('termCmd').value.trim();
    const body = document.getElementById('termBody');
    const user = X3Store.getAccount().user;
    const responses = {
      'help': 'Kullanılabilir: help, ls, pwd, whoami, clear, date, uptime',
      'ls': 'public_html  mail  logs  .trash  .bashrc  backup_2024.tar.gz',
      'pwd': '/home/' + user,
      'whoami': user,
      'date': new Date().toString(),
      'uptime': 'up 34 days, 6:42,  3 users,  load average: 0.08, 0.12, 0.09',
      'clear': '__CLEAR__',
    };
    if (cmd === '') return;
    const out = responses[cmd] !== undefined ? responses[cmd] : `bash: ${cmd}: komut bulunamadı (simülasyon)`;
    if (out === '__CLEAR__') {
      body.innerHTML = '';
    } else {
      const line = document.createElement('p');
      line.className = 'term-line';
      line.innerHTML = `<span class="term-prompt">[${user}@ocp-panel ~]$</span> ${cmd}`;
      body.appendChild(line);
      const res = document.createElement('p');
      res.textContent = out;
      body.appendChild(res);
    }
    document.getElementById('termCmd').value = '';
    body.scrollTop = body.scrollHeight;
  },

  cronJobs() {
    const crons = X3Store.list('cronJobs');
    const rows = crons.map(c => `
      <tr>
        <td><code>${c.minute} ${c.hour} ${c.day} ${c.month} ${c.weekday}</code></td>
        <td><code>${c.cmd}</code></td>
        <td>${c.status === 'active' ? '<span class="badge-active">Aktif</span>' : '<span class="badge-warn">Pasif</span>'}</td>
        <td><button class="btn-x3-sm danger" onclick="cPanelSubPages.deleteCron(${c.id})">Sil</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Advanced', 'Cron Jobs')}
      <div class="subpage-container">
        ${this.header('⏰ Cron Jobs', 'Zamanlanmış görevler.')}
        <div class="x3-form-box">
          <h3>Add New Cron Job</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Komut:</label>
              <input type="text" id="cronCmd" class="x3-input" placeholder="/usr/bin/php /home/${X3Store.getAccount().user}/public_html/cron.php" style="min-width:320px">
            </div>
            <div class="form-group">
              <label>Dakika:</label>
              <input type="text" id="cronMin" class="x3-input" value="0">
            </div>
            <div class="form-group">
              <label>Saat:</label>
              <input type="text" id="cronHour" class="x3-input" value="3">
            </div>
            <div class="form-group">
              <label>Gün (ay):</label>
              <input type="text" id="cronDay" class="x3-input" value="*">
            </div>
            <div class="form-group">
              <label>Ay:</label>
              <input type="text" id="cronMonth" class="x3-input" value="*">
            </div>
            <div class="form-group">
              <label>Haftanın Günü:</label>
              <input type="text" id="cronWeekday" class="x3-input" value="*">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelSubPages.addCron()">+ Add Cron Job</button>
        </div>
        <h3>Current Cron Jobs</h3>
        <table class="x3-data-table">
          <thead><tr><th>Zamanlama</th><th>Komut</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  addCron() {
    const cmd = document.getElementById('cronCmd').value.trim();
    if (!cmd) { this.toast('Komut gerekli'); return; }
    X3Store.add('cronJobs', {
      minute: document.getElementById('cronMin').value,
      hour: document.getElementById('cronHour').value,
      day: document.getElementById('cronDay').value,
      month: document.getElementById('cronMonth').value,
      weekday: document.getElementById('cronWeekday').value,
      cmd, status: 'active',
    });
    this.toast('Cron job eklendi');
    document.getElementById('mainContentArea').innerHTML = this.cronJobs();
  },
  deleteCron(id) { X3Store.remove('cronJobs', id); this.toast('Cron job silindi'); document.getElementById('mainContentArea').innerHTML = this.cronJobs(); },

  errorPages() {
    const pages = [
      { code: '400 Bad Request', file: '400.shtml' },
      { code: '401 Unauthorized', file: '401.shtml' },
      { code: '403 Forbidden', file: '403.shtml' },
      { code: '404 Not Found', file: '404.shtml' },
      { code: '500 Internal Server Error', file: '500.shtml' },
    ];
    const rows = pages.map(p => `
      <tr>
        <td><strong>${p.code}</strong></td>
        <td>${p.file}</td>
        <td><button class="btn-x3-sm" onclick="cPanelApp.showToast('${p.code} sayfası düzenleniyor')">✏️ Düzenle</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Advanced', 'Error Pages')}
      <div class="subpage-container">
        ${this.header('⚠️ Error Pages', 'Özel hata sayfalarını yapılandırın.')}
        <table class="x3-data-table">
          <thead><tr><th>Hata</th><th>Dosya</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  mimeTypes() {
    return `
      ${this.renderBreadcrumb('Advanced', 'MIME Types')}
      <div class="subpage-container">
        ${this.header('🧬 MIME Types', 'MIME türü eşleştirmelerini yönetin.')}
        <div class="x3-form-box">
          <h3>Add MIME Type</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>MIME Türü:</label>
              <input type="text" class="x3-input" placeholder="application/json">
            </div>
            <div class="form-group">
              <label>Uzantı:</label>
              <input type="text" class="x3-input" placeholder=".json">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('MIME türü eklendi')">+ Add</button>
        </div>
        <h3>Özel MIME Türleri</h3>
        <table class="x3-data-table">
          <thead><tr><th>MIME</th><th>Uzantı</th><th>İşlem</th></tr></thead>
          <tbody>
            <tr><td>application/x-httpd-php</td><td>.php</td><td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Silindi')">Sil</button></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  apacheHandlers() {
    return `
      ${this.renderBreadcrumb('Advanced', 'Apache Handlers')}
      <div class="subpage-container">
        ${this.header('⚙️ Apache Handlers', 'Apache işleyici eşleştirmeleri.')}
        <div class="x3-form-box">
          <h3>Add Handler</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Handler:</label>
              <input type="text" class="x3-input" placeholder="cgi-script">
            </div>
            <div class="form-group">
              <label>Uzantı(lar):</label>
              <input type="text" class="x3-input" placeholder=".cgi .pl">
            </div>
          </div>
          <button class="btn-x3-primary" onclick="cPanelApp.showToast('Handler eklendi')">+ Add</button>
        </div>
        <table class="x3-data-table">
          <thead><tr><th>Handler</th><th>Uzantı</th><th>İşlem</th></tr></thead>
          <tbody>
            <tr><td>cgi-script</td><td>.cgi .pl</td><td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Silindi')">Sil</button></td></tr>
            <tr><td>server-parsed</td><td>.shtml</td><td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('Silindi')">Sil</button></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  processManager() {
    const procs = X3Store.list('processes');
    const rows = procs.map(p => `
      <tr>
        <td>${p.pid}</td>
        <td>${p.user}</td>
        <td>${p.cpu}</td>
        <td>${p.mem}</td>
        <td><code>${p.cmd}</code></td>
        <td><button class="btn-x3-sm danger" onclick="cPanelApp.showToast('İşlem sonlandırıldı (PID ' + ${p.pid} + ')')">Sonlandır</button></td>
      </tr>
    `).join('');
    return `
      ${this.renderBreadcrumb('Advanced', 'Process Manager')}
      <div class="subpage-container">
        ${this.header('⚙️ Process Manager', 'Çalışan işlemler.')}
        <table class="x3-data-table">
          <thead><tr><th>PID</th><th>Kullanıcı</th><th>CPU</th><th>Bellek</th><th>Komut</th><th>İşlem</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },
};
