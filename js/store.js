/* ============================================================
 * OCP Panel — Veri Katmanı (localStorage simülasyon motoru)
 * Tüm OCP Panel modülleri için kalıcı veri yönetimi.
 * ============================================================ */
const X3Store = {
  KEY: 'ocp_panel_data_v1',

  defaults() {
    return {
      account: {
        user: 'dursun',
        domain: 'dursun.co.uk',
        email: 'adam@dursun.co.uk',
        contact: 'adam@dursun.co.uk',
        phone: '+44 7911 123456',
        diskUsed: 1450,          // MB
        diskQuota: 10240,        // MB (10 GB)
        bandwidthUsed: 3245,     // MB
        bandwidthQuota: 51200,   // MB (50 GB)
        createdAt: '2023-04-12',
        language: 'Turkish',
        theme: 'light',
        brandName: 'OCP Panel',
        twoFactor: false,
      },
      emails: [
        { id: 1, user: 'adam',    domain: 'dursun.co.uk', quota: 1000, used: 142.5, status: 'active',  forward: '' },
        { id: 2, user: 'info',    domain: 'dursun.co.uk', quota: 500,  used: 87.2,  status: 'active',  forward: '' },
        { id: 3, user: 'support', domain: 'dursun.co.uk', quota: 500,  used: 12.0,  status: 'active',  forward: 'adam@dursun.co.uk' },
        { id: 4, user: 'billing', domain: 'dursun.co.uk', quota: 250,  used: 0.4,   status: 'suspended', forward: '' },
      ],
      forwarders: [
        { id: 1, from: 'support@dursun.co.uk', to: 'adam@dursun.co.uk', status: 'active' },
        { id: 2, from: 'webmaster@dursun.co.uk', to: 'adam@dursun.co.uk', status: 'active' },
      ],
      autoresponders: [
        { id: 1, email: 'info@dursun.co.uk', subject: 'Teşekkürler', body: 'Mesajınız alındı, en kısa sürede dönüş yapacağız.', status: 'active' },
      ],
      mailFilters: [
        { id: 1, name: 'Spam engelle', rules: 'Konu "viagra" içeriyor → Sil', status: 'active' },
      ],
      ftpAccounts: [
        { id: 1, user: 'ftpuser1', dir: '/home/dursun/public_html', quota: 1024, used: 210, status: 'active' },
      ],
      files: [
        { id: 1, name: 'index.html',  path: '/public_html', size: '8.2 KB',  type: 'file', modified: '2024-01-15' },
        { id: 2, name: 'about.html',  path: '/public_html', size: '12.4 KB', type: 'file', modified: '2024-02-02' },
        { id: 3, name: 'assets',      path: '/public_html', size: '—',       type: 'dir',  modified: '2024-01-20' },
        { id: 4, name: 'blog',        path: '/public_html', size: '—',       type: 'dir',  modified: '2024-03-11' },
        { id: 5, name: '.htaccess',   path: '/public_html', size: '1.1 KB',  type: 'file', modified: '2024-03-05' },
        { id: 6, name: 'robots.txt',  path: '/public_html', size: '0.3 KB',  type: 'file', modified: '2024-02-18' },
        { id: 7, name: 'backup_2024.tar.gz', path: '/',     size: '248 MB',  type: 'file', modified: '2024-03-30' },
      ],
      databases: [
        { id: 1, name: 'dursun_blog',    user: 'dursun_admin', size: '12.4 MB', collation: 'utf8mb4_general_ci', tables: 24 },
        { id: 2, name: 'dursun_portal',  user: 'dursun_admin', size: '2.10 MB', collation: 'utf8mb4_general_ci', tables: 8 },
      ],
      dbUsers: [
        { id: 1, user: 'dursun_admin', host: 'localhost', priv: 'ALL PRIVILEGES' },
      ],
      subdomains: [
        { id: 1, prefix: 'blog',  domain: 'dursun.co.uk', root: '/home/dursun/public_html/blog',  redirect: '', status: 'active' },
        { id: 2, prefix: 'shop',  domain: 'dursun.co.uk', root: '/home/dursun/public_html/shop',  redirect: '', status: 'active' },
        { id: 3, prefix: 'mail',  domain: 'dursun.co.uk', root: '/home/dursun/public_html',        redirect: 'mail.dursun.co.uk', status: 'active' },
      ],
      addonDomains: [
        { id: 1, domain: 'dursun.net', root: '/home/dursun/public_html/net', redirect: '', status: 'active' },
      ],
      aliases: [
        { id: 1, domain: 'dursun.org', redirect: 'dursun.co.uk', status: 'active' },
      ],
      redirects: [
        { id: 1, from: '/old-page', to: 'https://dursun.co.uk/new-page', type: '301', status: 'active' },
      ],
      dnsRecords: [
        { id: 1, type: 'A',     name: '@',    ttl: '14400', value: '185.199.108.153',   priority: '' },
        { id: 2, type: 'CNAME', name: 'www',  ttl: '14400', value: 'dursun.co.uk',     priority: '' },
        { id: 3, type: 'MX',    name: '@',    ttl: '14400', value: 'mail.dursun.co.uk', priority: '10' },
        { id: 4, type: 'TXT',   name: '@',    ttl: '14400', value: 'v=spf1 include:spf.dursun.co.uk ~all', priority: '' },
        { id: 5, type: 'TXT',   name: 'default._domainkey', ttl: '14400', value: 'v=DKIM1; k=rsa; p=MIGfMA0G...', priority: '' },
        { id: 6, type: 'CNAME', name: 'blog', ttl: '14400', value: 'dursun.co.uk', priority: '' },
      ],
      cronJobs: [
        { id: 1, minute: '0',  hour: '3', day: '*', month: '*', weekday: '*', cmd: '/usr/bin/php /home/dursun/public_html/cron.php', status: 'active' },
        { id: 2, minute: '*/5', hour: '*', day: '*', month: '*', weekday: '*', cmd: '/usr/bin/find /tmp -type f -mtime +7 -delete', status: 'active' },
      ],
      ssl: {
        status: 'active',
        type: 'AutoSSL (OCP Panel)',
        issuer: 'Let\'s Encrypt',
        expires: '2024-06-15',
        certs: [
          { domain: 'dursun.co.uk',      status: 'active', expires: '2024-06-15' },
          { domain: 'www.dursun.co.uk',  status: 'active', expires: '2024-06-15' },
          { domain: 'blog.dursun.co.uk', status: 'active', expires: '2024-06-15' },
        ],
      },
      ipBlocker: [
        { id: 1, ip: '192.168.1.100', status: 'blocked' },
        { id: 2, ip: '10.0.0.55',     status: 'blocked' },
      ],
      hotlinkProtected: { enabled: true, urls: ['https://dursun.co.uk'], extensions: ['jpg', 'png', 'gif'] },
      modSecurity: { enabled: true, rules: 48213 },
      phpVersion: '8.2.7',
      phpSettings: {
        memory_limit: '256M', max_execution_time: '120', upload_max_filesize: '64M',
        post_max_size: '72M', max_input_vars: '5000', date_timezone: 'Europe/Istanbul',
      },
      visitors: [
        { ip: '78.176.55.201', date: '2024-04-01', time: '14:32:11', url: '/index.html',  ref: 'direct', ua: 'Chrome/122', code: 200, bytes: '8.2 KB' },
        { ip: '88.241.90.14',  date: '2024-04-01', time: '14:28:45', url: '/blog/post',   ref: 'google.com', ua: 'Firefox/123', code: 200, bytes: '24 KB' },
        { ip: '185.199.108.1', date: '2024-04-01', time: '14:25:02', url: '/robots.txt',  ref: 'direct', ua: 'Googlebot/2.1', code: 200, bytes: '0.3 KB' },
        { ip: '95.70.44.18',   date: '2024-04-01', time: '14:20:55', url: '/index.html',  ref: 'facebook.com', ua: 'Safari/17.4', code: 200, bytes: '8.2 KB' },
        { ip: '31.223.4.77',   date: '2024-04-01', time: '14:11:30', url: '/404.html',    ref: 'direct', ua: 'Edge/122', code: 404, bytes: '1.2 KB' },
      ],
      errorLogs: [
        { date: '2024-04-01', time: '14:11:30', type: 'error',   msg: '[client 31.223.4.77] File does not exist: /home/dursun/public_html/404.html' },
        { date: '2024-04-01', time: '13:45:02', type: 'warning', msg: '[client 95.70.44.18] Directory index forbidden by Options directive' },
        { date: '2024-04-01', time: '12:02:17', type: 'error',   msg: '[client 78.176.55.201] script not found or unable to stat' },
      ],
      sessions: [
        { id: 1, ip: '78.176.55.201', user: 'adam', type: 'SSH', started: '2024-04-01 09:00', idle: '2m 14s' },
      ],
      processes: [
        { pid: 1821, user: 'dursun', cpu: '0.5%', mem: '1.2%', cmd: '/usr/local/bin/php /home/dursun/public_html/cron.php' },
        { pid: 2011, user: 'dursun', cpu: '0.1%', mem: '0.8%', cmd: '/usr/sbin/apache2 -k start' },
      ],
      tasks: [
        { id: 1, label: 'E-posta hesabı kur', done: true },
        { id: 2, label: 'SSL sertifikası etkinleştir', done: true },
        { id: 3, label: 'İlk web sitesini yayınla', done: false },
        { id: 4, label: 'Domaini bağla', done: false },
      ],
      backups: [
        { id: 1, name: 'home.tar.gz',      size: '248 MB', date: '2024-03-30', status: 'complete' },
        { id: 2, name: 'mysql_full.sql',   size: '14.5 MB', date: '2024-03-30', status: 'complete' },
        { id: 3, name: 'home.tar.gz',      size: '241 MB', date: '2024-03-15', status: 'complete' },
      ],
    };
  },

  /* --- Temel CRUD --- */
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaults();
      const data = JSON.parse(raw);
      return { ...this.defaults(), ...data };
    } catch (e) {
      return this.defaults();
    }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  get() { return this.load(); },

  /* --- Koleksiyon yardımcıları --- */
  list(key) {
    const d = this.load();
    return d[key] || [];
  },

  add(key, item) {
    const d = this.load();
    if (!d[key]) d[key] = [];
    item.id = Date.now();
    d[key].push(item);
    this.save(d);
    return item;
  },

  update(key, id, patch) {
    const d = this.load();
    if (!d[key]) return null;
    const idx = d[key].findIndex(x => x.id === id);
    if (idx === -1) return null;
    d[key][idx] = { ...d[key][idx], ...patch };
    this.save(d);
    return d[key][idx];
  },

  remove(key, id) {
    const d = this.load();
    if (!d[key]) return false;
    const before = d[key].length;
    d[key] = d[key].filter(x => x.id !== id);
    this.save(d);
    return d[key].length < before;
  },

  toggleStatus(key, id) {
    const d = this.load();
    const item = (d[key] || []).find(x => x.id === id);
    if (!item) return null;
    item.status = item.status === 'active' ? 'suspended' : 'active';
    this.save(d);
    return item;
  },

  /* --- Tekil alanlar --- */
  getAccount() { return this.load().account; },
  saveAccount(patch) {
    const d = this.load();
    d.account = { ...d.account, ...patch };
    this.save(d);
    return d.account;
  },

  reset() {
    localStorage.removeItem(this.KEY);
    return this.defaults();
  },

  /* --- İstatistikler --- */
  diskPercent() {
    const a = this.getAccount();
    return Math.min(100, Math.round((a.diskUsed / a.diskQuota) * 100));
  },
  bandwidthPercent() {
    const a = this.getAccount();
    return Math.min(100, Math.round((a.bandwidthUsed / a.bandwidthQuota) * 100));
  },
};
