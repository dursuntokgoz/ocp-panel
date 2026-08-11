# OCP Panel — ROADMAP

## ✅ Tamamlanan (v2.0 — Gerçek Sunucu Kontrol Paneli)

### Backend (Node.js/Express, port 2083)
- [x] Token tabanlı kimlik doğrulama (24 saat oturum, parola: `~/.config/ocp-panel/password`)
- [x] `/api/stats` — CPU, RAM, disk, sıcaklık, uptime, load, servis/proses/docker sayıları
- [x] `/api/services` — systemd servis listesi + start/stop/restart/enable/disable (sudo)
- [x] `/api/processes` — ps listesi + kill
- [x] `/api/files` — dizin listeleme, dosya okuma/yazma, mkdir, silme, yeniden adlandırma
- [x] `/api/logs` — journalctl (servis bazlı) + dosya kuyruğu
- [x] `/api/cron` — gerçek crontab okuma/yazma
- [x] `/api/network` — ağ arayüzleri, dinleyen portlar, yönlendirme tablosu
- [x] `/api/users` — sistem kullanıcıları + aktif oturumlar
- [x] `/api/disk` — du analizi + df bölümleri
- [x] `/api/mysql` — MariaDB durumu/veritabanları
- [x] `/api/terminal` — gerçek shell komutu çalıştırma (60s limit)
- [x] systemd servisi (`ocp-panel.service`, açılışta otomatik başlar)

### WHM (WebHost Manager — gerçek menü yapısı)
- [x] **Home:** Server Status, Services, Network Interfaces, System Users, Package Updates
- [x] **Account Functions:** Create a New Account (sistem kullanıcısı + vhost + hosts), List Accounts, Modify an Account, Terminate an Account
- [x] **Packages:** Add/Edit/Delete/List Package (disk, domain, e-posta, bant genişliği limitleri)
- [x] **Resellers:** Reseller Center, Create/Modify/Terminate Reseller (gerçek sistem kullanıcıları)
- [x] **DNS Functions:** DNS Zone Manager (A/CNAME/MX/NS/TXT), Add/Edit DNS Zone (gerçek /etc/hosts)
- [x] **Email Functions:** Email Accounts, Create/Modify/Delete Email Account, Email Disk Usage

### 📁 FTP (gerçek vsftpd)
- [x] FTP hesapları oluşturma (vsftpd virtual user + passwd-file)
- [x] FTP hesap listeleme (disk kullanımı + bağlantı sayısı)
- [x] FTP hesap parola değiştirme
- [x] FTP hesap silme (passwd-file + dizin temizliği)
- [x] FTP bağlantıları (canlı `vsftpd` process + `ss` port monitoring)
- [x] Paket limiti kontrolü (paket FTP limiti aşılınca reddedilir)
- [x] Ekran görüntüleri: FTP Accounts, Create FTP, FTP Connections

### 📧 Webmail (Roundcube)
- [x] Roundcube 1.6.5 kurulumu (Debian repo + MariaDB backend)
- [x] nginx vhost + php8.4-fpm konfigürasyonu
- [x] IMAP/SMTP entegrasyonu (dovecot 143 + postfix 587)
- [x] cPanel "Webmail" modülü → Roundcube açılır
- [x] WHM Email Accounts tablosunda 📧 Webmail butonu
- [x] Domain bazlı webmail URL: `http://webmail.<domain>`

### 🔐 HTTPS (Self-signed SSL)
- [x] Self-signed sertifika (OpenSSL, 2048-bit RSA, 365 gün)
- [x] Node.js native HTTPS server (port 2083)
- [x] Panel + Webmail (nginx) her ikisi de SSL
- [x] Sertifika yolu: `~/ocp-panel/ssl/ocp-panel.{key,crt}` (panel kullanıcısı erişebilir)
- [x] Tarayıcı uyarısı: self-signed olduğu için "Güvenli değil" uyarısı gelir, "Gelişmiş" → "Devam et" ile geçilebilir

### 📧 E-posta (gerçek postfix + dovecot)
- [x] postfix sanal domainler (`virtual_mailbox_domains` + map'ler, panelden senkronize)
- [x] dovecot passwd-file auth — SMTP SASL (587) + IMAP (143) + POP3 (110)
- [x] maildir teslimi (`/var/mail/vhosts/<domain>/<user>/`), vmail (uid 5000)
- [x] Hesap kotası (`quota_rule` → dovecot) + paket e-posta limiti kontrolü
- [x] Kurulum scripti: `deploy/mail-stack-setup.sh`

### Frontend (cPanel X3 teması korunarak)
- [x] Login ekranı (overlay)
- [x] **System kategorisi**: Server Status, Services, Network Interfaces, System Users, Package Updates
- [x] **Gerçek modüller**: Terminal, File Manager, Cron Jobs, Process Manager, Error Logs, Disk Usage, MySQL, Resource Usage, CPU/Concurrent, Visitors, Bandwidth
- [x] Sidebar istatistikleri gerçek veriler (disk, RAM, servis, proses, docker, sıcaklık)

## 🔜 Gelecek
- [ ] Gerçek zamanlı izleme (SSE/WebSocket ile CPU/RAM grafikleri)
- [ ] Docker yönetimi (konteyner başlat/durdur/log)
- [ ] Yedekleme otomasyonu (panel üzerinden)
- [ ] Çok kullanıcılı yetkilendirme (rol bazlı)