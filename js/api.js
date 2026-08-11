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
  terminal(cmd, timeout) { return this.post('/terminal', { cmd, timeout: timeout || 15000 }); }
};
