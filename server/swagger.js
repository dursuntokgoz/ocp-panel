/* ============================================================
 * OCP Panel — OpenAPI (Swagger) Documentation
 * Auto-generated from route handlers
 * ============================================================ */
'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/* ---------- OpenAPI Spec ---------- */
const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'OCP Panel API',
      version: '2.0.0',
      description: `
OCP Panel — Gerçek Sunucu Kontrol Paneli REST API

**Authentication**: Bearer token (JWT-like, 24h TTL)
- Login: \`POST /api/login\` with \`{username, password}\`
- Header: \`Authorization: Bearer <token>\`

**Roles**: admin, reseller, user
- Admin: full access including user management
- Reseller: WHM functions, accounts, packages, DNS, email, FTP
- User: own account only (files, email, FTP, password)

**Base URL**: \`https://<host>:2083/api\`
      `,
      contact: {
        name: 'OCP Panel',
        url: 'https://github.com/dursuntokgoz/ocp-panel'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://localhost:2083/api',
        description: 'Development server (self-signed cert)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'password123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'a1b2c3d4...' },
            user: { type: 'string', example: 'admin' },
            role: { type: 'string', enum: ['admin', 'reseller', 'user'], example: 'admin' },
            name: { type: 'string', example: 'Panel Admin' },
            hostname: { type: 'string', example: 'server.example.com' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'john' },
            role: { type: 'string', enum: ['admin', 'reseller', 'user'], example: 'user' },
            name: { type: 'string', example: 'John Doe' },
            active: { type: 'boolean', example: true },
            created: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
            lastLogin: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        CreateUserRequest: {
          type: 'object',
          required: ['username', 'password', 'role'],
          properties: {
            username: { type: 'string', pattern: '^[a-z][a-z0-9._-]{2,31}$', example: 'john' },
            password: { type: 'string', minLength: 8, example: 'securepass123' },
            role: { type: 'string', enum: ['admin', 'reseller', 'user'], example: 'user' },
            name: { type: 'string', example: 'John Doe' }
          }
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['admin', 'reseller', 'user'], example: 'user' },
            active: { type: 'boolean', example: true },
            password: { type: 'string', minLength: 8, example: 'newsecurepass123' }
          }
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['current', 'next'],
          properties: {
            current: { type: 'string', example: 'oldpassword123' },
            next: { type: 'string', minLength: 8, example: 'newpassword123' }
          }
        },
        Stats: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            hostname: { type: 'string' },
            kernel: { type: 'string' },
            arch: { type: 'string' },
            platform: { type: 'string' },
            user: { type: 'string' },
            uptime: { type: 'number' },
            load: { type: 'array', items: { type: 'number' } },
            cpu: { type: 'object', properties: { cores: { type: 'integer' }, usage: { type: 'integer' }, model: { type: 'string' } } },
            memory: { type: 'object', properties: { total: { type: 'integer' }, used: { type: 'integer' }, free: { type: 'integer' }, pct: { type: 'integer' } } },
            disk: { type: 'object', properties: { total: { type: 'integer' }, used: { type: 'integer' }, free: { type: 'integer' }, pct: { type: 'integer' } } },
            temp: { type: 'integer', nullable: true },
            ip: { type: 'string', nullable: true },
            services: { type: 'integer' },
            processes: { type: 'integer' },
            docker: { type: 'integer' },
            mysql: { type: 'boolean' },
            web: { type: 'boolean' }
          }
        },
        Service: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            load: { type: 'string' },
            active: { type: 'string' },
            sub: { type: 'string' },
            desc: { type: 'string' }
          }
        },
        Process: {
          type: 'object',
          properties: {
            pid: { type: 'integer' },
            user: { type: 'string' },
            cpu: { type: 'string' },
            mem: { type: 'string' },
            cmd: { type: 'string' }
          }
        },
        FileEntry: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            path: { type: 'string' },
            size: { type: 'integer' },
            sizeH: { type: 'string' },
            mtime: { type: 'string' },
            mode: { type: 'string' },
            isDir: { type: 'boolean' },
            isFile: { type: 'boolean' }
          }
        },
        DockerContainer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            image: { type: 'string' },
            status: { type: 'string' },
            ports: { type: 'string' },
            created: { type: 'string' },
            size: { type: 'string' }
          }
        },
        DockerStats: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            id: { type: 'string' },
            cpu: { type: 'string' },
            memUsage: { type: 'string' },
            memPerc: { type: 'string' },
            netIO: { type: 'string' },
            blockIO: { type: 'string' },
            pids: { type: 'string' }
          }
        },
        Backup: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            path: { type: 'string' },
            size: { type: 'integer' },
            sizeH: { type: 'string' },
            mtime: { type: 'string' },
            type: { type: 'string', enum: ['tar.gz', 'zip', 'file'] }
          }
        },
        BackupList: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            backups: { type: 'array', items: { $ref: '#/components/schemas/Backup' } },
            total: { type: 'integer' },
            totalSize: { type: 'integer' },
            totalSizeH: { type: 'string' },
            dir: { type: 'string' },
            schedule: { type: 'object', nullable: true },
            history: { type: 'array', items: { type: 'object' } }
          }
        },
        CreateBackupRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'my-backup' },
            dir: { type: 'string', example: '/home/user/backups' },
            sources: { type: 'array', items: { type: 'string' }, example: ['/home/user', '/etc'] }
          }
        },
        RestoreBackupRequest: {
          type: 'object',
          required: ['target'],
          properties: {
            target: { type: 'string', example: '/home/user' }
          }
        },
        BackupSchedule: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'custom'] },
            custom: { type: 'string', example: '0 3 * * *' },
            minute: { type: 'integer', minimum: 0, maximum: 59 },
            hour: { type: 'integer', minimum: 0, maximum: 23 },
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
            dayOfMonth: { type: 'integer', minimum: 1, maximum: 31 },
            expr: { type: 'string', example: '0 3 * * *' },
            sources: { type: 'array', items: { type: 'string' } },
            dir: { type: 'string' },
            script: { type: 'string' },
            updated: { type: 'string', format: 'date-time' }
          }
        },
        BackupSettings: {
          type: 'object',
          properties: {
            dir: { type: 'string', example: '/home/user/backups' },
            sources: { type: 'array', items: { type: 'string' }, example: ['/home/user'] }
          }
        },
        WHMAccount: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            domain: { type: 'string' },
            package: { type: 'string' },
            email: { type: 'string' },
            ip: { type: 'string' },
            suspended: { type: 'boolean' },
            diskUsed: { type: 'string' },
            diskLimit: { type: 'string' },
            bwUsed: { type: 'string' },
            bwLimit: { type: 'string' }
          }
        },
        CreateAccountRequest: {
          type: 'object',
          required: ['username', 'domain', 'password', 'package'],
          properties: {
            username: { type: 'string', example: 'johndoe' },
            domain: { type: 'string', example: 'example.com' },
            password: { type: 'string', minLength: 8, example: 'securepass123' },
            package: { type: 'string', example: 'basic' },
            email: { type: 'string', example: 'admin@example.com' }
          }
        },
        WHMPackage: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            disk: { type: 'integer' },
            bandwidth: { type: 'integer' },
            domains: { type: 'integer' },
            emails: { type: 'integer' },
            ftp: { type: 'integer' },
            dbs: { type: 'integer' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Kimlik doğrulama' },
      { name: 'Users', description: 'Kullanıcı yönetimi (RBAC) — sadece admin' },
      { name: 'System', description: 'Sistem istatistikleri ve yönetimi' },
      { name: 'Services', description: 'Systemd servis yönetimi' },
      { name: 'Processes', description: 'Proses listesi ve yönetimi' },
      { name: 'Files', description: 'Dosya sistemi işlemleri' },
      { name: 'Logs', description: 'Log görüntüleme (journalctl + dosya)' },
      { name: 'Cron', description: 'Crontab yönetimi' },
      { name: 'Network', description: 'Ağ arayüzleri ve portlar' },
      { name: 'Users (System)', description: 'Sistem kullanıcıları' },
      { name: 'Disk', description: 'Disk analizi' },
      { name: 'MySQL', description: 'MariaDB/MySQL yönetimi' },
      { name: 'Terminal', description: 'Shell komut çalıştırma' },
      { name: 'Docker', description: 'Docker konteyner yönetimi' },
      { name: 'Backups', description: 'Yedekleme otomasyonu' },
      { name: 'WHM', description: 'WebHost Manager — cPanel compatible' }
    ]
  },
  apis: ['./server/*.js'] // JSDoc comments in route files
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'OCP Panel API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));

  console.log('[swagger] API docs available at /api-docs');
}

module.exports = { swaggerSpec, setupSwagger };