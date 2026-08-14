/* ============================================================
 * OCP Panel - OpenAPI (Swagger) Documentation
 * ============================================================ */
'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'OCP Panel API',
      version: '2.0.0',
      description: 'OCP Panel API Documentation',
      contact: { name: 'OCP Panel', url: 'https://github.com/dursuntokgoz/ocp-panel' },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' }
    },
    servers: [{ url: 'https://localhost:2083/api', description: 'Development server' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {}
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication' },
      { name: 'Users', description: 'User management (RBAC)' },
      { name: 'System', description: 'System statistics' },
      { name: 'Services', description: 'Service management' },
      { name: 'Processes', description: 'Process list' },
      { name: 'Files', description: 'File operations' },
      { name: 'Logs', description: 'Log viewing' },
      { name: 'Cron', description: 'Crontab management' },
      { name: 'Network', description: 'Network interfaces' },
      { name: 'Users (System)', description: 'System users' },
      { name: 'Disk', description: 'Disk analysis' },
      { name: 'MySQL', description: 'MariaDB/MySQL management' },
      { name: 'Terminal', description: 'Shell command execution' },
      { name: 'Docker', description: 'Docker container management' },
      { name: 'Backups', description: 'Backup automation' },
      { name: 'WHM', description: 'WebHost Manager' }
    ]
  },
  apis: ['./server/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

function addPath(path, methods) {
  swaggerSpec.paths[path] = methods;
}

addPath('/packages', { get: { tags: ['WHM'], summary: 'Paketleri listele', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Paket listesi' } } }, post: { tags: ['WHM'], summary: 'Paket olustur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Olusturuldu' } } } });
addPath('/packages/{name}', { put: { tags: ['WHM'], summary: 'Paket guncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Guncellendi' } } }, delete: { tags: ['WHM'], summary: 'Paket sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } } });
addPath('/resellers', { get: { tags: ['WHM'], summary: 'Resellerlari listele', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Reseller listesi' } } }, post: { tags: ['WHM'], summary: 'Reseller olustur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Olusturuldu' } } } });
addPath('/resellers/{name}', { put: { tags: ['WHM'], summary: 'Reseller guncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Guncellendi' } } }, delete: { tags: ['WHM'], summary: 'Reseller sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } } });
addPath('/resellers/switch/{username}', { get: { tags: ['WHM'], summary: 'Reseller baglami degistir', security: [{ bearerAuth: [] }], parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Baglam degistirildi' } } } });
addPath('/domains', { get: { tags: ['WHM'], summary: 'Domainleri listele', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Domain listesi' } } }, post: { tags: ['WHM'], summary: 'Domain olustur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Olusturuldu' } } } });
addPath('/domains/{name}', { put: { tags: ['WHM'], summary: 'Domain guncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Guncellendi' } } }, delete: { tags: ['WHM'], summary: 'Domain sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } } });
addPath('/dns-zones', { get: { tags: ['WHM'], summary: 'DNS zone listesi', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Zone listesi' } } } });
addPath('/dns-zones/{domain}', { put: { tags: ['WHM'], summary: 'DNS zone A kaydi guncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'domain', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Guncellendi' } } } });
addPath('/emails', { get: { tags: ['WHM'], summary: 'E-posta hesaplarini listele', security: [{ bearerAuth: [] }], responses: { '200': { description: 'E-posta listesi' } } }, post: { tags: ['WHM'], summary: 'E-posta hesabi olustur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Olusturuldu' } } } });
addPath('/emails/{email}', { put: { tags: ['WHM'], summary: 'E-posta hesabi guncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'email', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Guncellendi' } } }, delete: { tags: ['WHM'], summary: 'E-posta hesabi sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'email', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } } });
addPath('/ftp', { get: { tags: ['WHM'], summary: 'FTP hesaplarini listele', security: [{ bearerAuth: [] }], responses: { '200': { description: 'FTP listesi' } } }, post: { tags: ['WHM'], summary: 'FTP hesabi olustur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Olusturuldu' } } } });
addPath('/ftp/{user}', { put: { tags: ['WHM'], summary: 'FTP hesabi guncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'user', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Guncellendi' } } }, delete: { tags: ['WHM'], summary: 'FTP hesabi sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'user', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } } });
addPath('/ftp/connections', { get: { tags: ['WHM'], summary: 'Aktif FTP baglantilari', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Baglanti listesi' } } } });

function setupSwagger(app) {
  app.get('/api-docs.json', (req, res) => { res.setHeader('Content-Type', 'application/json'); res.send(swaggerSpec); });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }', customSiteTitle: 'OCP Panel API Docs', swaggerOptions: { persistAuthorization: true, filter: true, tryItOutEnabled: true } }));
  console.log('[swagger] API docs available at /api-docs');
}

module.exports = { swaggerSpec, setupSwagger };