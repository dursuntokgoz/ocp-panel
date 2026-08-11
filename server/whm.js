/* ============================================================
 * OCP Panel — WHM Modülü: Domain / Reseller / Paket Yönetimi
 * Gerçek entegrasyon: nginx vhost + /etc/hosts + sistem kullanıcıları
 * Veri deposu: ~/.config/ocp-panel/data.json
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = ({ run, sudo, auth }) => {
  const router = require('express').Router();
  const DATA_FILE = path.join(os.homedir(), '.config', 'ocp-panel', 'data.json');
  const NGINX_AVAIL = '/etc/nginx/sites-available';
  const NGINX_ENABLED = '/etc/nginx/sites-enabled';

  /* ---------- veri deposu ---------- */
  function loadDB() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (e) { return { packages: [], resellers: [], domains: [] }; }
  }

  function saveDB(db) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }

  const NAME_RE = /^[a-z0-9][a-z0-9-]{0,61}$/i;
  const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

  function getPackage(db, name) {
    return db.packages.find(p => p.name.toLowerCase() === String(name).toLowerCase());
  }

  /* ---------- nginx yardımcıları ---------- */
  function vhostFile(domain) { return path.join(NGINX_AVAIL, domain + '.conf'); }

  function vhostExists(domain) {
    return fs.existsSync(vhostFile(domain)) || fs.existsSync(path.join(NGINX_ENABLED, domain + '.conf'));
  }

  function phpFpmSock() {
    // kurulu php-fpm sürümünü bul
    try {
      const out = run(`ls /run/php/php*-fpm.sock 2>/dev/null | head -1`).output.trim();
      return out || null;
    } catch (e) { return null; }
  }

  function writeVhost(domain, root, php) {
    const sock = phpFpmSock();
    const phpBlock = sock ? `
    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${sock};
    }` : '';
    const conf = `# OCP Panel — otomatik oluşturuldu: ${domain}
server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};

    root ${root};
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }${phpBlock}

    location ~ /\\. {
        deny all;
    }

    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;
}
`;
    // geçici dosyaya yaz, sudo ile taşı (nginx dizinleri root'a ait)
    const tmp = '/tmp/ocp-vhost-' + domain + '.conf';
    fs.writeFileSync(tmp, conf);
    sudo(`sh -c 'cp ${tmp} ${vhostFile(domain)} && ln -sf ${vhostFile(domain)} ${path.join(NGINX_ENABLED, domain + '.conf')} && rm -f ${tmp}'`, 10000);
  }

  function removeVhost(domain) {
    sudo(`rm -f ${path.join(NGINX_ENABLED, domain + '.conf')} ${vhostFile(domain)}`, 10000);
  }

  function reloadNginx() {
    const t = sudo(`nginx -t`, 10000);
    if (!t.ok) return t;
    return sudo(`systemctl reload nginx`, 15000);
  }

  /* ---------- /etc/hosts ---------- */
  function hostsAdd(domain) {
    const check = run(`grep -q " ${domain}$" /etc/hosts`);
    if (check.ok) return { ok: true };
    return sudo(`sh -c 'echo "127.0.0.1 ${domain}" >> /etc/hosts'`);
  }

  function hostsRemove(domain) {
    return sudo(`sed -i "/ ${domain}$/d" /etc/hosts`);
  }

  /* ---------- disk kullanımı ---------- */
  function dirSize(p) {
    try {
      const r = run(`du -sb "${p}" 2>/dev/null | cut -f1`);
      return parseInt(r.output.trim()) || 0;
    } catch (e) { return 0; }
  }

  /* ==========================================================
   * PAKETLER (hosting paketleri)
   * ========================================================== */
  router.get('/packages', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, packages: db.packages });
  });

  router.post('/packages', auth, (req, res) => {
    const b = req.body || {};
    if (!b.name || !NAME_RE.test(b.name)) return res.status(400).json({ error: 'Geçersiz paket adı' });
    const db = loadDB();
    if (getPackage(db, b.name)) return res.status(400).json({ error: 'Bu paket adı zaten var' });
    const pkg = {
      name: b.name,
      diskGB: Math.max(0, +b.diskGB || 0),
      domains: Math.max(0, +b.domains || 0),
      emails: Math.max(0, +b.emails || 0),
      bandwidthGB: Math.max(0, +b.bandwidthGB || 0),
      subdomains: Math.max(0, +b.subdomains || 0),
      price: +b.price || 0,
      created: new Date().toISOString()
    };
    db.packages.push(pkg);
    saveDB(db);
    res.json({ ok: true, package: pkg });
  });

  router.put('/packages/:name', auth, (req, res) => {
    const db = loadDB();
    const pkg = getPackage(db, req.params.name);
    if (!pkg) return res.status(404).json({ error: 'Paket bulunamadı' });
    const b = req.body || {};
    if (b.diskGB != null) pkg.diskGB = Math.max(0, +b.diskGB || 0);
    if (b.domains != null) pkg.domains = Math.max(0, +b.domains || 0);
    if (b.emails != null) pkg.emails = Math.max(0, +b.emails || 0);
    if (b.bandwidthGB != null) pkg.bandwidthGB = Math.max(0, +b.bandwidthGB || 0);
    if (b.subdomains != null) pkg.subdomains = Math.max(0, +b.subdomains || 0);
    if (b.price != null) pkg.price = +b.price || 0;
    saveDB(db);
    res.json({ ok: true, package: pkg });
  });

  router.delete('/packages/:name', auth, (req, res) => {
    const db = loadDB();
    const idx = db.packages.findIndex(p => p.name.toLowerCase() === req.params.name.toLowerCase());
    if (idx === -1) return res.status(404).json({ error: 'Paket bulunamadı' });
    const inUse = db.resellers.some(r => r.package === db.packages[idx].name);
    if (inUse) return res.status(400).json({ error: 'Paket bir reseller tarafından kullanılıyor — önce atamayı değiştirin' });
    db.packages.splice(idx, 1);
    saveDB(db);
    res.json({ ok: true });
  });

  /* ==========================================================
   * RESELLER'LAR (sistem kullanıcıları)
   * ========================================================== */
  router.get('/resellers', auth, (req, res) => {
    const db = loadDB();
    // sistem kullanıcıları ile senkron
    const sysUsers = run(`getent passwd | awk -F: '$3>=1000 && $3<65534 {print $1}'`).output.trim().split('\n').filter(Boolean);
    const list = db.resellers.map(r => {
      const exists = sysUsers.includes(r.username);
      const size = dirSize('/home/' + r.username);
      const pkg = getPackage(db, r.package);
      return {
        ...r,
        exists,
        diskUsed: size,
        diskUsedH: fmtBytes(size),
        packageInfo: pkg || null,
        domainCount: db.domains.filter(d => d.reseller === r.username).length
      };
    });
    res.json({ ok: true, resellers: list });
  });

  router.post('/resellers', auth, (req, res) => {
    const b = req.body || {};
    if (!b.username || !NAME_RE.test(b.username)) return res.status(400).json({ error: 'Geçersiz kullanıcı adı (küçük harf, rakam, tire)' });
    if (!b.password || b.password.length < 6) return res.status(400).json({ error: 'Parola en az 6 karakter olmalı' });
    const db = loadDB();
    if (db.resellers.some(r => r.username === b.username)) return res.status(400).json({ error: 'Bu reseller zaten var' });
    if (!getPackage(db, b.package)) return res.status(400).json({ error: 'Geçersiz paket: ' + b.package });

    const uname = b.username.toLowerCase();
    // sistem kullanıcısı oluştur
    const r1 = sudo(`useradd -m -s /bin/bash -d /home/${uname} ${uname}`, 15000);
    if (!r1.ok) return res.status(500).json({ error: 'Kullanıcı oluşturulamadı: ' + r1.output.trim() });
    // parola + web dizini
    sudo(`echo "${uname}:${b.password}" | chpasswd`, 15000);
    sudo(`mkdir -p /home/${uname}/public_html && echo "<h1>${uname} — Hoş Geldiniz</h1>" > /home/${uname}/public_html/index.html && chown -R ${uname}:${uname} /home/${uname}/public_html`, 15000);

    const reseller = {
      username: uname,
      package: b.package,
      email: b.email || '',
      created: new Date().toISOString()
    };
    db.resellers.push(reseller);
    saveDB(db);
    res.json({ ok: true, reseller });
  });

  router.put('/resellers/:name', auth, (req, res) => {
    const db = loadDB();
    const r = db.resellers.find(x => x.username === req.params.name.toLowerCase());
    if (!r) return res.status(404).json({ error: 'Reseller bulunamadı' });
    const b = req.body || {};
    if (b.package) {
      if (!getPackage(db, b.package)) return res.status(400).json({ error: 'Geçersiz paket' });
      r.package = b.package;
    }
    if (b.email != null) r.email = b.email;
    if (b.password) sudo(`echo "${r.username}:${b.password}" | chpasswd`, 15000);
    saveDB(db);
    res.json({ ok: true, reseller: r });
  });

  router.delete('/resellers/:name', auth, (req, res) => {
    const uname = req.params.name.toLowerCase();
    const db = loadDB();
    const idx = db.resellers.findIndex(x => x.username === uname);
    if (idx === -1) return res.status(404).json({ error: 'Reseller bulunamadı' });
    // domain'lerini de sil
    const domains = db.domains.filter(d => d.reseller === uname);
    domains.forEach(d => { removeVhost(d.name); hostsRemove(d.name); });
    db.domains = db.domains.filter(d => d.reseller !== uname);
    // sistem kullanıcısını sil
    sudo(`userdel -r ${uname} 2>/dev/null || true`, 20000);
    db.resellers.splice(idx, 1);
    saveDB(db);
    reloadNginx();
    res.json({ ok: true, removedDomains: domains.length });
  });

  /* ==========================================================
   * DOMAIN'LER
   * ========================================================== */
  router.get('/domains', auth, (req, res) => {
    const db = loadDB();
    const list = db.domains.map(d => {
      const pkg = getPackage(db, (db.resellers.find(r => r.username === d.reseller) || {}).package);
      return {
        ...d,
        vhost: vhostExists(d.name),
        diskUsed: dirSize(d.root),
        diskUsedH: fmtBytes(dirSize(d.root)),
        packageInfo: pkg || null
      };
    });
    res.json({ ok: true, domains: list });
  });

  router.post('/domains', auth, (req, res) => {
    const b = req.body || {};
    const name = String(b.name || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!DOMAIN_RE.test(name)) return res.status(400).json({ error: 'Geçersiz domain adı (örn: ornek.com)' });
    const db = loadDB();
    if (db.domains.some(d => d.name === name)) return res.status(400).json({ error: 'Bu domain zaten kayıtlı' });

    // reseller + paket kotası kontrolü
    const reseller = db.resellers.find(r => r.username === b.reseller);
    if (b.reseller && !reseller) return res.status(400).json({ error: 'Reseller bulunamadı: ' + b.reseller });
    const pkg = reseller ? getPackage(db, reseller.package) : null;
    if (pkg && pkg.domains > 0) {
      const count = db.domains.filter(d => d.reseller === reseller.username).length;
      if (count >= pkg.domains) return res.status(400).json({ error: `Paket limiti aşıldı: ${pkg.name} paketi en fazla ${pkg.domains} domain içerir` });
    }

    // kök dizin (sudo — kullanıcı dizinleri ve /var/www root'a ait olabilir)
    let root = b.root || (reseller ? `/home/${reseller.username}/public_html` : '/var/www/' + name);
    root = root.replace(/\/+$/, '');
    sudo(`sh -c 'mkdir -p ${root} && [ -f ${root}/index.html ] || printf "<h1>${name}</h1><p>OCP Panel tarafından oluşturuldu.</p>" > ${root}/index.html'`, 10000);
    if (reseller) sudo(`chown -R ${reseller.username}:${reseller.username} ${root}`, 10000);

    // vhost + hosts
    writeVhost(name, root, b.php || null);
    hostsAdd(name);
    const rl = reloadNginx();

    const domain = {
      name,
      reseller: reseller ? reseller.username : '',
      root,
      php: b.php || null,
      ssl: !!b.ssl,
      created: new Date().toISOString()
    };
    db.domains.push(domain);
    saveDB(db);
    res.json({ ok: true, domain, nginx: rl.ok ? 'reloaded' : rl.output.trim() });
  });

  router.put('/domains/:name', auth, (req, res) => {
    const db = loadDB();
    const d = db.domains.find(x => x.name === req.params.name.toLowerCase());
    if (!d) return res.status(404).json({ error: 'Domain bulunamadı' });
    const b = req.body || {};
    if (b.root) {
      d.root = b.root.replace(/\/+$/, '');
      sudo(`mkdir -p ${d.root}`, 10000);
    }
    if (b.php !== undefined) d.php = b.php || null;
    if (b.ssl !== undefined) d.ssl = !!b.ssl;
    if (b.reseller !== undefined) {
      const r = db.resellers.find(x => x.username === b.reseller);
      if (b.reseller && !r) return res.status(400).json({ error: 'Reseller bulunamadı' });
      d.reseller = b.reseller || '';
    }
    writeVhost(d.name, d.root, d.php);
    reloadNginx();
    saveDB(db);
    res.json({ ok: true, domain: d });
  });

  router.delete('/domains/:name', auth, (req, res) => {
    const name = req.params.name.toLowerCase();
    const db = loadDB();
    const idx = db.domains.findIndex(d => d.name === name);
    if (idx === -1) return res.status(404).json({ error: 'Domain bulunamadı' });
    removeVhost(name);
    hostsRemove(name);
    reloadNginx();
    db.domains.splice(idx, 1);
    saveDB(db);
    res.json({ ok: true });
  });

  /* ---------- yardımcı ---------- */
  function fmtBytes(n) {
    if (n == null || isNaN(n)) return '—';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return n.toFixed(n >= 100 || i === 0 ? 0 : 1) + ' ' + u[i];
  }

  return router;
};
