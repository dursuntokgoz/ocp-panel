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
    syncMailMaps();
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
    syncMailMaps();
    res.json({ ok: true });
  });

  /* ==========================================================
   * DNS FUNCTIONS — gerçek zone yönetimi
   * A kaydı: /etc/hosts · CNAME: nginx vhost · NS: sunucu adı
   * ========================================================== */
  router.get('/dns-zones', auth, (req, res) => {
    const db = loadDB();
    const hostname = os.hostname();
    const ip = (() => { try { return run(`hostname -I`).output.trim().split(' ')[0]; } catch (e) { return '127.0.0.1'; } })();
    const zones = db.domains.map(d => {
      // A kaydı: hosts'tan oku
      let aIp = ip;
      try {
        const h = run(`grep " ${d.name}$" /etc/hosts`).output.trim();
        const m = h.match(/^([\d.]+)\s/);
        if (m) aIp = m[1];
      } catch (e) { /* yoksay */ }
      const serial = Math.floor(new Date(d.created || Date.now()).getTime() / 1000);
      return {
        domain: d.name,
        serial,
        records: [
          { type: 'A', name: d.name, ttl: 14400, value: aIp },
          { type: 'CNAME', name: 'www.' + d.name, ttl: 14400, value: d.name + '.' },
          { type: 'MX', name: d.name, ttl: 14400, value: '10 mail.' + d.name + '.' },
          { type: 'NS', name: d.name, ttl: 86400, value: 'ns1.' + hostname + '.' },
          { type: 'NS', name: d.name, ttl: 86400, value: 'ns2.' + hostname + '.' },
          { type: 'TXT', name: d.name, ttl: 14400, value: 'v=spf1 +a +mx ~all' }
        ]
      };
    });
    res.json({ ok: true, zones, nameserver: 'ns1.' + hostname, ip });
  });

  // A kaydı IP güncelle → /etc/hosts (yoksa ekle, varsa değiştir)
  router.put('/dns-zones/:domain', auth, (req, res) => {
    const name = req.params.domain.toLowerCase();
    const ip = String(req.body.ip || '').trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return res.status(400).json({ error: 'Geçersiz IP adresi' });
    const db = loadDB();
    if (!db.domains.some(d => d.name === name)) return res.status(404).json({ error: 'Zone bulunamadı' });
    // hosts'ta var mı?
    const exists = run(`grep -q " ${name}$" /etc/hosts`);
    let r;
    if (exists.ok) {
      // var: sed ile değiştir
      r = sudo(`sed -i "s/^[0-9.]* ${name}$/${ip} ${name}/" /etc/hosts`, 10000);
    } else {
      // yok: ekle
      r = sudo(`sh -c 'echo "${ip} ${name}" >> /etc/hosts'`, 10000);
    }
    res.json({ ok: r.ok, output: (r.ok ? 'A kaydı güncellendi: ' : 'Hata: ') + name + ' → ' + ip + (r.output ? ' (' + r.output.trim() + ')' : '') });
  });

  /* ==========================================================
   * EMAIL FUNCTIONS — gerçek postfix + dovecot entegrasyonu
   * Hesaplar : /etc/dovecot/ocp-users (passwd-file, {PLAIN})
   * Domainler: /etc/postfix/virtual_domains + virtual_mailbox
   * Maildir  : /var/mail/vhosts/<domain>/<user>/
   * ========================================================== */
  const MAIL_PASSWD = '/etc/dovecot/ocp-users';
  const MAIL_VHOST = '/var/mail/vhosts';
  const PF_VDOMS = '/etc/postfix/virtual_domains';
  const PF_VBOX = '/etc/postfix/virtual_mailbox';
  const EMAIL_RE = /^[a-z0-9][a-z0-9._-]{0,63}@([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

  function readMailAccounts() {
    try {
      const raw = fs.readFileSync(MAIL_PASSWD, 'utf8');
      return raw.split('\n').filter(Boolean).map(line => {
        const p = line.split(':');
        const email = p[0] || '';
        const m = email.match(/^(.+)@(.+)$/);
        if (!m) return null;
        const extra = p.slice(8).join(':') || '';
        const q = extra.match(/storage=(\d+)M/);
        return {
          email,
          user: m[1],
          domain: m[2],
          quotaMB: q ? +q[1] : 0,
          home: `${MAIL_VHOST}/${m[2]}/${m[1]}`
        };
      }).filter(Boolean);
    } catch (e) { return []; }
  }

  // mevcut hash'leri koruyarak passwd-file'ı tamamen yeniden yazar
  function writeMailPasswd(accounts, passwords) {
    const cur = {};
    try {
      fs.readFileSync(MAIL_PASSWD, 'utf8').split('\n').filter(Boolean).forEach(l => {
        const p = l.split(':');
        if (p[0]) cur[p[0]] = p[1];
      });
    } catch (e) { /* yoksay */ }
    const lines = accounts.map(a => {
      const hash = (passwords && passwords[a.email]) ? '{PLAIN}' + passwords[a.email] : (cur[a.email] || '{PLAIN}Degistir123!');
      return `${a.email}:${hash}:5000:5000::${a.home}::quota_rule=*:storage=${a.quotaMB || 0}M`;
    });
    const tmp = '/tmp/ocp-users.new';
    fs.writeFileSync(tmp, lines.join('\n') + '\n');
    let r = sudo(`cp ${tmp} ${MAIL_PASSWD} && chown vmail:vmail ${MAIL_PASSWD} && rm -f ${tmp}`, 10000);
    // chown başarısız olursa (kısıtlı ortam) — dovecot root olarak okur, sorun değil
    if (!r.ok && /chown/.test(r.output)) {
      r = sudo(`cp ${tmp} ${MAIL_PASSWD} && rm -f ${tmp}`, 10000);
    }
    if (!r.ok) { try { fs.unlinkSync(tmp); } catch (e) {} }
    return r;
  }

  // postfix sanal domain + mailbox map'lerini DB'den yeniden üretir
  function syncMailMaps() {
    const db = loadDB();
    const vdoms = db.domains.map(d => d.name + ' OK').join('\n') + '\n';
    const vbox = readMailAccounts().map(a => `${a.email} ${a.domain}/${a.user}/`).join('\n') + '\n';
    const t1 = '/tmp/ocp-vdoms', t2 = '/tmp/ocp-vbox';
    fs.writeFileSync(t1, vdoms);
    fs.writeFileSync(t2, vbox);
    const r = sudo(`sh -c 'cp ${t1} ${PF_VDOMS} && cp ${t2} ${PF_VBOX} && postmap ${PF_VDOMS} ${PF_VBOX} && rm -f ${t1} ${t2}'`, 15000);
    if (r.ok) sudo(`postfix reload`, 10000);
    return r;
  }

  function sudoDirSize(p) {
    try {
      const r = sudo(`du -sb "${p}" 2>/dev/null | cut -f1`, 10000);
      return parseInt(r.output.trim()) || 0;
    } catch (e) { return 0; }
  }

  // paket e-posta limiti kontrolü (0 = sınırsız)
  function checkEmailQuota(db, domain, extra = 1) {
    const dom = db.domains.find(d => d.name === domain);
    if (!dom || !dom.reseller) return null;
    const reseller = db.resellers.find(r => r.username === dom.reseller);
    if (!reseller) return null;
    const pkg = getPackage(db, reseller.package);
    if (!pkg || !pkg.emails) return null;
    const doms = db.domains.filter(d => d.reseller === reseller.username).map(d => d.name);
    const count = readMailAccounts().filter(a => doms.includes(a.domain)).length;
    if (count + extra > pkg.emails) return `Paket limiti aşıldı: ${pkg.name} paketi en fazla ${pkg.emails} e-posta hesabı içerir`;
    return null;
  }

  // --- E-posta hesaplarını listele ---
  router.get('/emails', auth, (req, res) => {
    const db = loadDB();
    const domainFilter = String(req.query.domain || '').toLowerCase();
    const accs = readMailAccounts()
      .filter(a => !domainFilter || a.domain === domainFilter)
      .map(a => {
        const meta = (db.emails || []).find(e => e.email === a.email) || {};
        const size = sudoDirSize(a.home);
        return { ...a, size, sizeH: fmtBytes(size), created: meta.created || '', owner: meta.owner || '' };
      })
      .sort((x, y) => x.domain.localeCompare(y.domain) || x.user.localeCompare(y.user));
    const totals = {};
    accs.forEach(a => { totals[a.domain] = (totals[a.domain] || 0) + a.size; });
    res.json({ ok: true, emails: accs, total: accs.length, totals });
  });

  // --- E-posta hesabı oluştur ---
  router.post('/emails', auth, (req, res) => {
    const b = req.body || {};
    const email = String(b.email || '').toLowerCase().trim();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Geçersiz e-posta adresi' });
    if (!b.password || String(b.password).length < 6) return res.status(400).json({ error: 'Parola en az 6 karakter olmalı' });
    const quotaMB = Math.max(0, +b.quotaMB || 0);
    const db = loadDB();
    const m = email.match(/^(.+)@(.+)$/);
    const domain = m[2];
    if (!db.domains.some(d => d.name === domain)) return res.status(400).json({ error: `"${domain}" domaini WHM'de kayıtlı değil — önce Create a New Account ile oluşturun` });
    if (readMailAccounts().some(a => a.email === email)) return res.status(400).json({ error: 'Bu e-posta adresi zaten var' });
    const quotaErr = checkEmailQuota(db, domain);
    if (quotaErr) return res.status(400).json({ error: quotaErr });

    const home = `${MAIL_VHOST}/${domain}/${m[1]}`;
    // maildir root olarak oluştur (dash'te brace expansion yok — açık yollar)
    // /var/mail/vhosts üzerindeki default ACL vmail erişimini verir
    const r1 = sudo(`mkdir -p ${home}/cur ${home}/new ${home}/tmp`, 10000);
    if (!r1.ok) return res.status(500).json({ error: 'Maildir oluşturulamadı: ' + r1.output.trim() });
    const r2 = writeMailPasswd(readMailAccounts().concat([{ email, user: m[1], domain, quotaMB, home }]), { [email]: String(b.password) });
    if (!r2.ok) { sudo(`rm -rf ${MAIL_VHOST}/${domain}`, 10000); return res.status(500).json({ error: 'passwd-file yazılamadı: ' + r2.output.trim() }); }
    const r3 = syncMailMaps();
    db.emails = db.emails || [];
    db.emails.push({ email, user: m[1], domain, quotaMB, created: new Date().toISOString(), owner: db.domains.find(d => d.name === domain).reseller || '' });
    saveDB(db);
    res.json({ ok: true, email, quotaMB, maps: r3.ok ? 'synced' : r3.output.trim() });
  });

  // --- Parola / kota değiştir ---
  router.put('/emails/:email', auth, (req, res) => {
    const email = String(req.params.email || '').toLowerCase();
    const accs = readMailAccounts();
    const acc = accs.find(a => a.email === email);
    if (!acc) return res.status(404).json({ error: 'E-posta hesabı bulunamadı' });
    const b = req.body || {};
    const pw = b.password ? String(b.password) : null;
    if (pw && pw.length < 6) return res.status(400).json({ error: 'Parola en az 6 karakter olmalı' });
    if (b.quotaMB != null) acc.quotaMB = Math.max(0, +b.quotaMB || 0);
    const r = writeMailPasswd(accs, pw ? { [email]: pw } : null);
    if (!r.ok) return res.status(500).json({ error: 'passwd-file yazılamadı: ' + r.output.trim() });
    const db = loadDB();
    const meta = (db.emails || []).find(e => e.email === email);
    if (meta && b.quotaMB != null) meta.quotaMB = acc.quotaMB;
    saveDB(db);
    res.json({ ok: true, email, quotaMB: acc.quotaMB, passwordChanged: !!pw });
  });

  // --- E-posta hesabı sil ---
  router.delete('/emails/:email', auth, (req, res) => {
    const email = String(req.params.email || '').toLowerCase();
    const accs = readMailAccounts();
    const acc = accs.find(a => a.email === email);
    if (!acc) return res.status(404).json({ error: 'E-posta hesabı bulunamadı' });
    const r1 = writeMailPasswd(accs.filter(a => a.email !== email));
    if (!r1.ok) return res.status(500).json({ error: 'passwd-file yazılamadı: ' + r1.output.trim() });
    sudo(`rm -rf ${acc.home}`, 10000);
    syncMailMaps();
    const db = loadDB();
    db.emails = (db.emails || []).filter(e => e.email !== email);
    saveDB(db);
    res.json({ ok: true, email, removed: true });
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
