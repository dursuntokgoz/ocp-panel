/* ============================================================
 * OCP Panel — Gerçek Sistem API Route'ları
 * Tüm endpoint'ler auth gerektirir (Bearer token)
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = ({ run, runJson, auth, issueToken, sessions, PANEL_PASSWORD, rbac }) => {
  const router = require('express').Router();

  /* ---------- Rate Limiting Middleware ---------- */
  const rateLimit = require('express-rate-limit');
  
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 dakika
    max: 100, // IP başına dakikada max 100 istek
    message: { error: 'Çok fazla istek, lütfen bekleyin' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // IP başına 15 dakikada max 5 login denemesi
    message: { error: 'Çok fazla başarısız giriş denemesi, 15 dakika bekleyin' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.use('/api/', apiLimiter);
  router.post('/api/login', authLimiter);

  /* ---------- yardımcılar ---------- */
  const sudo = (cmd, timeout) => run(`sudo -n ${cmd}`, timeout || 15000);

  function cpuUsage() {
    // /proc/stat iki örnek arası fark
    const read = () => {
      const l = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0];
      const p = l.split(/\s+/).slice(1).map(Number);
      return { idle: p[3] + p[4], total: p.reduce((a, b) => a + b, 0) };
    };
    const a = read();
    return new Promise(res => {
      setTimeout(() => {
        const b = read();
        const dTotal = b.total - a.total, dIdle = b.idle - a.idle;
        res(dTotal ? Math.round(((dTotal - dIdle) / dTotal) * 100) : 0);
      }, 250);
    });
  }

  function diskInfo() {
    const out = run(`df -B1 / /home /var 2>/dev/null | tail -n +2`).output;
    return out.trim().split('\n').filter(Boolean).map(l => {
      const p = l.split(/\s+/);
      return { fs: p[0], size: +p[1], used: +p[2], avail: +p[3], pct: p[4], mount: p[5] };
    });
  }

  function temp() {
    for (const f of ['/sys/class/thermal/thermal_zone0/temp', '/sys/class/hwmon/hwmon0/temp1_input']) {
      try {
        const v = +fs.readFileSync(f, 'utf8').trim();
        return Math.round(v / 1000);
      } catch (e) { /* sonraki */ }
    }
    return null;
  }

  function jsonParse(s) {
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  function sanitizePath(p) {
    // kök dizin kısıtı yok — panel sahibinin makinesi, tam erişim
    const rp = path.resolve(p || os.homedir());
    return rp;
  }

  function fileSizePretty(n) {
    if (n == null) return '-';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return n.toFixed(n >= 100 || i === 0 ? 0 : 1) + ' ' + u[i];
  }

  /* ==========================================================
   * AUTH (kullanıcı adı + şifre, RBAC)
   * ========================================================== */
  router.post('/login', (req, res) => {
    const username = (req.body && req.body.username) || 'admin';
    const pw = req.body && req.body.password;
    if (!pw) return res.status(400).json({ error: 'Parola gerekli' });

    // Önce RBAC users.json'dan kullanıcı bul
    const db = rbac.loadDB();
    const user = rbac.findUser(db, username);

    if (user && rbac.verifyPassword(pw, user.password)) {
      return res.json({
        token: issueToken(user),
        user: user.username,
        role: user.role,
        name: user.name || user.username,
        hostname: os.hostname()
      });
    }

    // Geri uyumlu: admin kullanıcısı ve panel parolası
    if (username === 'admin' && pw === PANEL_PASSWORD) {
      return res.json({
        token: issueToken({ id: 1, username: 'admin', role: 'admin', name: 'Panel Admin' }),
        user: 'admin',
        role: 'admin',
        name: 'Panel Admin',
        hostname: os.hostname()
      });
    }

    return res.status(401).json({ error: 'Hatalı kullanıcı adı veya parola' });
  });

  router.post('/logout', auth, (req, res) => {
    sessions.delete(req.token);
    res.json({ ok: true });
  });

  router.get('/me', auth, (req, res) => {
    res.json({
      ok: true,
      user: req.user,
      roles: rbac.getRoles()
    });
  });

  /* ==========================================================
   * SISTEM — dashboard özeti
   * ========================================================== */
  router.get('/stats', auth, async (req, res) => {
    try {
      const cpu = await cpuUsage();
      const mem = os.totalmem();
      const memFree = os.freemem();
      const uptime = os.uptime();
      const load = os.loadavg();
      const disks = diskInfo();
      const root = disks.find(d => d.mount === '/') || disks[0] || {};
      res.json({
        ok: true,
        hostname: os.hostname(),
        kernel: os.release(),
        arch: os.arch(),
        platform: os.platform(),
        user: os.userInfo().username,
        uptime,
        load: load.map(l => +l.toFixed(2)),
        cpu: { cores: os.cpus().length, usage: cpu, model: os.cpus()[0].model.trim() },
        memory: { total: mem, used: mem - memFree, free: memFree, pct: Math.round(((mem - memFree) / mem) * 100) },
        disk: { total: root.size, used: root.used, free: root.avail, pct: parseInt(root.pct) },
        temp: temp(),
        ip: (() => { try { return run(`hostname -I`).output.trim().split(' ')[0]; } catch (e) { return null; } })(),
        services: (() => { try { return +run(`systemctl list-units --type=service --state=running --no-legend --no-pager | wc -l`).output.trim(); } catch (e) { return 0; } })(),
        processes: (() => { try { return +run(`ps -e --no-headers | wc -l`).output.trim(); } catch (e) { return 0; } })(),
        docker: (() => { try { return +run(`docker ps -q 2>/dev/null | wc -l`).output.trim(); } catch (e) { return 0; } })(),
        mysql: (() => { try { return run(`systemctl is-active mariadb`).output.trim() === 'active'; } catch (e) { return false; } })(),
        web: (() => { try { return run(`systemctl is-active nginx || systemctl is-active apache2 || systemctl is-active caddy`).output.trim() === 'active'; } catch (e) { return false; } })()
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* ==========================================================
   * SERVISLER (systemd)
   * ========================================================== */
  router.get('/services', auth, (req, res) => {
    const r = run(`systemctl list-units --type=service --all --no-legend --no-pager --plain`);
    if (!r.ok) return res.status(500).json({ error: r.output });
    const list = r.output.trim().split('\n').filter(Boolean).map(l => {
      const p = l.trim().split(/\s+/);
      return { name: p[0], load: p[1], active: p[2], sub: p[3], desc: p.slice(4).join(' ') };
    }).filter(s => s.name.endsWith('.service'));
    res.json({ ok: true, services: list });
  });

  router.post('/services/:name/:action', auth, (req, res) => {
    const { name, action } = req.params;
    if (!['start', 'stop', 'restart', 'reload', 'enable', 'disable'].includes(action)) {
      return res.status(400).json({ error: 'Geçersiz aksiyon' });
    }
    if (!/^[a-zA-Z0-9@._-]+$/.test(name)) return res.status(400).json({ error: 'Geçersiz servis adı' });
    const r = sudo(`systemctl ${action} ${name}`, 30000);
    res.json({ ok: r.ok, output: r.output.trim() || (r.ok ? 'OK' : 'Hata') });
  });

  /* ==========================================================
   * PROCESSLER
   * ========================================================== */
  router.get('/processes', auth, (req, res) => {
    const r = run(`ps -eo pid,ppid,user,%cpu,%mem,rss,stat,etime,cmd --sort=-%cpu --no-headers | head -100`);
    if (!r.ok) return res.status(500).json({ error: r.output });
    const list = r.output.trim().split('\n').filter(Boolean).map(l => {
      const m = l.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.*)$/);
      if (!m) return null;
      return { pid: +m[1], ppid: +m[2], user: m[3], cpu: m[4], mem: m[5], rss: +m[6], rssH: fileSizePretty(+m[6] * 1024), stat: m[7], etime: m[8], cmd: m[9] };
    }).filter(Boolean);
    res.json({ ok: true, processes: list });
  });

  router.post('/processes/kill', auth, (req, res) => {
    const pid = +req.body.pid;
    const signal = req.body.signal || 'TERM';
    if (!pid || !/^\d+$/.test('' + pid)) return res.status(400).json({ error: 'Geçersiz PID' });
    const r = run(`kill -${signal} ${pid}`);
    res.json({ ok: r.ok, output: r.output.trim() || 'OK' });
  });

  /* ==========================================================
   * DOSYALAR
   * ========================================================== */
  router.get('/files', auth, (req, res) => {
    const dir = sanitizePath(req.query.path || os.homedir());
    let st;
    try { st = fs.statSync(dir); } catch (e) { return res.status(404).json({ error: 'Dizin bulunamadı: ' + dir }); }
    if (!st.isDirectory()) return res.json({ ok: true, file: true, path: dir, size: st.size, sizeH: fileSizePretty(st.size), mtime: st.mtime });
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return res.status(403).json({ error: 'Okuma izni yok: ' + e.message }); }
    const files = entries.map(d => {
      let size = null, mtime = null;
      try {
        const s = fs.statSync(path.join(dir, d.name));
        size = s.size; mtime = s.mtime;
      } catch (e) { /* symlink kırık vs */ }
      return {
        name: d.name, dir: d.isDirectory(), link: d.isSymbolicLink(),
        size, sizeH: fileSizePretty(size), mtime: mtime ? mtime.toISOString().replace('T', ' ').slice(0, 19) : null,
        perms: (() => { try { return fs.statSync(path.join(dir, d.name)).mode.toString(8).slice(-3); } catch (e) { return '???'; } })()
      };
    });
    files.sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name));
    res.json({ ok: true, path: dir, parent: path.dirname(dir), files });
  });

  router.get('/files/read', auth, (req, res) => {
    const fp = sanitizePath(req.query.path);
    try {
      const st = fs.statSync(fp);
      if (st.size > 5 * 1024 * 1024) return res.status(413).json({ error: 'Dosya çok büyük (5MB limit)' });
      return res.json({ ok: true, path: fp, content: fs.readFileSync(fp, 'utf8') });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  });

  router.post('/files/write', auth, (req, res) => {
    const fp = sanitizePath(req.body.path);
    if (!fp || !req.body.content) return res.status(400).json({ error: 'path ve content gerekli' });
    try { fs.writeFileSync(fp, req.body.content); return res.json({ ok: true }); }
    catch (e) { return res.status(500).json({ error: e.message }); }
  });

  router.post('/files/mkdir', auth, (req, res) => {
    const fp = sanitizePath(req.body.path);
    try { fs.mkdirSync(fp, { recursive: true }); return res.json({ ok: true }); }
    catch (e) { return res.status(500).json({ error: e.message }); }
  });

  router.post('/files/delete', auth, (req, res) => {
    const fp = sanitizePath(req.body.path);
    try {
      const st = fs.statSync(fp);
      if (st.isDirectory()) fs.rmSync(fp, { recursive: true, force: true });
      else fs.unlinkSync(fp);
      return res.json({ ok: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  });

  router.post('/files/rename', auth, (req, res) => {
    const from = sanitizePath(req.body.path);
    const to = sanitizePath(req.body.newPath);
    try { fs.renameSync(from, to); return res.json({ ok: true }); }
    catch (e) { return res.status(500).json({ error: e.message }); }
  });

  /* ==========================================================
   * LOGLAR
   * ========================================================== */
  router.get('/logs', auth, (req, res) => {
    const unit = req.query.unit ? `-u ${req.query.unit}` : '';
    const lines = Math.min(+(req.query.lines || 200), 2000);
    const since = req.query.since ? `--since="${req.query.since}"` : '';
    const r = run(`journalctl ${unit} ${since} -n ${lines} --no-pager --no-hostname -o short 2>&1`);
    res.json({ ok: r.ok, logs: r.output });
  });

  router.get('/logs/file', auth, (req, res) => {
    const fp = sanitizePath(req.query.path);
    const lines = Math.min(+(req.query.lines || 200), 2000);
    const r = run(`tail -n ${lines} "${fp}" 2>&1`);
    res.json({ ok: r.ok, logs: r.output });
  });

  /* ==========================================================
   * CRON
   * ========================================================== */
  router.get('/cron', auth, (req, res) => {
    const r = run(`crontab -l 2>&1`);
    const content = r.ok ? r.output : '';
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    res.json({ ok: true, content, jobs: lines.map((l, i) => ({ id: i, line: l })) });
  });

  router.post('/cron', auth, (req, res) => {
    const content = req.body.content || '';
    try {
      const tmp = '/tmp/ocp-crontab-' + process.pid;
      fs.writeFileSync(tmp, content + '\n');
      const r = run(`crontab ${tmp} && rm -f ${tmp}`);
      res.json({ ok: r.ok, output: r.output.trim() || 'OK' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  /* ==========================================================
   * AG (network)
   * ========================================================== */
  router.get('/network', auth, (req, res) => {
    const ifaces = [];
    try {
      const j = jsonParse(run(`ip -j addr`).output) || [];
      j.forEach(i => {
        const info = i.addr_info || [];
        ifaces.push({
          name: i.ifname, state: i.operstate, mac: i.address,
          ips: info.filter(a => a.family === 'inet').map(a => a.local + '/' + a.prefixlen),
          ip6: info.filter(a => a.family === 'inet6' && !a.local.startsWith('fe80')).map(a => a.local),
          mtu: i.mtu,
          rx: i.stats64 ? i.stats64.rx_bytes : null,
          tx: i.stats64 ? i.stats64.tx_bytes : null
        });
      });
    } catch (e) { /* yoksay */ }
    const conns = (() => {
      const r = run(`ss -tulnp 2>/dev/null | tail -n +2`);
      return r.output.trim().split('\n').filter(Boolean).map(l => {
        const p = l.trim().split(/\s+/);
        return { proto: p[0], state: p[1], local: p[3] || '', peer: p[4] || '', proc: p[5] || '' };
      });
    })();
    const routes = (() => {
      const r = run(`ip route`);
      return r.output.trim().split('\n').filter(Boolean);
    })();
    res.json({ ok: true, ifaces, conns, routes });
  });

  /* ==========================================================
   * KULLANICILAR
   * ========================================================== */
  router.get('/users', auth, (req, res) => {
    const r = run(`getent passwd | awk -F: '$3>=1000 && $3<65534 {print $1"|"$3"|"$4"|"$6"|"$7}'`);
    const users = r.output.trim().split('\n').filter(Boolean).map(l => {
      const p = l.split('|');
      return { name: p[0], uid: +p[1], gid: +p[2], home: p[3], shell: p[4] };
    });
    // oturum bilgisi
    const sess = run(`who 2>/dev/null`).output.trim().split('\n').filter(Boolean).map(l => l.split(/\s+/).slice(0, 3).join(' '));
    res.json({ ok: true, users, sessions: sess });
  });

  /* ==========================================================
   * DISK KULLANIMI
   * ========================================================== */
  router.get('/disk', auth, (req, res) => {
    const target = sanitizePath(req.query.path || os.homedir());
    const r = run(`du -x -d1 -B1 "${target}" 2>/dev/null | sort -rn | head -25`);
    const items = r.output.trim().split('\n').filter(Boolean).map(l => {
      const p = l.trim().split(/\s+/);
      return { size: +p[0], sizeH: fileSizePretty(+p[0]), path: p.slice(1).join(' ') };
    });
    res.json({ ok: true, path: target, disks: diskInfo(), items });
  });

  /* ==========================================================
   * MYSQL
   * ========================================================== */
  router.get('/mysql', auth, (req, res) => {
    const active = run(`systemctl is-active mariadb`).output.trim() === 'active';
    if (!active) return res.json({ ok: true, active: false });
    const r = run(`mysql -N -e "SHOW DATABASES;" 2>&1`, 10000);
    const dbs = r.ok ? r.output.trim().split('\n').filter(Boolean) : [];
    const info = run(`mysql -N -e "SELECT VERSION(); SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('information_schema','mysql','performance_schema','sys');" 2>&1`, 10000);
    const infoLines = info.ok ? info.output.trim().split('\n').filter(Boolean) : [];
    res.json({
      ok: true, active: true,
      databases: dbs.filter(d => !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(d)),
      version: infoLines[0] || null,
      tables: infoLines[1] || null
    });
  });

  /* ==========================================================
   * TERMINAL — gerçek komut çalıştırma
   * ========================================================== */
  router.post('/terminal', auth, (req, res) => {
    const cmd = (req.body.cmd || '').toString();
    if (!cmd.trim()) return res.json({ ok: true, output: '' });
    if (cmd.length > 2000) return res.status(400).json({ error: 'Komut çok uzun' });
    // Tehlikeli komut koruması — panel sahibinin kendi makinesi, sadece reboot/shutdown uyarısı
    const r = run(cmd, Math.min(+(req.body.timeout || 15000), 60000));
    res.json({ ok: r.ok, output: r.output, code: r.code == null ? 0 : r.code });
  });

  /* ==========================================================
   * UPTIME / GÜNLÜK
   * ========================================================== */
  router.get('/uptime', auth, (req, res) => {
    res.json({ ok: true, uptime: os.uptime(), boot: (() => { try { return run(`uptime -s`).output.trim(); } catch (e) { return null; } })() });
  });

/* ==========================================================
 * SSE — Gerçek zamanlı metrikler (Server-Sent Events)
 * ========================================================== */
  router.get('/stats/stream', auth, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const interval = setInterval(async () => {
      try {
        const cpu = await cpuUsage();
        const mem = os.totalmem();
        const memFree = os.freemem();
        const load = os.loadavg();
        const root = diskInfo().find(d => d.mount === '/') || diskInfo()[0] || {};
        const net = (() => {
          try {
            const j = jsonParse(run(`ip -j -s link`).output) || [];
            let rx = 0, tx = 0;
            j.forEach(i => {
              if (i.ifname !== 'lo') {
                rx += i.stats64?.rx_bytes || 0;
                tx += i.stats64?.tx_bytes || 0;
              }
            });
            return { rx, tx };
          } catch (e) { return { rx: 0, tx: 0 }; }
        })();

        const data = {
          cpu: { usage: cpu, cores: os.cpus().length },
          memory: { total: mem, used: mem - memFree, free: memFree, pct: Math.round(((mem - memFree) / mem) * 100) },
          disk: { total: root.size || 0, used: root.used || 0, free: root.avail || 0, pct: parseInt(root.pct) || 0 },
          load: load.map(l => +l.toFixed(2)),
          temp: temp(),
          network: { rx: net.rx, tx: net.tx },
          timestamp: Date.now()
        };

        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (e) {
        console.error('[SSE] error:', e.message);
      }
    }, 1000);

    req.on('close', () => clearInterval(interval));
  });

  /* ==========================================================
   * DOCKER YÖNETİMİ
   * ========================================================== */
  router.get('/docker', auth, (req, res) => {
    // Tüm konteynerler (çalışan + durmuş)
    const r = run(`docker ps -a --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.CreatedAt}}|{{.Size}}' 2>&1`);
    if (!r.ok) return res.status(500).json({ error: r.output });
    const list = r.output.trim().split('\n').filter(Boolean).map(l => {
      const p = l.split('|');
      return {
        id: p[0],
        name: p[1],
        image: p[2],
        status: p[3],
        ports: p[4] || '',
        created: p[5],
        size: p[6] || ''
      };
    });
    res.json({ ok: true, containers: list });
  });

  router.post('/docker/:id/:action', auth, (req, res) => {
    const { id, action } = req.params;
    const validActions = ['start', 'stop', 'restart', 'pause', 'unpause', 'kill'];
    if (!validActions.includes(action)) return res.status(400).json({ error: 'Geçersiz aksiyon: ' + action });
    // ID doğrulama (hex chars only)
    if (!/^[a-f0-9]{12,64}$/i.test(id)) return res.status(400).json({ error: 'Geçersiz konteyner ID' });
    const r = run(`docker ${action} ${id}`, 30000);
    res.json({ ok: r.ok, output: r.output.trim() || (r.ok ? 'OK' : 'Hata') });
  });

  router.get('/docker/:id/logs', auth, (req, res) => {
    const id = req.params.id;
    if (!/^[a-f0-9]{12,64}$/i.test(id)) return res.status(400).json({ error: 'Geçersiz konteyner ID' });
    const lines = Math.min(+(req.query.lines || 100), 5000);
    const since = req.query.since ? `--since="${req.query.since}"` : '';
    const follow = req.query.follow === 'true' ? '-f' : '';
    const r = run(`docker logs ${follow} --tail ${lines} ${since} ${id} 2>&1`);
    res.json({ ok: r.ok, logs: r.output, id });
  });

  router.get('/docker/:id/stats', auth, (req, res) => {
    const id = req.params.id;
    if (!/^[a-f0-9]{12,64}$/i.test(id)) return res.status(400).json({ error: 'Geçersiz konteyner ID' });
    // Tek seferlik stats (--no-stream)
    const r = run(`docker stats --no-stream --format '{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|{{.PIDs}}' ${id} 2>&1`);
    if (!r.ok) return res.status(500).json({ error: r.output });
    const p = r.output.trim().split('|');
    res.json({
      ok: true,
      id,
      cpu: p[0] || '0%',
      memUsage: p[1] || '0B / 0B',
      memPerc: p[2] || '0%',
      netIO: p[3] || '0B / 0B',
      blockIO: p[4] || '0B / 0B',
      pids: p[5] || '0'
    });
  });

  /* ==========================================================
   * SAĞLIK (auth'suz — servis durumu kontrolü için)
   * ========================================================== */
  router.get('/health', (req, res) => res.json({ ok: true, name: 'ocp-panel', time: new Date().toISOString() }));

  return router;
};
