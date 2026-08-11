# 🖥️ OCP Panel — Gerçek Sunucu Kontrol Paneli

**cPanel X3 teması ile gerçek bir sunucu yönetim paneli** — Node.js/Express backend, tarayıcıdan sistem yönetimi.

Panel, klasik cPanel X3 arayüzünü birebir taklit eder; ancak arkasında **gerçek bir backend** vardır: dosyalar, servisler, prosesler, cron, loglar, ağ ve MySQL — hepsi **gerçek sistem verileriyle** çalışır.

---

## 📸 Ekran Görüntüleri

| Giriş Ekranı | Dashboard |
|---|---|
| ![Login](screenshots/login.png) | ![Dashboard](screenshots/dashboard.png) |

| Server Status | Terminal |
|---|---|
| ![Server Status](screenshots/server-status.png) | ![Terminal](screenshots/terminal.png) |

| File Manager | Services |
|---|---|
| ![File Manager](screenshots/file-manager.png) | ![Services](screenshots/services.png) |

| Domain Manager | Reseller Manager |
|---|---|
| ![Domain Manager](screenshots/domain-manager.png) | ![Reseller Manager](screenshots/reseller-manager.png) |

| Hosting Packages |
|---|
| ![Hosting Packages](screenshots/hosting-packages.png) |

| List Accounts (WHM) | Reseller Center (WHM) |
|---|---|
| ![List Accounts](screenshots/whm-list-accounts.png) | ![Reseller Center](screenshots/whm-reseller-center.png) |

| DNS Zone Manager (WHM) | Email Accounts (WHM) |
|---|---|
| ![DNS Zone Manager](screenshots/whm-dns-zones.png) | ![Email Accounts](screenshots/whm-email-accounts.png) |

| Create Email Account (WHM) | Email Disk Usage (WHM) |
|---|---|
| ![Create Email](screenshots/whm-email-create.png) | ![Email Disk](screenshots/whm-email-disk.png) |

| FTP Accounts (WHM) | Create FTP Account (WHM) |
|---|---|
| ![FTP Accounts](screenshots/whm-ftp-accounts.png) | ![Create FTP](screenshots/whm-ftp-create.png) |

| FTP Connections (WHM) |
|---|
| ![FTP Connections](screenshots/whm-ftp-connections.png) |

---

## ✨ Özellikler

