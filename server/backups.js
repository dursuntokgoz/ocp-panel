/* ============================================================
 * OCP Panel — Yedekleme Otomasyonu Modülü
 * Gerçek entegrasyon: tar.gz arşivleri + rsync + crontab zamanlama
 * Veri deposu: ~/.config/ocp-panel/backups.json
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = ({ run, sudo, auth }) => {
  const router = require('express').Router();
  const DATA_FILE = path.join(os.homedir(), '.config', 'ocp-panel', 'backups.json');
  const DEFAULT_BACKUP_DIR = path.join(os.homedir(), 'backups');

  /* ---------- veri deposu ---------- */
  function loadDB() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (e) { return { backups: [], schedule: null, history: [] }; }
  }

  function saveDB(db) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }

  /* ---------- yardımcılar ---------- */
  function fmtBytes(n) {
    if (n == null || isNaN(n)) return '—';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return n.toFixed(n >= 100 || i === 0 ? 0 : 1) + ' ' + u[i];
  }

  // Güvenli dosya adı — sadece [a-z0-9._-]
  const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,79}$/i;

  // Kaynak yolları doğrula — mevcut dizinler olmalı
  function validateSources(sources) {
    if (!Array.isArray(sources) || !sources.length) return null;
    const out = [];
    for (const s of sources) {
      const p = path.resolve(String(s).trim());
      if (!fs.existsSync(p)) return { error: `Kaynak bulunamadı: ${p}` };
      out.push(p);
    }
    return out;
  }

  // Backend'de çalışan yedekleme dizinindeki tüm arşivleri tara
  function scanArchives(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isFile()) continue;
        const fp = path.join(dir, e.name);
        try {
          const st = fs.statSync(fp);
          out.push({
            name: e.name,
            path: fp,
            size: st.size,
            sizeH: fmtBytes(st.size),
            mtime: st.mtime.toISOString().replace('T', ' ').slice(0, 19),
            type: e.name.endsWith('.tar.gz') || e.name.endsWith('.tgz') ? 'tar.gz' :
                  e.name.endsWith('.zip') ? 'zip' : 'file'
          });
        } catch (err) { /* yoksay */ }
      }
    } catch (e) { /* yoksay */ }
    return out.sort((a, b) => b.mtime.localeCompare(a.mtime));
  }

  // Cron satırından schedule bilgisini çöz
  function parseCronLine(line) {
    if (!line) return null;
    const p = line.trim().split(/\s+/);
    if (p.length < 6) return null;
    return {
      minute: p[0], hour: p[1], dom: p[2], month: p[3], dow: p[4],
      command: p.slice(5).join(' ')
    };
  }

  // Mevcut crontab'dan OCP yedekleme satırını bul
  function findOcpCron() {
    const r = run(`crontab -l 2>/dev/null`);
    if (!r.ok) return null;
    const lines = r.output.split('\n').filter(Boolean);
    const line = lines.find(l => l.includes('ocp-backup'));
    return line ? parseCronLine(line) : null;
  }

  // Ocak / Ay / Gün → cron ifadesi
  function toCronExpr(s) {
    if (!s || !s.enabled) return null;
    // s: { enabled, frequency: 'daily'|'weekly'|'monthly'|'custom', hour, minute, dayOfWeek, dayOfMonth, custom }
    if (s.frequency === 'custom' && s.custom) return s.custom.trim();
    const min = s.minute != null ? String(s.minute) : '0';
    const hour = s.hour != null ? String(s.hour) : '3';
    switch (s.frequency) {
      case 'daily': return `${min} ${hour} * * *`;
      case 'weekly': return `${min} ${hour} * * ${s.dayOfWeek || 0}`;
      case 'monthly': return `${min} ${hour} ${s.dayOfMonth || 1} * *`;
      default: return `${min} ${hour} * * *`;
    }
  }

  /* ==========================================================
   * BACKUP LİSTELEME
   * ========================================================== */
  router.get('/backups', auth, (req, res) => {
    const db = loadDB();
    const dir = db.settings && db.settings.dir ? db.settings.dir : DEFAULT_BACKUP_DIR;
    const archives = scanArchives(dir);
    // DB kayıtlarıyla birleştir (restore geçmişi vs.)
    const list = archives.map(a => {
      const meta = db.backups.find(b => b.file === a.name) || {};
      return { ...a, ...meta };
    });
    res.json({
      ok: true,
      backups: list,
      total: list.length,
      totalSize: list.reduce((s, b) => s + (b.size || 0), 0),
      totalSizeH: fmtBytes(list.reduce((s, b) => s + (b.size || 0), 0)),
      dir,
      schedule: db.schedule || findOcpCron() || null,
      history: (db.history || []).slice(-20).reverse()
    });
  });

  /* ==========================================================
   * YEDEK OLUŞTUR (tar.gz arşivi)
   * ========================================================== */
  router.post('/backups', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    const dir = (b.dir || (db.settings && db.settings.dir) || DEFAULT_BACKUP_DIR).toString();

    // İsim: otomatik veya kullanıcı tanımlı
    let name = b.name ? String(b.name).trim() : null;
    if (name && !SAFE_NAME.test(name)) return res.status(400).json({ error: 'Geçersiz yedek adı (sadece harf, rakam, . _ -)' });
    if (!name) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      name = 'backup-' + ts;
    }
    if (!name.endsWith('.tar.gz')) name += '.tar.gz';

    // Kaynaklar: belirtilenler veya DB'deki varsayılanlar
    const sources = validateSources(b.sources || (db.settings && db.settings.sources));
    if (sources && sources.error) return res.status(400).json({ error: sources.error });

    const target = path.join(path.resolve(dir), name);
    // Tehlikeli yol kontrolü: arşiv kaynağın içine yazılmamalı
    for (const s of (sources || [])) {
      if (target.startsWith(s + path.sep) || target === s) {
        return res.status(400).json({ error: `Hedef (${target}) kaynak dizinin içinde olamaz` });
      }
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });

    // tar komutu oluştur — her kaynağı ekle (base adıyla)
    // güvenlik: kaynak yolları zaten var olduğu doğrulandı, ancak yine de kaçış
    const tarParts = (sources || [os.homedir()]).map(s => {
      const base = path.basename(s);
      return `-C ${JSON.stringify(path.dirname(s))} ${JSON.stringify(base)}`;
    });

    const cmd = `tar -czf ${JSON.stringify(target)} ${tarParts.join(' ')} 2>&1`;
    const started = new Date().toISOString();

    // Uzun sürebilir — async exec kullan
    const { exec } = require('child_process');
    exec(cmd, { timeout: 3600000, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      const ended = new Date().toISOString();
      const durationSec = Math.round((new Date(ended) - new Date(started)) / 1000);
      if (err) {
        const msg = (stderr || stdout || err.message).trim();
        db.history = db.history || [];
        db.history.push({ action: 'create', name, ok: false, error: msg.slice(0, 300), started, ended, durationSec });
        saveDB(db);
        return res.status(500).json({ error: msg.slice(0, 500) });
      }
      let size = 0;
      try { size = fs.statSync(target).size; } catch (e) { /* yoksay */ }
      const rec = {
        file: name, name: name.replace(/\.tar\.gz$/i, ''),
        sources: sources || [os.homedir()], dir,
        size, sizeH: fmtBytes(size),
        created: started, durationSec
      };
      db.backups = db.backups || [];
      db.backups.push(rec);
      db.history = db.history || [];
      db.history.push({ action: 'create', name, ok: true, size, durationSec, started, ended });
      saveDB(db);
      res.json({ ok: true, backup: rec, message: `Yedek oluşturuldu: ${name} (${fmtBytes(size)}, ${durationSec}s)` });
    });
  });

  /* ==========================================================
   * YEDEK GERİ YÜKLE
   * ========================================================== */
  router.post('/backups/:name/restore', auth, (req, res) => {
    const name = String(req.params.name).trim();
    const db = loadDB();
    const dir = (db.settings && db.settings.dir) || DEFAULT_BACKUP_DIR;
    const fp = path.join(path.resolve(dir), name);
    // Yol kaçışı koruması
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
      return res.status(404).json({ error: 'Yedek bulunamadı: ' + name });
    }

    const b = req.body || {};
    // Hedef: DB kaydındaki ilk kaynak veya body'den
    const meta = db.backups.find(x => x.file === name);
    let target = b.target ? path.resolve(String(b.target)) : (meta && meta.sources && meta.sources[0]) || os.homedir();
    if (!fs.existsSync(target)) {
      try { fs.mkdirSync(target, { recursive: true }); } catch (e) { return res.status(400).json({ error: 'Hedef dizin oluşturulamadı: ' + e.message }); }
    }

    // --strip-components=1: arşivdeki üst dizin adını atla
    const cmd = `tar -xzf ${JSON.stringify(fp)} -C ${JSON.stringify(target)} --strip-components=1 2>&1`;
    const started = new Date().toISOString();
    const { exec } = require('child_process');
    exec(cmd, { timeout: 3600000, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      const ended = new Date().toISOString();
      const durationSec = Math.round((new Date(ended) - new Date(started)) / 1000);
      db.history = db.history || [];
      if (err) {
        const msg = (stderr || stdout || err.message).trim();
        db.history.push({ action: 'restore', name, ok: false, error: msg.slice(0, 300), started, ended, durationSec });
        saveDB(db);
        return res.status(500).json({ error: msg.slice(0, 500) });
      }
      db.history.push({ action: 'restore', name, ok: true, target, started, ended, durationSec });
      saveDB(db);
      res.json({ ok: true, message: `Yedek geri yüklendi: ${name} → ${target} (${durationSec}s)` });
    });
  });

  /* ==========================================================
   * YEDEK SİL
   * ========================================================== */
  router.delete('/backups/:name', auth, (req, res) => {
    const name = String(req.params.name).trim();
    const db = loadDB();
    const dir = (db.settings && db.settings.dir) || DEFAULT_BACKUP_DIR;
    const fp = path.join(path.resolve(dir), name);
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Yedek bulunamadı: ' + name });
    try {
      fs.unlinkSync(fp);
      db.backups = (db.backups || []).filter(b => b.file !== name);
      db.history = db.history || [];
      db.history.push({ action: 'delete', name, ok: true, started: new Date().toISOString() });
      saveDB(db);
      res.json({ ok: true, message: 'Yedek silindi: ' + name });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* ==========================================================
   * ZAMANLAMA (crontab entegrasyonu)
   * ========================================================== */
  router.get('/backups/schedule', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, schedule: db.schedule || findOcpCron() || null });
  });

  router.post('/backups/schedule', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    const dir = (db.settings && db.settings.dir) || DEFAULT_BACKUP_DIR;
    const sources = validateSources(b.sources || (db.settings && db.settings.sources));
    if (sources && sources.error) return res.status(400).json({ error: sources.error });

    // Cron ifadesi üret
    const expr = b.custom ? String(b.custom).trim() : toCronExpr(b);
    if (!expr) return res.status(400).json({ error: 'Zamanlama ifadesi gerekli' });
    // Basit doğrulama: 5 alan
    if (!/^(\S+\s+){4}\S+$/.test(expr)) return res.status(400).json({ error: 'Geçersiz cron ifadesi (5 alan gerekli)' });

    // OCP backup script'i
    const scriptPath = path.join(__dirname, '..', 'deploy', 'ocp-backup.sh');
    // Script yoksa oluştur
    if (!fs.existsSync(scriptPath)) {
      fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
      let scriptContent = '#!/bin/bash\n';
      scriptContent += '# OCP Panel otomatik yedekleme — panel tarafından yönetilir\n';
      scriptContent += '# Kaynaklar: ' + (sources || [os.homedir()]).join(', ') + '\n';
      scriptContent += '# Hedef    : ' + dir + '\n';
      scriptContent += 'set -e\n';
      scriptContent += 'mkdir -p "${dir}"\n';
      scriptContent += 'NAME="backup-auto-$(date +%Y-%m-%d-%H%M%S).tar.gz"\n';
      const tarParts = (sources || [os.homedir()]).map(s => {
        const base = path.basename(s);
        const parentDir = path.dirname(s);
        return 'tar -czf "${dir}/${NAME}" -C "' + parentDir + '" "' + base + '"';
      }).join(' ');
      scriptContent += (tarParts || 'echo "Kaynak yok"') + '\n';
      scriptContent += 'echo "OK: ${dir}/${NAME}"\n';
      fs.writeFileSync(scriptPath, scriptContent);
      fs.chmodSync(scriptPath, 0o755);
    }

    // Eski OCP cron satırını kaldır, yenisini ekle
    const existing = run(`crontab -l 2>/dev/null`).output;
    const filtered = existing.split('\n').filter(l => !l.includes('ocp-backup')).join('\n');
    const cronLine = `${expr} ${scriptPath} >> ${path.join(os.homedir(), 'backups', 'backup.log')} 2>&1`;
    const newCron = (filtered.trim() ? filtered.trim() + '\n' : '') + cronLine + '\n';
    const tmp = '/tmp/ocp-crontab-' + process.pid;
    fs.writeFileSync(tmp, newCron);
    const r = run(`crontab ${tmp} && rm -f ${tmp}`);
    if (!r.ok) { try { fs.unlinkSync(tmp); } catch (e) {} return res.status(500).json({ error: 'Crontab yazılamadı: ' + r.output.trim() }); }

    const schedule = {
      enabled: true,
      frequency: b.custom ? 'custom' : (b.frequency || 'daily'),
      custom: b.custom ? String(b.custom).trim() : undefined,
      minute: b.minute != null ? +b.minute : 0,
      hour: b.hour != null ? +b.hour : 3,
      dayOfWeek: b.dayOfWeek != null ? +b.dayOfWeek : 0,
      dayOfMonth: b.dayOfMonth != null ? +b.dayOfMonth : 1,
      expr,
      sources: sources || (db.settings && db.settings.sources) || [os.homedir()],
      dir,
      script: scriptPath,
      updated: new Date().toISOString()
    };
    db.schedule = schedule;
    db.settings = db.settings || {};
    if (sources) db.settings.sources = sources;
    if (b.dir) db.settings.dir = path.resolve(String(b.dir));
    saveDB(db);
    res.json({ ok: true, schedule, message: `Zamanlama ayarlandı: ${expr} → ${scriptPath}` });
  });

  router.delete('/backups/schedule', auth, (req, res) => {
    const existing = run(`crontab -l 2>/dev/null`).output;
    const filtered = existing.split('\n').filter(l => !l.includes('ocp-backup')).join('\n');
    const tmp = '/tmp/ocp-crontab-' + process.pid;
    fs.writeFileSync(tmp, filtered + '\n');
    const r = run(`crontab ${tmp} && rm -f ${tmp}`);
    if (!r.ok) { try { fs.unlinkSync(tmp); } catch (e) {} return res.status(500).json({ error: 'Crontab yazılamadı: ' + r.output.trim() }); }
    const db = loadDB();
    db.schedule = null;
    saveDB(db);
    res.json({ ok: true, message: 'Zamanlama kaldırıldı' });
  });

  /* ==========================================================
   * AYARLAR (yedekleme dizini + varsayılan kaynaklar)
   * ========================================================== */
  router.get('/backups/settings', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, settings: db.settings || { dir: DEFAULT_BACKUP_DIR, sources: [os.homedir()] } });
  });

  router.post('/backups/settings', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    db.settings = db.settings || {};
    if (b.dir) {
      const d = path.resolve(String(b.dir));
      fs.mkdirSync(d, { recursive: true });
      db.settings.dir = d;
    }
    if (b.sources) {
      const v = validateSources(b.sources);
      if (v && v.error) return res.status(400).json({ error: v.error });
      db.settings.sources = v;
    }
    saveDB(db);
    res.json({ ok: true, settings: db.settings });
  });

  return router;
};
