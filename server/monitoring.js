/* ============================================================
 * OCP Panel — Monitoring & Alerting Module
 * Prometheus metrics + Grafana dashboard + Alerting (Telegram/Email/Slack)
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = ({ run, sudo, auth }) => {
  const router = require('express').Router();
  const DATA_FILE = path.join(os.homedir(), '.config', 'ocp-panel', 'monitoring.json');
  const PROMETHEUS_DIR = '/etc/prometheus';
  const GRAFANA_DIR = '/etc/grafana';
  const ALERTMANAGER_DIR = '/etc/alertmanager';

  /* ---------- veri deposu ---------- */
  function loadDB() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (e) { return { alerts: [], channels: [], dashboards: [], settings: { prometheusUrl: 'http://localhost:9090', grafanaUrl: 'http://localhost:3000' } }; }
  }

  function saveDB(db) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }

  /* ---------- Prometheus Metrics ---------- */
  const client = require('prom-client');
  const register = new client.Registry();
  
  // Default metrics
  client.collectDefaultMetrics({ register, prefix: 'ocp_' });
  
  // Custom metrics
  const httpRequestsTotal = new client.Counter({
    name: 'ocp_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
  });
  
  const httpRequestDuration = new client.Histogram({
    name: 'ocp_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
  });
  
  const activeUsers = new client.Gauge({
    name: 'ocp_active_users',
    help: 'Currently active users',
    registers: [register],
  });
  
  const systemMetrics = new client.Gauge({
    name: 'ocp_system_metrics',
    help: 'System metrics',
    labelNames: ['metric'],
    registers: [register],
  });

  /* ---------- Middleware for metrics ---------- */
  function metricsMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
      httpRequestDuration.observe({ method: req.method, route }, duration);
    });
    next();
  }

  router.use(metricsMiddleware);

  /* ==========================================================
   * PROMETHEUS METRICS ENDPOINT
   * ========================================================== */
  router.get('/metrics', auth, async (req, res) => {
    try {
      // Sistem metriklerini güncelle
      const mem = require('os').totalmem();
      const memFree = require('os').freemem();
      systemMetrics.set({ metric: 'memory_total' }, mem);
      systemMetrics.set({ metric: 'memory_free' }, memFree);
      systemMetrics.set({ metric: 'memory_used_percent' }, ((mem - memFree) / mem) * 100);
      systemMetrics.set({ metric: 'load_1' }, require('os').loadavg()[0]);
      systemMetrics.set({ metric: 'load_5' }, require('os').loadavg()[1]);
      systemMetrics.set({ metric: 'uptime' }, require('os').uptime());
      
      const metrics = await register.metrics();
      res.set('Content-Type', register.contentType);
      res.send(metrics);
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  /* ==========================================================
   * PROMETHEUS SCRAPE CONFIG
   * ========================================================== */
  router.get('/monitoring/prometheus/config', auth, (req, res) => {
    const config = {
      global: {
        scrape_interval: '15s',
        evaluation_interval: '15s',
      },
      scrape_configs: [
        {
          job_name: 'ocp-panel',
          static_configs: [{
            targets: ['localhost:2083'],
            labels: { service: 'ocp-panel' }
          }]
        },
        {
          job_name: 'node-exporter',
          static_configs: [{
            targets: ['localhost:9100'],
            labels: { service: 'node-exporter' }
          }]
        },
        {
          job_name: 'nginx',
          static_configs: [{
            targets: ['localhost:9113'],
            labels: { service: 'nginx' }
          }]
        },
        {
          job_name: 'mysql-exporter',
          static_configs: [{
            targets: ['localhost:9104'],
            labels: { service: 'mysql' }
          }]
        },
        {
          job_name: 'docker',
          static_configs: [{
            targets: ['localhost:9323'],
            labels: { service: 'docker' }
          }]
        }
      ]
    };
    res.json({ ok: true, config });
  });

  /* ==========================================================
   * ALERT RULES
   * ========================================================== */
  router.get('/monitoring/alerts', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, alerts: db.alerts || [], channels: db.channels || [] });
  });

  router.post('/monitoring/alerts', auth, (req, res) => {
    const b = req.body || {};
    const errors = [];
    if (!b.name) errors.push('Alert adı gerekli');
    if (!b.expr) errors.push('Prometheus expression gerekli');
    if (!b.severity || !['critical', 'warning', 'info'].includes(b.severity)) {
      errors.push('Severity: critical/warning/info');
    }
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });
    
    const db = loadDB();
    const alert = {
      id: Date.now(),
      name: b.name,
      expr: b.expr,
      severity: b.severity,
      for: b.for || '5m',
      labels: b.labels || {},
      annotations: b.annotations || { summary: b.name },
      enabled: b.enabled !== false,
      created: new Date().toISOString(),
    };
    
    db.alerts = db.alerts || [];
    db.alerts.push(alert);
    saveDB(db);
    
    // Prometheus alert rule dosyasını güncelle
    updatePrometheusAlertRules(db.alerts);
    
    res.json({ ok: true, alert, message: 'Alert kuralı eklendi' });
  });

  router.delete('/monitoring/alerts/:id', auth, (req, res) => {
    const id = parseInt(req.params.id);
    const db = loadDB();
    db.alerts = (db.alerts || []).filter(a => a.id !== id);
    saveDB(db);
    updatePrometheusAlertRules(db.alerts);
    res.json({ ok: true, message: 'Alert kuralı silindi' });
  });

  function updatePrometheusAlertRules(alerts) {
    const rulesDir = path.join(PROMETHEUS_DIR, 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });
    
    let content = 'groups:\n';
    content += '  - name: ocp-panel-alerts\n';
    content += '    rules:\n';
    
    for (const alert of alerts) {
      if (!alert.enabled) continue;
      content += `      - alert: ${alert.name}\n`;
      content += `        expr: ${alert.expr}\n`;
      content += `        for: ${alert.for}\n`;
      content += `        labels:\n`;
      content += `          severity: ${alert.severity}\n`;
      for (const [k, v] of Object.entries(alert.labels || {})) {
        content += `          ${k}: "${v}"\n`;
      }
      content += `        annotations:\n`;
      for (const [k, v] of Object.entries(alert.annotations || {})) {
        content += `          ${k}: "${v}"\n`;
      }
    }
    
    fs.writeFileSync(path.join(rulesDir, 'ocp-panel.yml'), content);
  }

  /* ==========================================================
   * NOTIFICATION CHANNELS (Telegram/Email/Slack/Webhook)
   * ========================================================== */
  router.post('/monitoring/channels', auth, (req, res) => {
    const b = req.body || {};
    const errors = [];
    if (!b.name) errors.push('Kanal adı gerekli');
    if (!b.type || !['telegram', 'email', 'slack', 'webhook', 'pagerduty'].includes(b.type)) {
      errors.push('Geçersiz kanal tipi');
    }
    if (b.type === 'telegram' && (!b.botToken || !b.chatId)) {
      errors.push('Telegram için botToken ve chatId gerekli');
    }
    if (b.type === 'email' && !b.email) {
      errors.push('Email için email adresi gerekli');
    }
    if (b.type === 'slack' && !b.webhookUrl) {
      errors.push('Slack için webhookUrl gerekli');
    }
    if (b.type === 'webhook' && !b.url) {
      errors.push('Webhook için URL gerekli');
    }
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });
    
    const db = loadDB();
    const channel = {
      id: Date.now(),
      name: b.name,
      type: b.type,
      config: b.config || {},
      enabled: b.enabled !== false,
      created: new Date().toISOString(),
    };
    
    db.channels = db.channels || [];
    db.channels.push(channel);
    saveDB(db);
    
    // Alertmanager config'ini güncelle
    updateAlertmanagerConfig(db.channels);
    
    res.json({ ok: true, channel, message: 'Bildirim kanalı eklendi' });
  });

  router.delete('/monitoring/channels/:id', auth, (req, res) => {
    const id = parseInt(req.params.id);
    const db = loadDB();
    db.channels = (db.channels || []).filter(c => c.id !== id);
    saveDB(db);
    updateAlertmanagerConfig(db.channels);
    res.json({ ok: true, message: 'Bildirim kanalı silindi' });
  });

  function updateAlertmanagerConfig(channels) {
    const configDir = ALERTMANAGER_DIR;
    fs.mkdirSync(configDir, { recursive: true });
    
    let config = `global:\n  resolve_timeout: 5m\n\n`;
    config += `route:\n  group_by: ['alertname', 'severity']\n  group_wait: 30s\n  group_interval: 5m\n  repeat_interval: 4h\n  receiver: 'default'\n\n`;
    config += `receivers:\n`;
    
    const enabledChannels = channels.filter(c => c.enabled);
    if (enabledChannels.length === 0) {
      config += `  - name: 'default'\n    webhook_configs:\n      - url: 'http://localhost:2083/api/monitoring/webhook'\n`;
    } else {
      for (const ch of enabledChannels) {
        config += `  - name: '${ch.name}'\n`;
        switch (ch.type) {
          case 'telegram':
            config += `    telegram_configs:\n      - bot_token: '${ch.config.botToken}'\n        chat_id: ${ch.config.chatId}\n        parse_mode: 'HTML'\n`;
            break;
          case 'email':
            config += `    email_configs:\n      - to: '${ch.config.email}'\n        send_resolved: true\n`;
            break;
          case 'slack':
            config += `    slack_configs:\n      - api_url: '${ch.config.webhookUrl}'\n        channel: '${ch.config.channel || '#alerts'}'\n        send_resolved: true\n`;
            break;
          case 'webhook':
            config += `    webhook_configs:\n      - url: '${ch.config.url}'\n`;
            break;
          case 'pagerduty':
            config += `    pagerduty_configs:\n      - service_key: '${ch.config.serviceKey}'\n`;
            break;
        }
      }
      
      config += `\nroute:\n  receiver: '${enabledChannels.length ? enabledChannels[0].name : 'default'}'\n`;
      
      fs.writeFileSync(path.join(configDir, 'alertmanager.yml'), config);
    }
  }

  /* ==========================================================
   * TEST NOTIFICATION
   * ========================================================== */
  router.post('/monitoring/channels/:id/test', auth, async (req, res) => {
    const id = parseInt(req.params.id);
    const db = loadDB();
    const channel = (db.channels || []).find(c => c.id === id);
    if (!channel) return res.status(404).json({ error: 'Kanal bulunamadı' });
    
    const message = `🧪 <b>Test Bildirimi</b>\nOCP Panel'den test bildirimi gönderildi.\nZaman: ${new Date().toISOString()}`;
    
    try {
      await sendNotification(channel, message);
      res.json({ ok: true, message: 'Test bildirimi gönderildi' });
    } catch (e) {
      res.status(500).json({ error: 'Gönderim hatası: ' + e.message });
    }
  });

  async function sendNotification(channel, message) {
    switch (channel.type) {
      case 'telegram': {
        const url = `https://api.telegram.org/bot${channel.config.botToken}/sendMessage`;
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: channel.config.chatId, text: message, parse_mode: 'HTML' })
        });
        if (!r.ok) throw new Error('Telegram API hatası: ' + r.statusText);
        break;
      }
      case 'email': {
        // Basit email - gerçek implementasyon için nodemailer gerekli
        console.log('[Email] Would send to:', channel.config.email, message);
        break;
      }
      case 'slack': {
        const r = await fetch(channel.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });
        if (!r.ok) throw new Error('Slack webhook hatası');
        break;
      }
      case 'webhook': {
        const r = await fetch(channel.config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        if (!r.ok) throw new Error('Webhook hatası: ' + r.statusText);
        break;
      }
      default:
        throw new Error('Desteklenmeyen kanal tipi');
    }
  }

  /* ==========================================================
   * GRAFANA DASHBOARD YÖNETİMİ
   * ========================================================== */
  router.get('/monitoring/dashboards', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, dashboards: db.dashboards || [] });
  });

  router.post('/monitoring/dashboards', auth, (req, res) => {
    const b = req.body || {};
    if (!b.name || !b.panels) return res.status(400).json({ error: 'Dashboard adı ve paneller gerekli' });
    
    const db = loadDB();
    const dashboard = {
      id: Date.now(),
      name: b.name,
      panels: b.panels,
      tags: b.tags || [],
      created: new Date().toISOString(),
    };
    
    db.dashboards = db.dashboards || [];
    db.dashboards.push(dashboard);
    saveDB(db);
    
    // Grafana provisioning dosyası
    updateGrafanaDashboard(dashboard);
    
    res.json({ ok: true, dashboard, message: 'Dashboard eklendi' });
  });

  function updateGrafanaDashboard(dashboard) {
    const dir = path.join(GRAFANA_DIR, 'provisioning', 'dashboards');
    fs.mkdirSync(dir, { recursive: true });
    
    const grafanaDashboard = {
      apiVersion: 1,
      providers: [{
        name: 'OCP Panel',
        orgId: 1,
        folder: 'OCP Panel',
        type: 'file',
        disableDeletion: false,
        updateIntervalSeconds: 10,
        allowUiUpdates: true,
        options: { path: '/etc/grafana/provisioning/dashboards' }
      }]
    };
    
    fs.writeFileSync(path.join(dir, 'dashboards.yml'), require('yaml').dump(grafanaDashboard));
    
    // Dashboard JSON
    const dashFile = path.join(dir, `ocp-${dashboard.id}.json`);
    const grafanaDash = {
      dashboard: {
        id: null,
        title: dashboard.name,
        tags: ['ocp-panel', ...dashboard.tags],
        timezone: 'browser',
        panels: dashboard.panels,
        time: { from: 'now-1h', to: 'now' },
        refresh: '10s'
      },
      overwrite: true
    };
    fs.writeFileSync(dashFile, JSON.stringify(grafanaDash, null, 2));
  }

  /* ==========================================================
   * PROMETHEUS QUERY API
   * ========================================================== */
  router.post('/monitoring/query', auth, async (req, res) => {
    const { query, start, end, step } = req.body;
    if (!query) return res.status(400).json({ error: 'Query gerekli' });
    
    const promUrl = 'http://localhost:9090';
    let url = `${promUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;
    if (step) url += `&step=${step}`;
    
    try {
      const r = await fetch(url);
      const data = await r.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/monitoring/query_range', auth, async (req, res) => {
    const { query, start, end, step } = req.body;
    if (!query || !start || !end || !step) return res.status(400).json({ error: 'query, start, end, step gerekli' });
    
    const promUrl = 'http://localhost:9090';
    const url = `${promUrl}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`;
    
    try {
      const r = await fetch(url);
      const data = await r.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* ==========================================================
   * AYARLAR
   * ========================================================== */
  router.get('/monitoring/settings', auth, (req, res) => {
    const db = loadDB();
    res.json({ ok: true, settings: db.settings || { prometheusUrl: 'http://localhost:9090', grafanaUrl: 'http://localhost:3000' } });
  });

  router.post('/monitoring/settings', auth, (req, res) => {
    const b = req.body || {};
    const db = loadDB();
    db.settings = db.settings || {};
    if (b.prometheusUrl) db.settings.prometheusUrl = String(b.prometheusUrl).trim();
    if (b.grafanaUrl) db.settings.grafanaUrl = String(b.grafanaUrl).trim();
    if (b.alertmanagerUrl) db.settings.alertmanagerUrl = String(b.alertmanagerUrl).trim();
    saveDB(db);
    res.json({ ok: true, settings: db.settings });
  });

  return router;
};