# OCP Panel — cPanel Klonu ROADMAP

**Amaç:** cPanel'in TÜM fonksiyonlarını içeren, ocp-panel temasını referans alan tam bir kontrol paneli klonu.
**Mimari:** Statik HTML/CSS/JS (mevcut yapı korunur) — tüm veriler localStorage'da simüle edilir.

## Kategori Kapsamı (cPanel tam listesi)

### Preferences
- [x] Getting Started Wizard
- [x] Video Tutorials
- [x] Change Password
- [x] Update Contact Information
- [x] Branding Editor
- [x] Change Style
- [x] Change Language
- [x] Shortcuts
- [ ] User Manager (YENİ)
- [ ] My Account (YENİ)

### Mail
- [x] Email Accounts (kısmi — genişletilecek)
- [ ] Webmail
- [ ] BoxTrapper
- [ ] Apache SpamAssassin
- [ ] Forwarders
- [ ] Autoresponders
- [ ] Mailing Lists
- [ ] Email Deliverability
- [ ] Email Authentication (SPF/DKIM)
- [ ] Email Filters
- [ ] Global Email Filters
- [ ] Track Delivery
- [ ] Email Disk Usage
- [ ] MX Entry
- [ ] Calendars and Contacts
- [ ] Email Routing

### Files
- [x] File Manager (kısmi — genişletilecek)
- [ ] Legacy File Manager
- [x] Disk Space Usage (placeholder)
- [ ] Web Disk
- [x] FTP Accounts (kısmi)
- [ ] FTP Connections
- [ ] Backups
- [ ] Backup Wizard
- [ ] Git Version Control
- [ ] Images
- [ ] Directory Privacy

### Logs
- [ ] Latest Visitors
- [ ] Bandwidth
- [ ] Webalizer
- [ ] Errors
- [ ] Resource Usage
- [ ] CPU / Concurrent Connections
- [ ] SQL Error Logs
- [ ] Indexes

### Databases
- [x] MySQL Databases (kısmi)
- [ ] MySQL Database Wizard
- [ ] phpMyAdmin (placeholder)
- [ ] Remote MySQL
- [ ] PostgreSQL

### Domains
- [x] Subdomains (kısmi)
- [ ] Addon Domains
- [ ] Aliases
- [ ] Redirects
- [ ] Zone Editor (DNS)
- [ ] Dynamic DNS
- [ ] Domains

### Security
- [ ] SSH/Terminal Access
- [ ] SSL/TLS Status
- [ ] SSL/TLS Manager
- [ ] SSH Keys
- [ ] IP Blocker
- [ ] Hotlink Protection
- [ ] Leech Protection
- [ ] ModSecurity
- [ ] 2-Factor Authentication
- [ ] Password Protection

### Software
- [ ] Select PHP Version
- [ ] MultiPHP Manager
- [ ] MultiPHP INI Editor
- [ ] PHP PEAR Packages
- [ ] RubyGems
- [ ] Node.js Selector
- [ ] Python Selector
- [ ] Application Manager
- [ ] Optimize Website

### Advanced
- [ ] Terminal
- [ ] Cron Jobs
- [ ] Indexes
- [ ] Error Pages
- [ ] MIME Types
- [ ] Apache Handlers
- [ ] Process Manager

## Fazlar

- **Faz 1:** Mimari — tüm kategorileri + tool'ları app.js'e ekle, localStorage tabanlı simülasyon motoru (store.js), tüm tool'lar için render altyapısı
- **Faz 2:** Preferences + Mail modülleri tam
- **Faz 3:** Files + Logs modülleri tam
- **Faz 4:** Databases + Domains modülleri tam
- **Faz 5:** Security + Software + Advanced modülleri tam
- **Faz 6:** Responsive + genel polish + son commit
