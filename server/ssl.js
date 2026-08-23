/* ============================================================
 * OCP Panel — SSL/TLS Manager Module
 * Let's Encrypt (ACME) sertifika yönetimi + nginx konfigürasyonu
 * acme-client ile ACMEv2 (RFC 8555) desteği
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { run } = require('child_process');

module.exports = ({ run, sudo, auth }) => {
  const router = require('express').Router();
  const DATA_FILE = path.join(os.homedir(), '.config', 'ocp-panel', 'ssl.json');
  const NGINX_AVAIL = '/etc/nginx/sites-available';
  const NGINX_ENABLED = '/etc/nginx/sites-enabled';
  const LETSENCRYPT_DIR = '/etc/letsencrypt/live';
  const ACME_ACCOUNT_KEY = path.join(os.homedir(), '.config', 'ocp-panel', 'acme-account.key');

  /* ---------- veri deposu ---------- */
  function loadDB() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (e) { return { certificates: [], accounts: [], settings: {} }; }
  }

  function saveDB(db) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }

  /* ---------- ACME Client Yardımcıları ---------- */
  async function getAcmeClient(email, directoryUrl = 'https://acme-v02.api.letsencrypt.org/directory') {
    const { createClient, createAccount, createOrder, createCertificate, waitForOrder } = await import('acme-client');
    const { readFile, writeFile } = fs.promises;

    let accountKeyPem;
    try {
      accountKeyPem = await readFile(ACME_ACCOUNT_KEY, 'utf8');
    } catch (e) {
      // Hesap anahtarı yok, yeni oluştur
      const { createPrivateKey } = await import('acme-client');
      const key = await createPrivateKey();
      accountKeyPem = key.toString();
      await writeFile(ACME_ACCOUNT_KEY, accountKeyPem, { mode: 0o600 });
    }

    const client = new createClient({
      directoryUrl,
      accountKey: accountKeyPem,
    });

    // Hesap kayıtlı değilse kaydet
    try {
      const account = await client.getAccount();
    } catch (e) {
      await createAccount(client, { termsOfServiceAgreed: true, contact: [ `mailto:${email}` ] });
    }

    return client;
  }

  async function requestCertificate(domains, email, challengeType = 'http-01') {
    const client = await getAcmeClient(email);
    const order = await client.createOrder({ identifiers: domains.map(d => ({ type: 'dns', value: d })) });
    
    const authorizations = await order.getAuthorizations();
    for (const authz of authorizations) {
      const challenge = challengeType === 'http-01' 
        ? authz.getHttp01Challenge() 
        : authz.getDns01Challenge();
      
      if (challengeType === 'http-01') {
        // HTTP-01 challenge: .well-known/acme-challenge/ dosyası oluştur
        const token = challenge.token;
        const keyAuth = challenge.keyAuthorization;
        const wellKnownDir = '/var/www/letsencrypt/.well-known/acme-challenge';
        fs.mkdirSync(wellKnownDir, { recursive: true });
        fs.writeFileSync(path.join(wellKnownDir, token), keyAuth);
      }
      
      await challenge.respond();
      await waitForOrder(order);
    }

    const certPem = await createCertificate(client, order.finalize());
    return { certPem, order };
  }

  /* ==========================================================
   * SSL SERTİFİKA LİSTELEME
   * ========================================================== */
  router.get('/ssl', auth, (req, res) => {
    const db = loadDB();
    
    // Let's Encrypt sertifikalarını da tara
    let leCerts = [];
    try {
      if (fs.existsSync(LETSENCRYPT_DIR)) {
        const dirs = fs.readdirSync(LETSENCRYPT_DIR);
        for (const domain of dirs) {
          const certPath = path.join(LETSENCRYPT_DIR, domain, 'cert.pem');
          const chainPath = path.join(LETSENCRYPT_DIR, domain, 'chain.pem');
          const fullchainPath = path.join(LETSENCRYPT_DIR, domain, 'fullchain.pem');
          const privkeyPath = path.join(LETSENCRYPT_DIR, domain, 'privkey.pem');
          
          if (fs.existsSync(certPath)) {
            const cert = fs.readFileSync(certPath, 'utf8');
            const info = parseCertInfo(cert);
            leCerts.push({
              domain,
              type: 'letsencrypt',
              cert: certPath,
              chain: chainPath,
              fullchain: fullchainPath,
              privkey: privkeyPath,
              expires: info.notAfter,
              issuer: info.issuer,
              subject: info.subject,
              san: info.san,
            });
          }
        }
      }
    } catch (e) { /* yoksay */ }

    // Panel sertifikaları
    const panelCerts = (db.certificates || []).map(c => ({ ...c, type: 'panel' }));
    
    res.json({ ok: true, certificates: [...panelCerts, ...leCerts], settings: db.settings || {} });
  });

  function parseCertInfo(certPem) {
    // Basit PEM parse - openssl ile daha güvenilir
    const r = run(`echo "${certPem}" | openssl x509 -noout -subject -issuer -dates -ext subjectAltName 2>/dev/null`);
    if (!r.ok) return { notAfter: null, issuer: null, subject: null, san: [] };
    
    const out = r.output;
    const notAfter = (out.match(/notAfter=(.+)/) || [])[1];
    const issuer = (out.match(/issuer=(.+)/) || [])[1];
    const subject = (out.match(/subject=(.+)/) || [])[1];
    const san = (out.match(/subjectAltName=(.+)/) || [])[1]?.split(', ').map(s => s.replace('DNS:', '')) || [];
    
    return { notAfter, issuer, subject, san };
  }

  /* ==========================================================
   * LET'S ENCRYPT SERTİFİKA TALEBİ (HTTP-01)
   * ========================================================== */
  router.post('/ssl/letsencrypt', auth, async (req, res) => {
    try {
      const b = req.body || {};
      const domains = (b.domains || []).map(d => String(d).toLowerCase().trim()).filter(Boolean);
      const email = String(b.email || '').trim();
      const challengeType = b.challengeType || 'http-01';
      
      if (!domains.length) return res.status(400).json({ error: 'En az bir domain gerekli' });
      if (!email || !email.includes('@')) return res.status(400).json({ error: 'Geçerli email gerekli' });

      // Domain sahipliği kontrolü (panel'de kayıtlı mı?)
      const db = loadDB();
      const panelDomains = (db.domains || []).map(d => d.name);
      const invalid = domains.filter(d => !panelDomains.includes(d));
      if (invalid.length) return res.status(400).json({ error: 'Panelde kayıtlı olmayan domainler: ' + invalid.join(', ') });

      // HTTP-01 için nginx ayarını kontrol et
      if (challengeType === 'http-01') {
        fs.mkdirSync('/var/www/letsencrypt/.well-known/acme-challenge', { recursive: true });
        // nginx location ekle
        const nginxConf = `
location /.well-known/acme-challenge/ {
    root /var/www/letsencrypt;
    default_type "text/plain";
}
`;
        const tmp = '/tmp/ocp-le-challenge.conf';
        fs.writeFileSync(tmp, nginxConf);
        sudo(`cp ${tmp} /etc/nginx/snippets/letsencrypt-challenge.conf 2>/dev/null || true`);
        // Tüm vhost'lara include et
        sudo(`nginx -t && systemctl reload nginx`, 15000);
      }

      // Sertifika talebi
      const { certPem } = await requestCertificate(domains, email, challengeType);
      
      // Sertifikayı kaydet
      const certDir = path.join(LETSENCRYPT_DIR, domains[0]);
      fs.mkdirSync(certDir, { recursive: true });
      fs.writeFileSync(path.join(certDir, 'cert.pem'), certPem);
      // fullchain, chain, privkey ACME client tarafından yönetiliyor
      
      // DB'ye kaydet
      const cert = {
        domain: domains[0],
        san: domains.slice(1),
        type: 'letsencrypt',
        email,
        cert: certPem,
        created: new Date().toISOString(),
        expires: parseCertInfo(certPem).notAfter,
      };
      db.certificates = db.certificates || [];
      // Aynı domain varsa güncelle
      const idx = db.certificates.findIndex(c => c.domain === domains[0]);
      if (idx >= 0) db.certificates[idx] = cert;
      else db.certificates.push(cert);
      saveDB(db);

      // Nginx vhost'larını güncelle
      await updateNginxSsl(domains[0]);
      
      res.json({ ok: true, certificate: cert, message: `Let's Encrypt sertifikası alındı: ${domains.join(', ')}` });
    } catch (e) {
      console.error('[SSL] Let\'s Encrypt error:', e);
      res.status(500).json({ error: 'Sertifika alınamadı: ' + e.message });
    }
  });

  /* ==========================================================
   * SERTİFİKA YENİLEME (Otomatik cron için)
   * ========================================================== */
  router.post('/ssl/renew', auth, async (req, res) => {
    try {
      const db = loadDB();
      const certs = db.certificates || [];
      const results = [];
      
      for (const cert of certs) {
        if (cert.type !== 'letsencrypt') continue;
        const domains = [cert.domain, ...(cert.san || [])];
        const email = cert.email;
        
        try {
          const { certPem } = await requestCertificate(domains, email);
          const certDir = path.join(LETSENCRYPT_DIR, domains[0]);
          fs.writeFileSync(path.join(certDir, 'cert.pem'), certPem);
          
          cert.cert = certPem;
          cert.expires = parseCertInfo(certPem).notAfter;
          cert.renewed = new Date().toISOString();
          
          await updateNginxSsl(domains[0]);
          results.push({ domain: domains[0], status: 'renewed' });
        } catch (e) {
          results.push({ domain: domains[0], status: 'failed', error: e.message });
        }
      }
      
      saveDB(db);
      res.json({ ok: true, results });
    } catch (e) {
      res.status(500).json({ error: 'Yenileme hatası: ' + e.message });
    }
  });

  /* ==========================================================
   * NGINX SSL GÜNCELLEME
   * ========================================================== */
  async function updateNginxSsl(primaryDomain) {
    const db = loadDB();
    const cert = (db.certificates || []).find(c => c.domain === primaryDomain);
    if (!cert) return;

    const leDir = path.join(LETSENCRYPT_DIR, primaryDomain);
    const certPath = cert.cert || path.join(leDir, 'cert.pem');
    const keyPath = path.join(leDir, 'privkey.pem');
    const chainPath = path.join(leDir, 'chain.pem');
    const fullchainPath = path.join(leDir, 'fullchain.pem');

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) return;

    // Nginx vhost dosyalarını güncelle
    const vhostFiles = fs.readdirSync(NGINX_AVAIL).filter(f => f.endsWith('.conf'));
    for (const file of vhostFiles) {
      const vhostPath = path.join(NGINX_AVAIL, file);
      let content = fs.readFileSync(vhostPath, 'utf8');
      
      // Domain eşleşiyorsa SSL ayarlarını güncelle
      if (content.includes(`server_name ${primaryDomain}`) || content.includes(`server_name ${primaryDomain} `)) {
        const sslBlock = `
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    ssl_certificate ${fullchainPath};
    ssl_certificate_key ${keyPath};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
`;
        // Mevcut SSL blokunu değiştir veya ekle
        if (content.includes('ssl_certificate')) {
          content = content.replace(/listen 443 ssl[^;]*;\s*listen \[::\]:443 ssl[^;]*;\s*ssl_certificate[^;]*;\s*ssl_certificate_key[^;]*;/g, sslBlock.trim());
        } else {
          content = content.replace('listen 80;', sslBlock + '\n    listen 80;');
        }
        
        fs.writeFileSync(vhostPath, content);
      }
    }
    
    run(`nginx -t && systemctl reload nginx`, 15000);
  }

  /* ==========================================================
   * ÖZEL SERTİFİKA YÜKLE (PFX/PEM)
   * ========================================================== */
  router.post('/ssl/upload', auth, (req, res) => {
    const b = req.body || {};
    const domain = String(b.domain || '').toLowerCase().trim();
    const cert = String(b.cert || '').trim();
    const key = String(b.key || '').trim();
    const chain = String(b.chain || '').trim();
    
    if (!domain || !DOMAIN_RE.test(domain)) return res.status(400).json({ error: 'Geçersiz domain' });
    if (!cert || !cert.includes('BEGIN CERTIFICATE')) return res.status(400).json({ error: 'Geçersiz sertifika (PEM formatında olmalı)' });
    if (!key || !key.includes('PRIVATE KEY')) return res.status(400).json({ error: 'Geçersiz private key' });
    
    // Eşleşme kontrolü
    const r = run(`echo "${cert}" | openssl x509 -noout -modulus | openssl md5`);
    const k = run(`echo "${key}" | openssl rsa -noout -modulus | openssl md5`);
    if (!r.ok || !k.ok || r.output.trim() !== k.output.trim()) {
      return res.status(400).json({ error: 'Sertifika ve private key eşleşmiyor' });
    }

    const certDir = path.join('/etc/ssl/ocp-panel', domain);
    fs.mkdirSync(certDir, { recursive: true });
    fs.writeFileSync(path.join(certDir, 'cert.pem'), cert);
    fs.writeFileSync(path.join(certDir, 'privkey.pem'), key);
    if (chain) fs.writeFileSync(path.join(certDir, 'chain.pem'), chain);
    
    const fullchain = cert + '\n' + chain;
    fs.writeFileSync(path.join(certDir, 'fullchain.pem'), fullchain);
    
    const db = loadDB();
    const certInfo = {
      domain,
      san: parseCertInfo(cert).san || [],
      type: 'custom',
      cert,
      key,
      chain,
      fullchain,
      created: new Date().toISOString(),
      expires: parseCertInfo(cert).notAfter,
    };
    
    const idx = (db.certificates || []).findIndex(c => c.domain === domain);
    if (idx >= 0) db.certificates[idx] = certInfo;
    else (db.certificates = db.certificates || []).push(certInfo);
    saveDB(db);
    
    updateNginxSsl(domain);
    
    res.json({ ok: true, certificate: certInfo, message: 'Özel sertifika yüklendi ve nginx güncellendi' });
  });

  /* ==========================================================
   * SERTİFİKA SİL
   * ========================================================== */
  router.delete('/ssl/:domain', auth, (req, res) => {
    const domain = String(req.params.domain).toLowerCase().trim();
    const db = loadDB();
    
    const idx = (db.certificates || []).findIndex(c => c.domain === domain);
    if (idx === -1) return res.status(404).json({ error: 'Sertifika bulunamadı' });
    
    db.certificates.splice(idx, 1);
    saveDB(db);
    
    // Dosyaları da sil
    const certDir = path.join('/etc/ssl/ocp-panel', domain);
    if (fs.existsSync(certDir)) fs.rmSync(certDir, { recursive: true, force: true });
    
    // Nginx'i HTTP'ye geri döndür
    const vhostPath = path.join(NGINX_AVAIL, domain + '.conf');
    if (fs.existsSync(vhostPath)) {
      let content = fs.readFileSync(vhostPath, 'utf8');
      content = content.replace(/\s*listen 443 ssl[^;]*;/g, '')
                       .replace(/\s*listen \[::\]:443 ssl[^;]*;/g, '')
                       .replace(/\s*ssl_certificate[^;]*;/g, '')
                       .replace(/\s*ssl_certificate_key[^;]*;/g, '')
                       .replace(/\s*ssl_protocols[^;]*;/g, '')
                       .replace(/\s*ssl_ciphers[^;]*;/g, '')
                       .replace(/\s*ssl_prefer_server_ciphers[^;]*;/g, '');
      fs.writeFileSync(vhostPath, content);
      run(`nginx -t && systemctl reload nginx`, 15000);
    }
    
    res.json({ ok: true, message: 'Sertifika silindi, HTTP\'ye dönüldü' });
  });

  /* ==========================================================
   * AYARLAR (ACME email, auto-renewal)
   * ========================================================== */
  router.get('/ssl/settings', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, settings: db.settings || { acmeEmail: '', autoRenew: true } });
  });

  router.post('/ssl/settings', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    db.settings = db.settings || {};
    if (b.acmeEmail) db.settings.acmeEmail = String(b.acmeEmail).trim();
    if (b.autoRenew !== undefined) db.settings.autoRenew = !!b.autoRenew;
    saveDB(res);
    res.json({ ok: true, settings: db.settings });
  });

  /* ==========================================================
   * SERTİFİKA İNDİR
   * ========================================================== */
  router.get('/ssl/download/:domain', auth, (req, res) => {
    const domain = String(req.params.domain).toLowerCase().trim();
    const db = loadDB();
    const cert = (db.certificates || []).find(c => c.domain === domain);
    if (!cert) return res.status(404).json({ error: 'Sertifika bulunamadı' });
    
    const type = req.query.type || 'fullchain';
    let content = cert.cert;
    let filename = `${domain}.crt`;
    
    if (type === 'key') {
      const keyPath = path.join('/etc/ssl/ocp-panel', domain, 'privkey.pem');
      if (fs.existsSync(keyPath)) content = fs.readFileSync(keyPath, 'utf8');
      filename = `${domain}.key`;
    } else if (type === 'chain') {
      content = cert.chain || '';
      filename = `${domain}.chain.crt`;
    } else if (type === 'fullchain') {
      const fullchainPath = path.join('/etc/letsencrypt/live', domain, 'fullchain.pem');
      if (fs.existsSync(fullchainPath)) content = fs.readFileSync(fullchainPath, 'utf8');
      else content = cert.cert + '\n' + (cert.chain || '');
      filename = `${domain}.fullchain.pem`;
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.send(content);
  });

  return router;
};