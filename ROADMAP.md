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

### Frontend (cPanel X3 teması korunarak)
- [x] Login ekranı (overlay)
- [x] **System kategorisi**: Server Status, Services, Network Interfaces, System Users, Package Updates
- [x] **Gerçek modüller**: Terminal, File Manager, Cron Jobs, Process Manager, Error Logs, Disk Usage, MySQL, Resource Usage, CPU/Concurrent, Visitors, Bandwidth
- [x] Sidebar istatistikleri gerçek veriler (disk, RAM, servis, proses, docker, sıcaklık)

## 🔜 Gelecek
- [ ] Gerçek zamanlı izleme (SSE/WebSocket ile CPU/RAM grafikleri)
- [ ] PHP/nginx site yönetimi (vhost oluşturma)
- [ ] Docker yönetimi (konteyner başlat/durdur/log)
- [ ] Yedekleme otomasyonu (panel üzerinden)
- [ ] Çok kullanıcılı yetkilendirme (rol bazlı)
- [ ] HTTPS (self-signed sertifika ile 2083'te SSL)
