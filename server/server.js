#!/usr/bin/env node
/* ============================================================
 * OCP Panel — Gerçek Sunucu Kontrol Paneli
 * cPanel X3 teması + Node.js backend (auth + sistem API)
 * Port: 2083 (HTTPS) — cPanel temalı
 * ============================================================ */
'use strict';

const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 2083;
const ROOT = path.join(__dirname, '..');
const PASSWORD_FILE = process.env.PANEL_PASSWORD_FILE || path.join(os.homedir(), '.config', 'ocp-panel', 'password');
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat

/* ---------- Parola yönetimi ---------- */
function getPanelPassword() {
  if (process.env.PANEL_PASSWORD) return process.env.PANEL_PASSWORD;
  try {
    if (fs.existsSync(PASSWORD_FILE)) {
      return fs.readFileSync(PASSWORD_FILE, 'utf8').trim();
    }
  } catch (e) { /* yoksay */ }
  // İlk çalıştırma: rastgele parola üret ve kaydet
  const pw = crypto.randomBytes(4).toString('hex');
  try {
    fs.mkdirSync(path.dirname(PASSWORD_FILE), { recursive: true });
    fs.writeFileSync(PASSWORD_FILE, pw + '\n', { mode: 0o600 });
  } catch (e) { console.log('[ocp] Parola dosyası yazılamadı:', e.message); }
  return pw;
}

const PANEL_PASSWORD = getPanelPassword();

/* ---------- RBAC (Rol Bazlı Erişim) ---------- */
const rbac = require('./rbac');

/* ---------- Token yönetimi ---------- */
const sessions = new Map(); // token -> { expires, user }

function issueToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    expires: Date.now() + TOKEN_TTL_MS,
    user: user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name || user.username
    } : null
  });
  return token;
}

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const s = token && sessions.get(token);
  if (!s) return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum' });
  if (s.expires < Date.now()) { sessions.delete(token); return res.status(401).json({ error: 'Oturum süresi doldu' }); }
  req.token = token;
  req.user = s.user;
  next();
}

/* ---------- Komut yardımcıları ---------- */
function run(cmd, timeout = 15000) {
  try {
    const out = execSync(cmd, { timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, output: out };
  } catch (e) {
    return { ok: false, output: (e.stdout || '') + (e.stderr || ''), code: e.status };
  }
}

function sudo(cmd, timeout) { return run(`sudo -n ${cmd}`, timeout || 15000); }

function runJson(cmd, timeout = 15000) {
  const r = run(cmd, timeout);
  return r.ok ? { ok: true, data: r.output } : { ok: false, error: r.output.trim() };
}

/* ---------- Route'lar ---------- */
const api = require('./routes')({ run, runJson, auth, issueToken, sessions, PANEL_PASSWORD, rbac });
const whm = require('./whm')({ run, sudo, auth });
const backups = require('./backups')({ run, sudo, auth });
const users = require('./users')({ auth, rbac, requirePermission: rbac.requirePermission });
const { setupSwagger } = require('./swagger');

app.use(express.json({ limit: '10mb' }));
app.use('/api', api);
app.use('/api', whm);
app.use('/api', backups);
app.use('/api', users);

/* ---------- Swagger API Docs ---------- */
setupSwagger(app);

/* ---------- Statik dosyalar (frontend) ---------- */
app.use(express.static(ROOT));
// SPA fallback
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

module.exports = { PANEL_PASSWORD, issueToken, sessions };

// HTTPS server (self-signed certificate)
const SSL_KEY = process.env.SSL_KEY || path.join(__dirname, '..', 'ssl', 'ocp-panel.key');
const SSL_CERT = process.env.SSL_CERT || path.join(__dirname, '..', 'ssl', 'ocp-panel.crt');

let sslOptions = null;
try {
  sslOptions = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT)
  };
} catch (e) {
  console.log('[ocp] SSL sertifika okunamadı, HTTP modunda çalışıyor:', e.message);
}

const server = sslOptions
  ? https.createServer(sslOptions, app)
  : app;

server.listen(PORT, '0.0.0.0', () => {
  const protocol = sslOptions ? 'https' : 'http';
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│  OCP PANEL — Gerçek Sunucu Kontrol Paneli   │');
  console.log('└──────────────────────────────────────────────┘');
  const ip = (() => { try { return execSync(`hostname -I`).toString().trim().split(' ')[0]; } catch (e) { return 'localhost'; } })();
  console.log(`  Adres   : ${protocol}://${ip}:${PORT}`);
  console.log(`  Port    : ${PORT}`);
  console.log(`  SSL     : ${sslOptions ? '✓ Aktif (self-signed)' : '✗ Kapalı'}`);
  console.log(`  Parola  : ${PANEL_PASSWORD}`);
  console.log(`  Dosya   : ${PASSWORD_FILE}`);
  console.log('────────────────────────────────────────────────');
});
