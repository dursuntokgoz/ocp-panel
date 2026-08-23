/* ============================================================
 * OCP Panel — Firewall Management Module
 * UFW/iptables yönetimi + GeoIP bloklama + Fail2Ban entegrasyonu
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = ({ run, sudo, auth }) => {
  const router = require('express').Router();
  const DATA_FILE = path.join(os.homedir(), '.config', 'ocp-panel', 'firewall.json');
  const UFW_RULES_FILE = '/etc/ufw/user.rules';
  const UFW_BEFORE_RULES = '/etc/ufw/before.rules';
  const FAIL2BAN_JAIL_LOCAL = '/etc/fail2ban/jail.local';
  const FAIL2BAN_FILTER_DIR = '/etc/fail2ban/filter.d';

  /* ---------- veri deposu ---------- */
  function loadDB() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (e) { return { rules: [], geoip: { enabled: false, countries: [] }, fail2ban: { enabled: false, jails: {} } }; }
  }

  function saveDB(db) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }

  /* ---------- Yardımcılar ---------- */
  function validateRule(rule) {
    const errors = [];
    if (!rule.action || !['allow', 'deny', 'reject', 'limit'].includes(rule.action)) {
      errors.push('Geçersiz aksiyon (allow/deny/reject/limit)');
    }
    if (!rule.direction || !['in', 'out', 'routed'].includes(rule.direction)) {
      errors.push('Geçersiz yön (in/out/routed)');
    }
    if (rule.protocol && !['tcp', 'udp', 'icmp', 'any'].includes(rule.protocol)) {
      errors.push('Geçersiz protokol (tcp/udp/icmp/any)');
    }
    if (rule.port) {
      const ports = String(rule.port).split(',').map(p => p.trim());
      for (const p of ports) {
        if (!/^(\d+)(:\d+)?$/.test(p) || parseInt(p.split(':')[0]) > 65535) {
          errors.push('Geçersiz port: ' + p);
        }
      }
    }
    if (rule.ip) {
      const ips = String(rule.ip).split(',').map(p => p.trim());
      for (const ip of ips) {
        if (!/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip) && !/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(ip)) {
          errors.push('Geçersiz IP/CIDR: ' + ip);
        }
      }
    }
    return errors.length ? errors : null;
  }

  function ufwRuleToString(rule) {
    let cmd = 'ufw';
    if (rule.direction === 'out') cmd += ' deny out'; // UFW out varsayılan deny
    else cmd += ` ${rule.action}`;
    
    if (rule.direction === 'in') cmd += ' in';
    else if (rule.direction === 'out') cmd += ' out';
    else cmd += ' routed';
    
    if (rule.protocol && rule.protocol !== 'any') cmd += ` proto ${rule.protocol}`;
    
    if (rule.port) cmd += ` port ${rule.port}`;
    
    if (rule.ip) cmd += ` from ${rule.ip}`;
    
    if (rule.to) cmd += ` to ${rule.to}`;
    
    if (rule.interface) cmd += ` on ${rule.interface}`;
    
    if (rule.comment) cmd += ` comment "${rule.comment}"`;
    
    return cmd;
  }

  function parseUfwStatus() {
    const r = run(`ufw status numbered 2>/dev/null`);
    if (!r.ok) return [];
    
    const lines = r.output.trim().split('\n').slice(1); // Header'ı atla
    const rules = [];
    for (const line of lines) {
      const m = line.match(/^\[\s*(\d+)\]\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)/);
      if (m) {
        rules.push({
          num: parseInt(m[1]),
          action: m[2],
          from: m[3],
          to: m[4],
          extra: m[5].trim()
        });
      }
    }
    return rules;
  }

  /* ==========================================================
   * UFW KURAL LİSTELEME
   * ========================================================== */
  router.get('/firewall/rules', auth, (req, res) => {
    const ufwRules = parseUfwStatus();
    const db = loadDB();
    res.json({ ok: true, rules: ufwRules, custom: db.rules || [], status: getUfwStatus() });
  });

  function getUfwStatus() {
    const r = run(`ufw status verbose 2>/dev/null`);
    if (!r.ok) return { active: false };
    const active = r.output.includes('Status: active');
    const logging = r.output.includes('Logging: on');
    return { active, logging, raw: r.output };
  }

  /* ==========================================================
   * UFW KURAL EKLE
   * ========================================================== */
  router.post('/firewall/rules', auth, (req, res) => {
    const b = req.body || {};
    const errors = validateRule(b);
    if (errors) return res.status(400).json({ error: errors.join(', ') });
    
    const cmd = ufwRuleToString(b);
    const r = sudo(cmd, 10000);
    
    if (!r.ok) return res.status(500).json({ error: 'UFW kuralı eklenemedi: ' + r.output.trim() });
    
    const db = loadDB();
    db.rules = db.rules || [];
    db.rules.push({ ...b, id: Date.now(), created: new Date().toISOString() });
    saveDB(db);
    
    res.json({ ok: true, message: 'UFW kuralı eklendi: ' + cmd, output: r.output });
  });

  /* ==========================================================
   * UFW KURAL SİL
   * ========================================================== */
  router.delete('/firewall/rules/:num', auth, (req, res) => {
    const num = parseInt(req.params.num);
    if (isNaN(num)) return res.status(400).json({ error: 'Geçersiz kural numarası' });
    
    const r = sudo(`ufw delete ${num}`, 10000);
    if (!r.ok) return res.status(500).json({ error: 'UFW kuralı silinemedi: ' + r.output.trim() });
    
    const db = loadDB();
    db.rules = (db.rules || []).filter(r => r.id !== num);
    saveDB(db);
    
    res.json({ ok: true, message: `Kural #${num} silindi` });
  });

  /* ==========================================================
   * UFW AKTİF/DEAKTİF
   * ========================================================== */
  router.post('/firewall/toggle', auth, (req, res) => {
    const enable = req.body.enable !== false;
    const cmd = enable ? 'ufw --force enable' : 'ufw disable';
    const r = sudo(cmd, 30000);
    
    if (!r.ok) return res.status(500).json({ error: (enable ? 'Aktivasyon' : 'Deaktivasyon') + ' başarısız: ' + r.output.trim() });
    
    const db = loadDB();
    db.settings = db.settings || {};
    db.settings.ufwEnabled = enable;
    saveDB(db);
    
    res.json({ ok: true, active: enable, message: `UFW ${enable ? 'aktif edildi' : 'devre dışı bırakıldı'}` });
  });

  /* ==========================================================
   * UFW DEFAULTS
   * ========================================================== */
  router.post('/firewall/defaults', auth, (req, res) => {
    const b = req.body || {};
    const incoming = b.incoming || 'deny';
    const outgoing = b.outgoing || 'allow';
    const routed = b.routed || 'allow';
    
    if (!['allow', 'deny', 'reject'].includes(incoming) || 
        !['allow', 'deny', 'reject'].includes(outgoing) ||
        !['allow', 'deny', 'reject'].includes(routed)) {
      return res.status(400).json({ error: 'Geçersiz default politika' });
    }
    
    let r1 = sudo(`ufw default ${incoming} incoming`, 10000);
    let r2 = sudo(`ufw default ${outgoing} outgoing`, 10000);
    let r3 = sudo(`ufw default ${routed} routed`, 10000);
    
    if (!r1.ok || !r2.ok || !r3.ok) {
      return res.status(500).json({ error: 'Default politikalar ayarlanamadı' });
    }
    
    const db = loadDB();
    db.settings = db.settings || {};
    db.settings.defaults = { incoming, outgoing, routed };
    saveDB(db);
    
    res.json({ ok: true, defaults: { incoming, outgoing, routed } });
  });

  /* ==========================================================
   * UFW LOGGING
   * ========================================================== */
  router.post('/firewall/logging', auth, (req, res) => {
    const level = String(req.body.level || 'medium').toLowerCase();
    if (!['off', 'low', 'medium', 'high', 'full'].includes(level)) {
      return res.status(400).json({ error: 'Geçersiz log seviyesi (off/low/medium/high/full)' });
    }
    
    const r = sudo(`ufw logging ${level}`, 10000);
    if (!r.ok) return res.status(500).json({ error: 'Logging ayarı değiştirilemedi: ' + r.output.trim() });
    
    const db = loadDB();
    db.settings = db.settings || {};
    db.settings.logging = level;
    saveDB(db);
    
    res.json({ ok: true, logging: level });
  });

  /* ==========================================================
   * GEOIP BLOKLAMA
   * ========================================================== */
  router.get('/firewall/geoip', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, geoip: db.geoip || { enabled: false, countries: [] } });
  });

  router.post('/firewall/geoip', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    db.geoip = db.geoip || { enabled: false, countries: [] };
    
    if (b.enabled !== undefined) db.geoip.enabled = !!b.enabled;
    if (b.countries) {
      const countries = String(b.countries).split(',').map(c => c.trim().toUpperCase()).filter(c => /^[A-Z]{2}$/.test(c));
      db.geoip.countries = countries;
    }
    saveDB(db);
    
    // UFW GeoIP uygulama (iptables + geoip modülü gerekli)
    if (db.geoip.enabled && db.geoip.countries.length) {
      applyGeoIpRules(db.geoip.countries);
    } else {
      removeGeoIpRules();
    }
    
    res.json({ ok: true, geoip: db.geoip });
  });

  function applyGeoIpRules(countries) {
    // Önce eski GeoIP kurallarını temizle
    removeGeoIpRules();
    
    // iptables geoip modülü ile ülke bloklaması
    for (const cc of countries) {
      // IPv4
      sudo(`iptables -I INPUT -m geoip --src-cc ${cc} -j DROP -m comment --comment "GeoIP block ${cc}"`, 10000);
      // IPv6
      sudo(`ip6tables -I INPUT -m geoip --src-cc ${cc} -j DROP -m comment --comment "GeoIP block ${cc}"`, 10000);
    }
  }

  function removeGeoIpRules() {
    // GeoIP comment'li kuralları temizle
    sudo(`iptables -D INPUT -m geoip --src-cc -j DROP -m comment --comment "GeoIP block" 2>/dev/null; true`, 10000);
    sudo(`ip6tables -D INPUT -m geoip --src-cc -j DROP -m comment --comment "GeoIP block" 2>/dev/null; true`, 10000);
  }

  /* ==========================================================
   * FAIL2BAN YÖNETİMİ
   * ========================================================== */
  router.get('/firewall/fail2ban', auth, (req, res) => {
    const db = loadDB();
    const status = getFail2banStatus();
    res.json({ ok: true, fail2ban: db.fail2ban || { enabled: false, jails: {} }, status });
  });

  function getFail2banStatus() {
    const r = run(`systemctl is-active fail2ban 2>/dev/null`);
    const active = r.ok && r.output.trim() === 'active';
    let jails = [];
    if (active) {
      const r2 = run(`fail2ban-client status 2>/dev/null`);
      if (r2.ok) {
        const m = r2.output.match(/Jail list:\s+(.+)/);
        if (m) jails = m[1].split(',').map(j => j.trim()).filter(Boolean);
      }
    }
    return { active, jails };
  }

  router.post('/firewall/fail2ban', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    db.fail2ban = db.fail2ban || { enabled: false, jails: {} };
    
    if (b.enabled !== undefined) {
      db.fail2ban.enabled = !!b.enabled;
      const cmd = b.enabled ? 'systemctl enable --now fail2ban' : 'systemctl disable --now fail2ban';
      const r = sudo(cmd, 30000);
      if (!r.ok) {
        db.fail2ban.enabled = !b.enabled;
        return res.status(500).json({ error: 'Fail2Ban ' + (b.enabled ? 'başlatılamadı' : 'durdurulamadı') + ': ' + r.output.trim() });
      }
    }
    
    if (b.jails) {
      db.fail2ban.jails = { ...db.fail2ban.jails, ...b.jails };
      // Jail konfigürasyonunu yaz
      writeFail2banConfig(db.fail2ban.jails);
      sudo('systemctl reload fail2ban', 10000);
    }
    
    saveDB(db);
    res.json({ ok: true, fail2ban: db.fail2ban });
  });

  function writeFail2banConfig(jails) {
    let config = `[DEFAULT]\n`;
    config += `ignoreip = 127.0.0.1/8 ::1\n`;
    config += `bantime = 3600\n`;
    config += `findtime = 600\n`;
    config += `maxretry = 5\n\n`;
    
    for (const [name, config_jail] of Object.entries(jails)) {
      config += `[${name}]\n`;
      config += `enabled = ${config_jail.enabled !== false ? 'true' : 'false'}\n`;
      config += `port = ${config_jail.port || 'ssh'}\n`;
      config += `filter = ${config_jail.filter || name}\n`;
      config += `logpath = ${config_jail.logpath || '/var/log/auth.log'}\n`;
      config += `maxretry = ${config_jail.maxretry || 5}\n`;
      config += `bantime = ${config_jail.bantime || 3600}\n`;
      config += `findtime = ${config_jail.findtime || 600}\n\n`;
    }
    
    fs.writeFileSync(FAIL2BAN_JAIL_LOCAL, config);
    // Filter dosyalarını da kontrol et/oluştur
    ensureFail2banFilters(Object.keys(jails));
  }

  function ensureFail2banFilters(jailNames) {
    fs.mkdirSync(FAIL2BAN_FILTER_DIR, { recursive: true });
    for (const name of jailNames) {
      const filterPath = path.join(FAIL2BAN_FILTER_DIR, `${name}.conf`);
      if (!fs.existsSync(filterPath)) {
        // Varsayılan filtreler
        const defaults = {
          'sshd': `[Definition]\nfailregex = ^%(__prefix_line)s(?:error|failed): Failed (?:password|publickey) for .* from <HOST>(?: port \\d*)?(?: ssh\\d*)?$\n            ^%(__prefix_line)s(?:error|failed): (?:Authentication failure|Failed|error) for .* from <HOST>$\n            ^%(__prefix_line)s(?:error|failed): User not known to the underground for .* from <HOST>$\n            ^%(__prefix_line)s(?:error|failed): Invalid user .* from <HOST>$\nignoreregex = `,
          'nginx-http-auth': `[Definition]\nfailregex = ^.* \"(?:GET|POST|HEAD).*HTTP.*\" 401 .*$\nignoreregex = `,
          'nginx-botsearch': `[Definition]\nfailregex = ^<HOST> -.*"(GET|POST|HEAD).*HTTP.*" (404|403) .*$\nignoreregex = `,
        };
        const content = defaults[name] || `[Definition]\nfailregex = \nignoreregex = `;
        fs.writeFileSync(filterPath, content);
      }
    }
  }

  /* ==========================================================
   * FAIL2BAN JAIL DURUMU
   * ========================================================== */
  router.get('/firewall/fail2ban/:jail', auth, (req, res) => {
    const jail = req.params.jail;
    const r = run(`fail2ban-client status ${jail} 2>/dev/null`);
    if (!r.ok) return res.status(404).json({ error: 'Jail bulunamadı' });
    
    const lines = r.output.trim().split('\n');
    const status = { jail };
    for (const line of lines) {
      if (line.includes('Status')) status.status = line.split(':')[1].trim();
      if (line.includes('Currently failed')) status.currentlyFailed = parseInt(line.split(':')[1].trim());
      if (line.includes('Total failed')) status.totalFailed = parseInt(line.split(':')[1].trim());
      if (line.includes('Banned IP list')) {
        const ips = line.split(':')[1].trim();
        status.bannedIps = ips ? ips.split(/\s+/).filter(Boolean) : [];
      }
    }
    res.json({ ok: true, ...status });
  });

  /* ==========================================================
   * FAIL2BAN UNBAN
   * ========================================================== */
  router.post('/firewall/fail2ban/:jail/unban', auth, (req, res) => {
    const jail = req.params.jail;
    const ip = String(req.body.ip || '').trim();
    if (!ip) return res.status(400).json({ error: 'IP adresi gerekli' });
    
    const r = sudo(`fail2ban-client set ${jail} unbanip ${ip}`, 10000);
    if (!r.ok) return res.status(500).json({ error: 'Unban başarısız: ' + r.output.trim() });
    
    res.json({ ok: true, message: `IP ${ip} ${jail} jail'inden unbanned` });
  });

  /* ==========================================================
   * PORT TARAMA / AÇIK PORTLAR
   * ========================================================== */
  router.get('/firewall/open-ports', auth, (req, res) => {
    const r = run(`ss -tuln 2>/dev/null | tail -n +2`);
    const ports = [];
    if (r.ok) {
      const lines = r.output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          ports.push({
            proto: parts[0],
            state: parts[1],
            local: parts[4],
            peer: parts[5] || ''
          });
        }
      }
    }
    res.json({ ok: true, ports });
  });

  /* ==========================================================
   * IPTABLES RAW KURALLAR
   * ========================================================== */
  router.get('/firewall/iptables', auth, (req, res) => {
    const r4 = run(`iptables -L -n -v --line-numbers 2>/dev/null`);
    const r6 = run(`ip6tables -L -n -v --line-numbers 2>/dev/null`);
    res.json({ 
      ok: true, 
      ipv4: r4.ok ? r4.output : 'iptables erişilemedi', 
      ipv6: r6.ok ? r6.output : 'ip6tables erişilemedi' 
    });
  });

  router.post('/firewall/iptables/raw', auth, (req, res) => {
    const cmd = String(req.body.cmd || '').trim();
    if (!cmd) return res.status(400).json({ error: 'iptables komutu gerekli' });
    // Güvenlik: sadece -A, -I, -D, -L, -F, -Z, -N, -X, -P komutlarına izin ver
    if (!/^iptables\s+(-[AIFLDZNPX]|--(append|insert|delete|list|flush|zero|new-chain|delete-chain|policy))/.test(cmd)) {
      return res.status(400).json({ error: 'İzin verilmeyen iptables komutu' });
    }
    const r = sudo(cmd, 10000);
    res.json({ ok: r.ok, output: r.output, code: r.code });
  });

  /* ==========================================================
   * AYARLAR
   * ========================================================== */
  router.get('/firewall/settings', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, settings: db.settings || { ufwEnabled: false, defaults: { incoming: 'deny', outgoing: 'allow', routed: 'allow' }, logging: 'medium' } });
  });

  router.post('/firewall/settings', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    db.settings = db.settings || {};
    if (b.ufwEnabled !== undefined) db.settings.ufwEnabled = !!b.ufwEnabled;
    if (b.defaults) db.settings.defaults = b.defaults;
    if (b.logging) db.settings.logging = b.logging;
    saveDB(db);
    res.json({ ok: true, settings: db.settings });
  });

  return router;
};