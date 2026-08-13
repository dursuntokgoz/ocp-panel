/* ============================================================
 * OCP Panel — Gerçek API Katmanı
 * Backend: Node.js/Express (server/routes.js)
 * Auth: Bearer token (24 saat)
 * ============================================================ */
const PanelAPI = {
  token: null,
  base: '/api',

  /* ---------- oturum ---------- */
  init() {
    this.token = localStorage.getItem('ocp_token') || null;
    this.user = localStorage.getItem('ocp_user') || null;
    this.initSelectedReseller();
  },

  saveSession(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('ocp_token', token);
    localStorage.setItem('ocp_user', user || '');
  },

  clearSession() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('ocp_token');
    localStorage.removeItem('ocp_user');
  },

  get isAuthed() { return !!this.token; },

  async login(password) {
    const r = await fetch(this.base + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.token) throw new Error(d.error || 'Giriş başarısız');
    this.saveSession(d.token, d.user);
    return d;
  },

  async logout() {
    try { await this.post('/logout'); } catch (e) { /* yoksay */ }
    this.clearSession();
  },

  /* ---------- temel fetch ---------- */
  async request(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    const r = await fetch(this.base + url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    if (r.status === 401) {
      this.clearSession();
      location.reload();
      throw new Error('Oturum süresi doldu');
    }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
    return d;
  },

  get(url) { return this.request('GET', url); },
  post(url, body) { return this.request('POST', url, body || {}); },

  /* ---------- endpoint yardımcıları ---------- */
  stats() { return this.get('/stats'); },
  services() { return this.get('/services'); },
  serviceAction(name, action) { return this.post('/services/' + encodeURIComponent(name) + '/' + action); },
  processes() { return this.get('/processes'); },
  killProcess(pid, signal) { return this.post('/processes/kill', { pid, signal }); },
  files(path) { return this.get('/files?path=' + encodeURIComponent(path || '')); },
  readFile(path) { return this.get('/files/read?path=' + encodeURIComponent(path)); },
  writeFile(path, content) { return this.post('/files/write', { path, content }); },
  mkdir(path) { return this.post('/files/mkdir', { path }); },
  deletePath(path) { return this.post('/files/delete', { path }); },
  renamePath(path, newPath) { return this.post('/files/rename', { path, newPath }); },
  logs(unit, lines) { return this.get('/logs?unit=' + encodeURIComponent(unit || '') + '&lines=' + (lines || 200)); },
  logFile(path, lines) { return this.get('/logs/file?path=' + encodeURIComponent(path) + '&lines=' + (lines || 200)); },
  cron() { return this.get('/cron'); },
  saveCron(content) { return this.post('/cron', { content }); },
  network() { return this.get('/network'); },
  users() { return this.get('/users'); },
  disk(path) { return this.get('/disk?path=' + encodeURIComponent(path || '')); },
  mysql() { return this.get('/mysql'); },
  terminal(cmd, timeout) { return this.post('/terminal', { cmd, timeout: timeout || 15000 }); },

  /* --- WHM --- */
  getPackages() { return this.get('/packages'); },
  addPackage(pkg) { return this.post('/packages', pkg); },
  updatePackage(name, data) { return this.request('PUT', '/packages/' + encodeURIComponent(name), data); },
  deletePackage(name) { return this.request('DELETE', '/packages/' + encodeURIComponent(name)); },
  getResellers() { return this.get('/resellers'); },
  addReseller(r) { return this.post('/resellers', r); },
  updateReseller(name, data) { return this.request('PUT', '/resellers/' + encodeURIComponent(name), data); },
  deleteReseller(name) { return this.request('DELETE', '/resellers/' + encodeURIComponent(name)); },
  switchReseller(username) { return this.get('/resellers/switch/' + encodeURIComponent(username)); },

  /* --- selectedReseller state --- */
  selectedReseller: null,
  selectedDomain: null,
  setSelectedReseller(username) {
    this.selectedReseller = username || null;
    if (username) localStorage.setItem('ocp_selected_reseller', username);
    else localStorage.removeItem('ocp_selected_reseller');
  },
  setSelectedDomain(domain) {
    this.selectedDomain = domain || null;
    if (domain) localStorage.setItem('ocp_selected_domain', domain);
    else localStorage.removeItem('ocp_selected_domain');
  },
  initSelectedReseller() {
    this.selectedReseller = localStorage.getItem('ocp_selected_reseller') || null;
    this.selectedDomain = localStorage.getItem('ocp_selected_domain') || null;
  },
  ownerParam() {
    if (this.selectedDomain) return '?domain=' + encodeURIComponent(this.selectedDomain);
    if (this.selectedReseller) return '?owner=' + encodeURIComponent(this.selectedReseller);
    return '';
  },

  getDomains() { return this.get('/domains' + this.ownerParam()); },
  addDomain(d) {
    if (this.selectedReseller && !d.reseller) d.reseller = this.selectedReseller;
    return this.post('/domains', d);
  },
  switchReseller(username) { return this.get('/resellers/switch/' + encodeURIComponent(username)); },
  switchDomain(domain) { return this.get('/domains/switch/' + encodeURIComponent(domain)); },

  /* --- DNS --- */
  getDnsZones() { return this.get('/dns-zones' + this.ownerParam()); },

  /* --- Email (WHM) --- */
  getEmails(domain) {
    let qs = this.ownerParam();
    if (domain) qs += (qs ? '&' : '?') + 'domain=' + encodeURIComponent(domain);
    return this.get('/emails' + qs);
  },

  /* --- FTP (WHM) --- */
  getFtp() { return this.get('/ftp' + this.ownerParam()); },
  addFtp(data) { return this.post('/ftp', data); },
  updateFtp(user, data) { return this.request('PUT', '/ftp/' + encodeURIComponent(user), data); },
  deleteFtp(user) { return this.request('DELETE', '/ftp/' + encodeURIComponent(user)); },
  getFtpConnections() { return this.get('/ftp/connections'); },

  /* --- DOCKER --- */
  getDocker() { return this.get('/docker'); },
  dockerAction(id, action) { return this.post('/docker/' + encodeURIComponent(id) + '/' + action); },
  dockerLogs(id, lines, since) { return this.get('/docker/' + encodeURIComponent(id) + '/logs?lines=' + (lines || 100) + (since ? '&since=' + encodeURIComponent(since) : '')); },
  dockerStats(id) { return this.get('/docker/' + encodeURIComponent(id) + '/stats'); }
};