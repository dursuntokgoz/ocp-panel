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

---

## ✨ Özellikler

### 🗄️ Backend API (18 uç)
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

### 🖥️ Frontend Modülleri
- **System:** Server Status, Services (systemd), Network Interfaces, System Users, Package Updates
- **Gerçek veriyle çalışanlar:** Terminal, File Manager, Process Manager, Cron Jobs, Error Logs, Disk Usage, MySQL, Resource Usage, CPU/Concurrent, Visitors, Bandwidth
- **Tema korumalı simülasyon modülleri:** Mail, Domains, Security, Software kategorileri (cPanel klonu olarak)
- Canlı sidebar istatistikleri: disk, RAM, çalışan servis, proses, docker, sıcaklık
- Arama, kategori aç/kapa, light/dark tema

---

## 🚀 Kurulum

### Gereksinimler
- Linux (Debian/Ubuntu test edildi — Raspberry Pi 5 ✓)
- Node.js ≥ 18
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
- [ ] Gerçek zamanlı grafikler (WebSocket/SSE)
- [ ] Docker yönetim modülü
- [ ] nginx/PHP vhost yönetimi
- [ ] HTTPS (self-signed)
- [ ] Rol bazlı çok kullanıcı

---

## 📄 Lisans
MIT — özgürce kullanın, geliştirin, dağıtın.

**Test edilen donanım:** Raspberry Pi 5 · Debian 12 · Node v22 · 8GB RAM