### 🗄️ Backend API (24 uç)
| Endpoint | Açıklama |
|---|---|
| `POST /api/login` | Parola ile oturum → Bearer token (24 saat) |
| `GET /api/stats` | CPU, RAM, disk, sıcaklık, uptime, load, servis/proses/docker sayıları |
| `GET /api/services` | systemd servis listesi (122+ servis) |
| `POST /api/services/:name/:action` | `start` / `stop` / `restart` / `reload` / `enable` / `disable` (sudo) |
| `GET /api/processes` | Proses listesi (CPU'ya göre sıralı) |
| `POST /api/processes/kill` | Proses sonlandırma (SIGTERM) |
| `GET /api/files?path=` | Dizin listeleme (boyut, izin, mtime) |
| `GET /api/files/read` | Dosya içeriği (5MB limit) |
| `POST /api/files/write` | Dosya yazma |
| `POST /api/files/mkdir` | Klasör oluşturma |
| `POST /api/files/delete` | Dosya/klasör silme |
| `POST /api/files/rename` | Yeniden adlandırma |
| `GET /api/logs?unit=` | journalctl (servis bazlı, 2000 satıra kadar) |
| `GET /api/logs/file?path=` | Log dosyası kuyruğu (tail) |
| `GET /api/cron` + `POST /api/cron` | Gerçek crontab okuma/yazma |
| `GET /api/network` | Ağ arayüzleri, dinleyen portlar, route tablosu |
| `GET /api/users` | Sistem kullanıcıları + aktif oturumlar |
| `GET /api/disk?path=` | `du` analizi + `df` bölümleri |
| `GET /api/mysql` | MariaDB durumu + veritabanı listesi |
| `POST /api/terminal` | Gerçek shell komutu çalıştırma (60s limit) |
| `GET/POST /api/packages` | Hosting paketleri CRUD |
| `PUT/DELETE /api/packages/:name` | Paket düzenle/sil (kullanımdaki paket silinemez) |
| `GET/POST /api/resellers` | Reseller (sistem kullanıcısı) CRUD |
| `PUT/DELETE /api/resellers/:name` | Reseller düzenle/sil (cascade domain temizliği) |
| `GET/POST /api/domains` | Domain CRUD — nginx vhost + /etc/hosts + reload |
| `PUT/DELETE /api/domains/:name` | Domain düzenle/sil |
| `GET /api/dns-zones` | Tüm zone'lar: A, CNAME, MX, NS, TXT kayıtları |
| `PUT /api/dns-zones/:domain` | A kaydı IP güncelle → gerçek /etc/hosts değişikliği |
| `GET /api/emails?domain=` | E-posta hesapları (maildir boyutu, kota, tarih) + domain filtresi |
| `POST /api/emails` | E-posta hesabı oluştur → dovecot passwd-file + maildir + postfix maps |
| `PUT /api/emails/:email` | Parola / kota değiştir (dovecot auth anında etkili) |
| `DELETE /api/emails/:email` | Hesap + maildir silme |
| `GET /api/ftp-accounts` | FTP hesapları (disk kullanımı + bağlantı sayısı) |
| `POST /api/ftp-accounts` | FTP hesabı oluştur → vsftpd passwd-file |
| `PUT /api/ftp-accounts/:user` | Parola değiştir |
| `DELETE /api/ftp-accounts/:user` | FTP hesabı silme (passwd-file + dizin) |
| `GET /api/ftp-connections` | Canlı FTP bağlantıları (process + port monitoring) |

### 🖥️ Frontend Modülleri
- **WHM (WebHost Manager) — gerçek WHM menü yapısı:**
  - **Home:** Server Status, Services, Network Interfaces, System Users, Package Updates
  - **Account Functions:** Create a New Account, List Accounts, Modify an Account, Terminate an Account
  - **Packages:** Add a Package, Edit a Package, Delete a Package, List Packages
  - **Resellers:** Reseller Center, Create a Reseller, Reseller Modification, Terminate a Reseller
  - **DNS Functions:** DNS Zone Manager, Add a DNS Zone, Edit DNS Zone
  - **Email Functions:** Email Accounts, Create an Email Account, Modify Email Account, Delete Email Account, Email Disk Usage
  - **FTP Functions:** FTP Accounts, Create FTP Account, Modify FTP Account, Delete FTP Account, FTP Connections
- **Gerçek veriyle çalışan cPanel modülleri:** Terminal, File Manager, Process Manager, Cron Jobs, Error Logs, Disk Usage, MySQL, Resource Usage, CPU/Concurrent, Visitors, Bandwidth
- **Tema korumalı simülasyon modülleri:** Mail, Domains, Security, Software kategorileri (cPanel klonu olarak)
- Canlı sidebar istatistikleri: disk, RAM, çalışan servis, proses, docker, sıcaklık
- Arama, kategori aç/kapa, light/dark tema

### 🌍 WHM — Domain / Reseller / Paket Yönetimi
- **Domain ekleme/silme/düzenleme:** nginx vhost otomatik oluşturulur (`sites-available` + symlink), `/etc/hosts` güncellenir, nginx reload edilir
- **Reseller oluşturma:** gerçek sistem kullanıcısı (`useradd` + parola), `public_html` dizini, paket atama
- **Reseller silme:** kullanıcı + ev dizini + tüm domain'leri (vhost + hosts) temizlenir
- **Hosting paketleri:** disk (GB), domain sayısı, e-posta sayısı, bant genişliği, fiyat
- **Kota kontrolü:** domain sayısı paket limitini aşınca ekleme reddedilir; disk kullanımı `du` ile canlı izlenir
- **Veri deposu:** `~/.config/ocp-panel/data.json`

### 📧 WHM — Email Functions (gerçek postfix + dovecot)
- **Gerçek mail yığını:** postfix (sanal domainler) + dovecot (IMAP/POP3) + maildir depolama
- **Hesap oluşturma:** passwd-file'a `{PLAIN}` kayıt, maildir (`cur/new/tmp`) otomatik, postfix `virtual_domains` + `virtual_mailbox` map'leri senkronize
- **SMTP AUTH:** 587/submission portu dovecot SASL socket'i ile çalışır (`AUTH PLAIN`)
- **IMAP/POP3:** 143/110 portları, dovecot passwd-file auth (`user@domain`)
- **Kota:** hesap başına MB kotası → dovecot `quota_rule` ekstra alanı + panelde doluluk çubuğu
- **Paket limiti:** paketteki `emails` sayısı aşılınca yeni hesap reddedilir (ör. Bronze: 5)
- **Parola değişimi:** anında etkili (passwd-file yeniden yazılır, eski parola reddedilir)
- **E-posta silme:** hesap + maildir + postfix maps temizlenir
- **SMTP gönderim:** aynı sunucudan doğrudan teslim (`virtual_transport`), MX kaydı DNS zone'da hazır

### 📧 WHM — Webmail (Roundcube)
- **Gerçek webmail arayüzü:** Roundcube 1.6.5 (Debian repo) + nginx + php-fpm
- **IMAP/SMTP entegrasyonu:** dovecot IMAP (143) + postfix SMTP (587) — `%u`/`%p` ile panel hesaplarıyla otomatik login
- **cPanel Mail kategorisi:** "Webmail" butonu → yeni sekmede Roundcube açılır
- **WHM Email Accounts:** her hesabın yanında 📧 Webmail butonu → o domain'in Roundcube'u açılır
- **Domain bazlı:** `http://webmail.<domain>` (ör. `webmail.musteri.com`) — panel domain sistemine entegre
- **Kurulum:** `apt install roundcube roundcube-mysql php8.4-fpm php8.4-mysql php8.4-intl php8.4-mbstring php8.4-xml php8.4-curl`

### 📁 WHM — FTP Functions (gerçek vsftpd)
- **Gerçek FTP sunucusu:** vsftpd virtual user modu (passwd-file auth)
- **Hesap oluşturma:** vsftpd passwd-file'a kayıt, FTP kök dizini otomatik (`/home/ftp/<user>`)
- **Parola değişimi:** anında etkili (passwd-file yeniden yazılır)
- **Hesap silme:** passwd-file kaydı + FTP dizini temizlenir
- **Disk kullanımı:** `du` ile canlı hesap başına doluluk
- **Bağlantı izleme:** canlı `vsftpd` process'leri + `ss` ile aktif FTP bağlantıları
- **Paket limiti:** paketteki FTP limiti aşılınca yeni hesap reddedilir

---

## 🚀 Kurulum

### Gereksinimler
- Linux (Debian/Ubuntu test edildi — Raspberry Pi 5 ✓)
- Node.js ≥ 18
- nginx (domain/vhost yönetimi için — `sudo apt install nginx`)
- postfix + dovecot (e-posta yönetimi için — `sudo apt install postfix dovecot-imapd dovecot-pop3d`)
- vsftpd (FTP hesap yönetimi için — `sudo apt install vsftpd`)
- php8.4-fpm + php-mysql + php-intl + php-mbstring + php-xml + php-curl (Roundcube webmail için)
- OpenSSL (self-signed SSL için — `sudo apt install openssl`)
- sudo yetkisi (servis yönetimi için)

### 1. Klon ve bağımlılıklar
```bash
git clone https://github.com/dursuntokgoz/ocp-panel.git
cd ocp-panel
npm install
```

### 2. Çalıştır
```bash
npm start
# → http://SUNUCU_IP:2083
```

İlk çalıştırmada parola otomatik üretilir ve konsola yazılır:
```
Parola  : 4f9a2c1b
Dosya   : ~/.config/ocp-panel/password
```

Parolayı değiştirmek için:
```bash
echo "yeni-parola" > ~/.config/ocp-panel/password
```

### 3. systemd servisi (kalıcı çalıştırma)
```bash
sudo cp deploy/ocp-panel.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ocp-panel
```

Port değiştirmek için: `PORT=8080 npm start` veya servis dosyasında `Environment=PORT=8080`.

---

## 🔐 Güvenlik
- Tüm API uçları **Bearer token** gerektirir (24 saat geçerli, `crypto` ile üretilir)
- Parola `~/.config/ocp-panel/password` dosyasında (0600 izin) saklanır
- Terminal komutları mevcut kullanıcı (`dursun`) olarak çalışır — sudo gerektiren komutlar panel kullanıcısının sudo yetkisine bağlıdır
- Servis aksiyonları beyaz listededir (`start|stop|restart|reload|enable|disable`)
- Dosya yolları `path.resolve` ile normalize edilir; komut enjeksiyonu için servis adı regex ile doğrulanır

> 💡 İnternete açık kullanım için arkasına bir reverse proxy (nginx) + HTTPS önerilir.

---

## 📁 Proje Yapısı
```
ocp-panel/
├── server/
│   ├── server.js        # Express ana sunucu + auth + parola yönetimi
│   └── routes.js        # 18 API ucu (tüm sistem komutları)
├── js/
│   ├── app.js           # Router, kategoriler, tema, arama
│   ├── api.js           # Frontend API katmanı (fetch + token)
│   ├── real.js          # 17 gerçek modül (System + override'lar)
│   ├── subpages.js      # cPanel klonu simülasyon modülleri
│   ├── store.js         # localStorage veri katmanı (simülasyon)
│   └── icons.js         # SVG ikon seti
├── css/styles.css       # cPanel X3 teması
├── index.html           # Ana sayfa + login overlay
├── deploy/
│   └── ocp-panel.service  # systemd birimi
└── screenshots/         # Ekran görüntüleri
```

---

## 🛣️ Yol Haritası
- [x] Token tabanlı auth
- [x] Gerçek sistem API'leri (18 uç)
- [x] Terminal, File Manager, Services, Process, Cron, Logs, Network, MySQL
- [x] systemd entegrasyonu
- [x] WHM: hesap/reseller/paket/DNS yönetimi (nginx vhost + /etc/hosts)
- [x] WHM: e-posta hesapları (postfix + dovecot, SMTP AUTH, IMAP/POP3, kota)
- [ ] Gerçek zamanlı grafikler (WebSocket/SSE)
- [x] FTP hesapları (vsftpd)
- [x] Webmail (Roundcube)
- [x] HTTPS (self-signed SSL)

---

## 📄 Lisans
MIT — özgürce kullanın, geliştirin, dağıtın.

**Test edilen donanım:** Raspberry Pi 5 · Debian 12 · Node v22 · 8GB RAM
