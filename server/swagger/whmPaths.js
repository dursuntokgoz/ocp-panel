/* WHM Manual Paths for Swagger - imported by swagger.js */

const whmPaths = {
  // Packages
  '/packages': {
    get: { tags: ['WHM'], summary: 'Paketleri listele', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Paket listesi', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, packages: { type: 'array', items: { $ref: '#/components/schemas/WHMPackage' } } } } } } } },
    post: { tags: ['WHM'], summary: 'Paket oluştur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WHMPackage' } } } }, responses: { '200': { description: 'Oluşturulan paket' } } }
  },
  '/packages/{name}': {
    put: { tags: ['WHM'], summary: 'Paket güncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/WHMPackage' } } } }, responses: { '200': { description: 'Güncellenen paket' } } },
    delete: { tags: ['WHM'], summary: 'Paket sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } }
  },

  // Resellers
  '/resellers': {
    get: { tags: ['WHM'], summary: 'Resellerları listele', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Reseller listesi' } } },
    post: { tags: ['WHM'], summary: 'Reseller oluştur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password', 'package'], properties: { username: { type: 'string' }, password: { type: 'string', minLength: 6 }, package: { type: 'string' }, email: { type: 'string' } } } } } }, responses: { '200': { description: 'Oluşturulan reseller' } } }
  },
  '/resellers/{name}': {
    put: { tags: ['WHM'], summary: 'Reseller güncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { package: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 6 } } } } } }, responses: { '200': { description: 'Güncellendi' } } },
    delete: { tags: ['WHM'], summary: 'Reseller sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } }
  },
  '/resellers/switch/{username}': {
    get: { tags: ['WHM'], summary: 'Reseller bağlamı değiştir', security: [{ bearerAuth: [] }], parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Bağlam değiştirildi' } } }
  },

  // Domains
  '/domains': {
    get: { tags: ['WHM'], summary: 'Domainleri listele', security: [{ bearerAuth: [] }], parameters: [{ name: 'owner', in: 'query', schema: { type: 'string' }, description: 'Reseller sahibine göre filtrele' }], responses: { '200': { description: 'Domain listesi' } } },
    post: { tags: ['WHM'], summary: 'Domain oluştur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, reseller: { type: 'string' }, root: { type: 'string' }, php: { type: 'string' }, ssl: { type: 'boolean' } } } } } }, responses: { '200': { description: 'Oluşturulan domain' } } }
  },
  '/domains/{name}': {
    put: { tags: ['WHM'], summary: 'Domain güncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { root: { type: 'string' }, php: { type: 'string' }, ssl: { type: 'boolean' }, reseller: { type: 'string' } } } } } }, responses: { '200': { description: 'Güncellendi' } } },
    delete: { tags: ['WHM'], summary: 'Domain sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } }
  },
  '/domains/switch/{domain}': {
    get: { tags: ['WHM'], summary: 'Domain bağlamı değiştir', security: [{ bearerAuth: [] }], parameters: [{ name: 'domain', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Bağlam değiştirildi' } } }
  },

  // DNS Zones
  '/dns-zones': {
    get: { tags: ['WHM'], summary: 'DNS zone listesi', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Zone listesi', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, zones: { type: 'array', items: { type: 'object', properties: { domain: { type: 'string' }, serial: { type: 'integer' }, records: { type: 'array', items: { type: 'object', properties: { type: { type: 'string', enum: ['A', 'CNAME', 'MX', 'NS', 'TXT'] }, name: { type: 'string' }, value: { type: 'string' }, ttl: { type: 'integer' } } } } } } } } } } } } }
  },
  '/dns-zones/{domain}': {
    put: { tags: ['WHM'], summary: 'DNS zone A kaydı güncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'domain', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['ip'], properties: { ip: { type: 'string', pattern: '^(\\d{1,3}\\.){3}\\d{1,3}$' } } } } } }, responses: { '200': { description: 'A kaydı güncellendi' } } }
  },

  // Email Accounts
  '/emails': {
    get: { tags: ['WHM'], summary: 'E-posta hesaplarını listele', security: [{ bearerAuth: [] }], parameters: [{ name: 'domain', in: 'query', schema: { type: 'string' } }, { name: 'owner', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'E-posta listesi' } } },
    post: { tags: ['WHM'], summary: 'E-posta hesabı oluştur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 }, quotaMB: { type: 'integer', minimum: 0 } } } } } }, responses: { '200': { description: 'Oluşturuldu' } } }
  },
  '/emails/{email}': {
    put: { tags: ['WHM'], summary: 'E-posta hesabı güncelle (parola/quota)', security: [{ bearerAuth: [] }], parameters: [{ name: 'email', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { password: { type: 'string', minLength: 6 }, quotaMB: { type: 'integer', minimum: 0 } } } } } }, responses: { '200': { description: 'Güncellendi' } } },
    delete: { tags: ['WHM'], summary: 'E-posta hesabı sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'email', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } }
  },

  // FTP Accounts
  '/ftp': {
    get: { tags: ['WHM'], summary: 'FTP hesaplarını listele', security: [{ bearerAuth: [] }], parameters: [{ name: 'owner', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'FTP listesi' } } },
    post: { tags: ['WHM'], summary: 'FTP hesabı oluştur', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['user', 'password'], properties: { user: { type: 'string', pattern: '^.+@.+$' }, password: { type: 'string', minLength: 6 }, root: { type: 'string' } } } } } }, responses: { '200': { description: 'Oluşturuldu' } } }
  },
  '/ftp/{user}': {
    put: { tags: ['WHM'], summary: 'FTP hesabı güncelle', security: [{ bearerAuth: [] }], parameters: [{ name: 'user', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { password: { type: 'string', minLength: 6 }, root: { type: 'string' } } } } } }, responses: { '200': { description: 'Güncellendi' } } },
    delete: { tags: ['WHM'], summary: 'FTP hesabı sil', security: [{ bearerAuth: [] }], parameters: [{ name: 'user', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' } } }
  },
  '/ftp/connections': {
    get: { tags: ['WHM'], summary: 'Aktif FTP baglantilari ve loglar', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Baglanti ve log listesi' } } }
  }
};

module.exports = whmPaths;