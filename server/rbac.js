/* ============================================================
 * OCP Panel — Rol Bazlı Erişim Kontrolü (RBAC)
 * Veri: ~/.config/ocp-panel/users.json
 * Roller: admin, reseller, user
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const DATA_FILE = path.join(os.homedir(), '.config', 'ocp-panel', 'users.json');

/* ---------- Roller ve yetkiler ---------- */
const ROLES = {
  admin: {
    name: 'admin',
    label: 'Yönetici',
    permissions: ['*'] // tüm yetkilere erişim
  },
  reseller: {
    name: 'reseller',
    label: 'Bayi',
    permissions: [
      'stats', 'services', 'processes', 'files', 'logs', 'cron', 'network',
      'disk', 'mysql', 'terminal', 'docker', 'backups',
      'whm.accounts.list', 'whm.accounts.create', 'whm.accounts.modify', 'whm.accounts.terminate',
      'whm.packages', 'whm.resellers', 'whm.dns', 'whm.email', 'whm.ftp'
    ]
  },
  user: {
    name: 'user',
    label: 'Kullanıcı',
    permissions: [
      'stats', 'files', 'disk',
      'whm.accounts.list', // sadece kendi hesabını görür
      'whm.email', 'whm.ftp'
    ]
  }
};

/* ---------- Varsayılan veri ---------- */
function defaultDB() {
  return {
    users: [
      {
        id: 1,
        username: 'admin',
        password: hashPassword(getPanelPasswordFromFile()),
        role: 'admin',
        name: 'Panel Admin',
        created: new Date().toISOString(),
        active: true
      }
    ],
    nextId: 2
  };
}

function getPanelPasswordFromFile() {
  const pf = path.join(os.homedir(), '.config', 'ocp-panel', 'password');
  try { return fs.readFileSync(pf, 'utf8').trim(); }
  catch (e) { return 'admin'; }
}

/* ---------- Şifre hash ---------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pw, salt, 10000, 64, 'sha256').toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const calc = crypto.pbkdf2Sync(pw, salt, 10000, 64, 'sha256').toString('hex');
  return calc === hash;
}

/* ---------- Veri depo ---------- */
function loadDB() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!data.users || !Array.isArray(data.users)) return defaultDB();
    return data;
  } catch (e) {
    return defaultDB();
  }
}

function saveDB(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), { mode: 0o600 });
}

/* ---------- Yetki kontrolü ---------- */
function hasPermission(user, perm) {
  if (!user || !user.role) return false;
  const role = ROLES[user.role];
  if (!role) return false;
  if (role.permissions.includes('*')) return true;
  // Joker Sonu: 'whm.accounts.*' → 'whm.accounts.list' eşleşir
  for (const p of role.permissions) {
    if (p === perm) return true;
    if (p.endsWith('.*') && perm.startsWith(p.slice(0, -1))) return true;
  }
  return false;
}

function requirePermission(perm) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
    if (!hasPermission(user, perm)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok: ' + perm });
    }
    next();
  };
}

/* ---------- Kullanıcı bul ---------- */
function findUser(db, username) {
  return db.users.find(u => u.username === username && u.active !== false);
}

function findUserById(db, id) {
  return db.users.find(u => u.id === id);
}

/* ---------- Tüm rolleri listele ---------- */
function getRoles() {
  const out = {};
  for (const [key, val] of Object.entries(ROLES)) {
    out[key] = { label: val.label, permissions: val.permissions };
  }
  return out;
}

module.exports = {
  ROLES,
  DATA_FILE,
  hashPassword,
  verifyPassword,
  loadDB,
  saveDB,
  hasPermission,
  requirePermission,
  findUser,
  findUserById,
  getRoles,
  defaultDB
};
