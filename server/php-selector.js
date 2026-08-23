/* ============================================================
 * OCP Panel — PHP Selector Module
 * Domain bazında PHP sürümü seçimi + FPM pool yönetimi
 * Desteklenen sürümler: 7.4, 8.0, 8.1, 8.2, 8.3
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = ({ run, sudo, auth }) => {
  const router = require('express').Router();
  const DATA_FILE = path.join(os.homedir(), '.config', 'ocp-panel', 'php-selector.json');
  const PHP_FPM_DIR = '/etc/php';
  const POOL_DIR = '/etc/php/*/fpm/pool.d';
  const SUPPORTED_VERSIONS = ['7.4', '8.0', '8.1', '8.2', '8.3'];

  /* ---------- veri deposu ---------- */
  function loadDB() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (e) { return { domainPhp: {}, pools: {}, settings: { defaultVersion: '8.2' } }; }
  }

  function saveDB(db) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }

  /* ---------- Yardımcılar ---------- */
  function getInstalledPhpVersions() {
    const versions = [];
    try {
      const dirs = fs.readdirSync(PHP_FPM_DIR);
      for (const dir of dirs) {
        if (SUPPORTED_VERSIONS.includes(dir) && fs.existsSync(path.join(PHP_FPM_DIR, dir, 'fpm'))) {
          versions.push(dir);
        }
      }
    } catch (e) { /* yoksay */ }
    return versions.sort((a, b) => parseFloat(b) - parseFloat(a));
  }

  function getPoolConfig(version, poolName) {
    const poolDir = path.join(PHP_FPM_DIR, version, 'fpm', 'pool.d');
    const poolFile = path.join(poolDir, `${poolName}.conf`);
    if (!fs.existsSync(poolFile)) return null;
    return fs.readFileSync(poolFile, 'utf8');
  }

  function writePoolConfig(version, poolName, config) {
    const poolDir = path.join(PHP_FPM_DIR, version, 'fpm', 'pool.d');
    fs.mkdirSync(poolDir, { recursive: true });
    const poolFile = path.join(poolDir, `${poolName}.conf`);
    fs.writeFileSync(poolFile, config);
  }

  function createPoolConfig(version, poolName, options = {}) {
    const user = options.user || poolName;
    const group = options.group || user;
    const socket = options.socket || `/run/php/php${version}-fpm-${poolName}.sock`;
    const pm = options.pm || 'ondemand';
    const pmMaxChildren = options.pmMaxChildren || 50;
    const pmStartServers = options.pmStartServers || 5;
    const pmMinSpareServers = options.pmMinSpareServers || 5;
    const pmMaxSpareServers = options.pmMaxSpareServers || 35;
    const pmProcessIdleTimeout = options.pmProcessIdleTimeout || '10s';
    const maxRequests = options.maxRequests || 500;
    const chdir = options.chdir || '/home/' + user;
    const phpIni = options.phpIni || {};
    
    let config = `[${poolName}]\n`;
    config += `user = ${user}\n`;
    config += `group = ${group}\n`;
    config += `listen = ${socket}\n`;
    config += `listen.owner = ${user}\n`;
    config += `listen.group = ${group}\n`;
    config += `listen.mode = 0660\n`;
    config += `pm = ${pm}\n`;
    config += `pm.max_children = ${pmMaxChildren}\n`;
    
    if (pm === 'dynamic') {
      config += `pm.start_servers = ${pmStartServers}\n`;
      config += `pm.min_spare_servers = ${pmMinSpareServers}\n`;
      config += `pm.max_spare_servers = ${pmMaxSpareServers}\n`;
    } else if (pm === 'ondemand') {
      config += `pm.process_idle_timeout = ${pmProcessIdleTimeout}\n`;
    }
    
    config += `pm.max_requests = ${maxRequests}\n`;
    config += `chdir = ${chdir}\n`;
    config += `catch_workers_output = yes\n`;
    config += `security.limit_extensions = .php .php7 .php8 .phtml\n`;
    
    // PHP ini ayarları
    for (const [key, value] of Object.entries(phpIni)) {
      config += `php_admin_value[${key}] = ${value}\n`;
    }
    
    // Ortam değişkenleri
    config += `env[HOSTNAME] = $HOSTNAME\n`;
    config += `env[PATH] = /usr/local/bin:/usr/bin:/bin\n`;
    config += `env[TMP] = /tmp\n`;
    config += `env[TMPDIR] = /tmp\n`;
    config += `env[TEMP] = /tmp\n`;
    
    return config;
  }

  async function reloadPhpFpm(version) {
    const r = sudo(`systemctl reload php${version}-fpm`, 15000);
    return r.ok;
  }

  /* ==========================================================
   * KURULU PHP SÜRÜMLERİ
   * ========================================================== */
  router.get('/php-selector/versions', auth, (req, res) => {
    const installed = getInstalledPhpVersions();
    const db = loadDB();
    res.json({ ok: true, supported: SUPPORTED_VERSIONS, installed, default: db.settings?.defaultVersion || '8.2' });
  });

  /* ==========================================================
   * DOMAIN BAZINDA PHP SÜRÜMÜ ATA
   * ========================================================== */
  router.get('/php-selector/domains', auth, (req, res) => {
    const db = loadDB();
    const domains = db.domainPhp || {};
    const installed = getInstalledPhpVersions();
    const defaultVer = db.settings?.defaultVersion || '8.2';
    
    // Panel domain'leri ile birleştir
    const whm = require('./whm')({ run, sudo, auth });
    // WHM domain'lerini almak için basit bir yol
    res.json({ ok: true, domains, installed, default: defaultVer });
  });

  router.post('/php-selector/domains/:domain', auth, (req, res) => {
    const domain = String(req.params.domain).toLowerCase().trim();
    const b = req.body || {};
    const version = String(b.version || '').trim();
    
    if (!version || !SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü. Desteklenen: ' + SUPPORTED_VERSIONS.join(', ') });
    }
    
    const db = loadDB();
    db.domainPhp = db.domainPhp || {};
    db.domainPhp[domain] = version;
    saveDB(db);
    
    // Nginx vhost'ını güncelle
    updateNginxPhpSocket(domain, version);
    
    // FPM pool'unu yeniden yükle
    reloadPhpFpm(version);
    
    res.json({ ok: true, domain, version, message: `PHP ${version} atandı: ${domain}` });
  });

  /* ==========================================================
   * FPM POOL YÖNETİMİ
   * ========================================================== */
  router.get('/php-selector/pools/:version', auth, (req, res) => {
    const version = req.params.version;
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const poolDir = path.join(PHP_FPM_DIR, version, 'fpm', 'pool.d');
    if (!fs.existsSync(poolDir)) return res.json({ ok: true, pools: [] });
    
    const pools = [];
    try {
      const files = fs.readdirSync(poolDir).filter(f => f.endsWith('.conf'));
      for (const file of files) {
        const poolName = file.replace('.conf', '');
        const config = fs.readFileSync(path.join(poolDir, file), 'utf8');
        pools.push({ name: poolName, version, config });
      }
    } catch (e) { /* yoksay */ }
    
    res.json({ ok: true, pools, version });
  });

  router.post('/php-selector/pools/:version', auth, (req, res) => {
    const version = req.params.version;
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const b = req.body || {};
    const poolName = String(b.name || '').trim();
    if (!poolName || !/^[a-z0-9][a-z0-9_-]{0,31}$/i.test(poolName)) {
      return res.status(400).json({ error: 'Geçersiz pool adı (sadece harf, rakam, _ -)' });
    }
    
    const poolDir = path.join(PHP_FPM_DIR, version, 'fpm', 'pool.d');
    const poolFile = path.join(poolDir, `${poolName}.conf`);
    if (fs.existsSync(poolFile)) {
      return res.status(400).json({ error: 'Bu isimde bir pool zaten var' });
    }
    
    const options = {
      user: String(b.user || poolName).trim(),
      group: String(b.group || poolName).trim(),
      socket: String(b.socket || `/run/php/php${version}-fpm-${poolName}.sock`).trim(),
      pm: b.pm || 'ondemand',
      pmMaxChildren: +b.pmMaxChildren || 50,
      pmStartServers: +b.pmStartServers || 5,
      pmMinSpareServers: +b.pmMinSpareServers || 5,
      pmMaxSpareServers: +b.pmMaxSpareServers || 35,
      pmProcessIdleTimeout: String(b.pmProcessIdleTimeout || '10s'),
      maxRequests: +b.maxRequests || 500,
      chdir: String(b.chdir || '/home/' + (b.user || poolName)).trim(),
      phpIni: b.phpIni || {},
    };
    
    const config = createPoolConfig(version, poolName, options);
    writePoolConfig(version, poolName, config);
    reloadPhpFpm(version);
    
    const db = loadDB();
    db.pools = db.pools || {};
    db.pools[version] = db.pools[version] || [];
    db.pools[version].push({ name: poolName, ...options });
    saveDB(db);
    
    res.json({ ok: true, pool: poolName, version, message: `Pool ${poolName} oluşturuldu (PHP ${version})` });
  });

  router.put('/php-selector/pools/:version/:pool', auth, (req, res) => {
    const version = req.params.version;
    const poolName = req.params.pool;
    
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const poolDir = path.join(PHP_FPM_DIR, version, 'fpm', 'pool.d');
    const poolFile = path.join(poolDir, `${poolName}.conf`);
    if (!fs.existsSync(poolFile)) {
      return res.status(404).json({ error: 'Pool bulunamadı' });
    }
    
    const b = req.body || {};
    const options = {
      user: String(b.user || poolName).trim(),
      group: String(b.group || poolName).trim(),
      socket: String(b.socket || `/run/php/php${version}-fpm-${poolName}.sock`).trim(),
      pm: b.pm || 'ondemand',
      pmMaxChildren: +b.pmMaxChildren || 50,
      pmStartServers: +b.pmStartServers || 5,
      pmMinSpareServers: +b.pmMinSpareServers || 5,
      pmMaxSpareServers: +b.pmMaxSpareServers || 35,
      pmProcessIdleTimeout: String(b.pmProcessIdleTimeout || '10s'),
      maxRequests: +b.maxRequests || 500,
      chdir: String(b.chdir || '/home/' + poolName).trim(),
      phpIni: b.phpIni || {},
    };
    
    const config = createPoolConfig(version, poolName, options);
    writePoolConfig(version, poolName, config);
    reloadPhpFpm(version);
    
    const db = loadDB();
    if (db.pools && db.pools[version]) {
      const idx = db.pools[version].findIndex(p => p.name === poolName);
      if (idx >= 0) db.pools[version][idx] = { name: poolName, ...options };
    }
    saveDB(db);
    
    res.json({ ok: true, pool: poolName, version, message: `Pool ${poolName} güncellendi` });
  });

  router.delete('/php-selector/pools/:version/:pool', auth, (req, res) => {
    const version = req.params.version;
    const poolName = req.params.pool;
    
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const poolDir = path.join(PHP_FPM_DIR, version, 'fpm', 'pool.d');
    const poolFile = path.join(poolDir, `${poolName}.conf`);
    if (!fs.existsSync(poolFile)) {
      return res.status(404).json({ error: 'Pool bulunamadı' });
    }
    
    // Varsayılan www pool'u silinemez
    if (poolName === 'www') {
      return res.status(400).json({ error: 'Varsayılan www pool silinemez' });
    }
    
    fs.unlinkSync(poolFile);
    reloadPhpFpm(version);
    
    const db = loadDB();
    if (db.pools && db.pools[version]) {
      db.pools[version] = db.pools[version].filter(p => p.name !== poolName);
    }
    saveDB(db);
    
    res.json({ ok: true, message: `Pool ${poolName} silindi` });
  });

  /* ==========================================================
   * PHP INI DÜZENLEYİCİ
   * ========================================================== */
  router.get('/php-selector/ini/:version', auth, (req, res) => {
    const version = req.params.version;
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const iniPath = path.join(PHP_FPM_DIR, version, 'fpm', 'php.ini');
    let content = '';
    try {
      content = fs.readFileSync(iniPath, 'utf8');
    } catch (e) {
      content = '; php.ini dosyası bulunamadı';
    }
    
    res.json({ ok: true, version, content, path: iniPath });
  });

  router.put('/php-selector/ini/:version', auth, (req, res) => {
    const version = req.params.version;
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const content = String(req.body.content || '');
    const iniPath = path.join(PHP_FPM_DIR, version, 'fpm', 'php.ini');
    
    try {
      // Yedek al
      if (fs.existsSync(iniPath)) {
        fs.copyFileSync(iniPath, iniPath + '.bak.' + Date.now());
      }
      fs.writeFileSync(iniPath, content);
      reloadPhpFpm(version);
      res.json({ ok: true, message: `php.ini güncellendi (PHP ${version})` });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* ==========================================================
   * PHP MODÜL YÖNETİMİ
   * ========================================================== */
  router.get('/php-selector/modules/:version', auth, (req, res) => {
    const version = req.params.version;
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const r = run(`php${version} -m 2>/dev/null`);
    const modules = r.ok ? r.output.trim().split('\n').filter(Boolean) : [];
    res.json({ ok: true, version, modules });
  });

  /* ==========================================================
   * PHP BİLGİ SAYFASI (phpinfo)
   * ========================================================== */
  router.get('/php-selector/info/:version', auth, (req, res) => {
    const version = req.params.version;
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const r = run(`php${version} -i 2>/dev/null | head -100`);
    res.json({ ok: true, version, info: r.ok ? r.output : 'php -i çalıştırılamadı' });
  });

  /* ==========================================================
   * VARSayılan PHP SÜRÜMÜ
   * ========================================================== */
  router.post('/php-selector/default', auth, (req, res) => {
    const version = String(req.body.version || '').trim();
    if (!SUPPORTED_VERSIONS.includes(version)) {
      return res.status(400).json({ error: 'Geçersiz PHP sürümü' });
    }
    
    const db = loadDB();
    db.settings = db.settings || {};
    db.settings.defaultVersion = version;
    saveDB(db);
    
    res.json({ ok: true, defaultVersion: version, message: `Varsayılan PHP sürümü: ${version}` });
  });

  /* ==========================================================
   * NGINX PHP SOCKET GÜNCELLE
   * ========================================================== */
  function updateNginxPhpSocket(domain, version) {
    const vhostPath = path.join('/etc/nginx/sites-available', domain + '.conf');
    if (!fs.existsSync(vhostPath)) return;
    
    let content = fs.readFileSync(vhostPath, 'utf8');
    const socketPath = `/run/php/php${version}-fpm-${domain.replace(/[^a-z0-9]/g, '_')}.sock`;
    const socketPath2 = `/run/php/php${version}-fpm.sock`;
    
    // Mevcut fastcgi_pass satırını güncelle
    const newFastcgi = `fastcgi_pass unix:${socketPath};`;
    content = content.replace(/fastcgi_pass\s+unix:[^;]+;/g, newFastcgi);
    
    fs.writeFileSync(path.join('/etc/nginx/sites-available', domain + '.conf'), content);
    run(`nginx -t && systemctl reload nginx`, 15000);
  }

  /* ==========================================================
   * AYARLAR
   * ========================================================== */
  router.get('/php-selector/settings', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, settings: db.settings || { defaultVersion: '8.2' } });
  });

  router.post('/php-selector/settings', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    db.settings = db.settings || {};
    if (b.defaultVersion && SUPPORTED_VERSIONS.includes(b.defaultVersion)) {
      db.settings.defaultVersion = b.defaultVersion;
    }
    saveDB(db);
    res.json({ ok: true, settings: db.settings });
  });

  return router;
};