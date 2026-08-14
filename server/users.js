/* ============================================================
 * OCP Panel — Kullanıcı Yönetimi API (RBAC)
 * Roller: admin, reseller, user
 * Veri: ~/.config/ocp-panel/users.json
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = ({ auth, rbac, requirePermission }) => {
  const router = require('express').Router();

  const VALID_ROLES = Object.keys(rbac.ROLES);
  const USERNAME_RE = /^[a-z][a-z0-9._-]{2,31}$/;

  /* ==========================================================
   * KULLANICI LİSTELE
   * ========================================================== */
  router.get('/users', auth, requirePermission('users.list'), (req, res) => {
    const db = rbac.loadDB();
    // Şifre hash'lerini asla gönderme
    const users = db.users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      name: u.name || u.username,
      active: u.active !== false,
      created: u.created,
      lastLogin: u.lastLogin || null
    }));
    res.json({ ok: true, users, roles: rbac.getRoles() });
  });

  /* ==========================================================
   * KULLANICI OLUŞTUR
   * ========================================================== */
  router.post('/users', auth, requirePermission('users.create'), (req, res) => {
    const b = req.body || {};
    const username = String(b.username || '').trim().toLowerCase();
    const password = String(b.password || '');
    const role = String(b.role || 'user');
    const name = String(b.name || '').trim() || username;

    // Doğrulamalar
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı adı (küçük harf, rakam, . _ - ; 3-32 karakter, harf ile başlamalı)' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Parola en az 8 karakter olmalı' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol: ' + role + ' (geçerli: ' + VALID_ROLES.join(', ') + ')' });
    }
    // Sadece admin başka admin oluşturabilir — ve admin rolü ataması da admin'e özel
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin rolü atamak için admin yetkisi gerekli' });
    }

    const db = rbac.loadDB();
    if (rbac.findUser(db, username)) {
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten mevcut' });
    }

    const user = {
      id: db.nextId || 1,
      username,
      password: rbac.hashPassword(password),
      role,
      name,
      active: true,
      created: new Date().toISOString(),
      lastLogin: null
    };
    db.users.push(user);
    db.nextId = (db.nextId || 1) + 1;
    rbac.saveDB(db);

    res.json({ ok: true, user: { id: user.id, username, role, name, active: true, created: user.created }, message: 'Kullanıcı oluşturuldu: ' + username });
  });

  /* ==========================================================
   * KULLANICI GÜNCELLE (rol, ad, aktiflik, parola)
   * ========================================================== */
  router.put('/users/:id', auth, requirePermission('users.modify'), (req, res) => {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};
    const db = rbac.loadDB();
    const user = rbac.findUserById(db, id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    // Kendini pasifleştirme veya rolünü değiştirme yasağı (son admin koruması)
    if (user.id === req.user.id) {
      if (b.active === false) return res.status(400).json({ error: 'Kendi hesabınızı pasifleştiremezsiniz' });
      if (b.role && b.role !== user.role) return res.status(400).json({ error: 'Kendi rolünüzü değiştiremezsiniz' });
    }

    // Son admin koruması: aktif tek admin'i düşürme
    if (user.role === 'admin' && b.role && b.role !== 'admin') {
      const activeAdmins = db.users.filter(u => u.role === 'admin' && u.active !== false);
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ error: 'Son aktif admin\'in rolü değiştirilemez' });
      }
    }
    if (user.role === 'admin' && b.active === false) {
      const activeAdmins = db.users.filter(u => u.role === 'admin' && u.active !== false);
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ error: 'Son aktif admin pasifleştirilemez' });
      }
    }

    if (b.role) {
      if (!VALID_ROLES.includes(b.role)) return res.status(400).json({ error: 'Geçersiz rol' });
      if (b.role === 'admin' && req.user.role !== 'admin') return res.status(403).json({ error: 'Admin rolü atamak için admin yetkisi gerekli' });
      user.role = b.role;
    }
    if (typeof b.name === 'string') user.name = b.name.trim() || user.username;
    if (typeof b.active === 'boolean') user.active = b.active;
    if (b.password) {
      if (String(b.password).length < 8) return res.status(400).json({ error: 'Parola en az 8 karakter olmalı' });
      user.password = rbac.hashPassword(String(b.password));
    }
    rbac.saveDB(db);

    res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role, name: user.name, active: user.active }, message: 'Kullanıcı güncellendi: ' + user.username });
  });

  /* ==========================================================
   * KULLANICI SİL
   * ========================================================== */
  router.delete('/users/:id', auth, requirePermission('users.delete'), (req, res) => {
    const id = parseInt(req.params.id, 10);
    const db = rbac.loadDB();
    const user = rbac.findUserById(db, id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
    }
    if (user.role === 'admin') {
      const activeAdmins = db.users.filter(u => u.role === 'admin' && u.active !== false);
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ error: 'Son aktif admin silinemez' });
      }
    }

    db.users = db.users.filter(u => u.id !== id);
    rbac.saveDB(db);
    res.json({ ok: true, message: 'Kullanıcı silindi: ' + user.username });
  });

  /* ==========================================================
   * ŞİFRE DEĞİŞTİR (kendi şifresi)
   * ========================================================== */
  router.post('/users/me/password', auth, (req, res) => {
    const b = req.body || {};
    const current = String(b.current || '');
    const next = String(b.next || '');
    if (next.length < 8) return res.status(400).json({ error: 'Yeni parola en az 8 karakter olmalı' });

    const db = rbac.loadDB();
    const user = rbac.findUserById(db, req.user.id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    // Mevcut şifre doğrula — RBAC kullanıcısıysa
    if (user.password && !rbac.verifyPassword(current, user.password)) {
      return res.status(400).json({ error: 'Mevcut parola hatalı' });
    }
    user.password = rbac.hashPassword(next);
    rbac.saveDB(db);
    res.json({ ok: true, message: 'Parola değiştirildi' });
  });

  return router;
};
