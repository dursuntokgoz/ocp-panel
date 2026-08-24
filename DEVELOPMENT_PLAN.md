# OCP Panel v2.1+ Development Plan

## Phase 1: React/TypeScript Frontend Migration (P0)
- [ ] Create React + TypeScript + Vite project structure
- [ ] Migrate existing HTML/CSS/JS to React components
- [ ] Implement React Router for SPA navigation
- [ ] Add Tailwind CSS for modern styling (keeping cPanel X3 theme)
- [ ] Create reusable UI components (Button, Form, Table, Modal, Sidebar, etc.)
- [ ] Implement state management (Zustand or Redux Toolkit)
- [ ] Add React Query for API data fetching
- [ ] Migrate all WHM/System modules to React pages
- [ ] Ensure all existing E2E tests still pass

## Phase 2: Missing WHM Module Frontends (P0)
- [ ] SSL/TLS Manager UI (Let's Encrypt, custom certs, auto-renewal)
- [ ] PHP Selector UI (per-domain PHP version, FPM pools, php.ini editor)
- [ ] Firewall Manager UI (UFW rules, GeoIP, Fail2Ban jails)
- [ ] Monitoring & Alerting UI (Prometheus metrics, Grafana dashboards, Alertmanager)
- [ ] Backup S3/MinIO UI (S3 settings, upload/download/restore/list)

## Phase 3: Backend Testing & Quality (P1)
- [ ] Add Jest for unit/integration tests
- [ ] Test all API endpoints (auth, WHM, system, new modules)
- [ ] Add test coverage reporting
- [ ] CI/CD integration for unit tests

## Phase 4: Database & Architecture Improvements (P1)
- [ ] PostgreSQL + Prisma ORM migration option
- [ ] Plugin system architecture
- [ ] Event-driven architecture for modules

## Phase 5: Docker & Monitoring Stack (P1)
- [ ] Complete Docker Compose with:
  - Prometheus + Alertmanager
  - Grafana (pre-configured dashboards)
  - Node Exporter
  - cAdvisor for Docker metrics
  - Loki + Promtail for logs

## Phase 6: Internationalization (P2)
- [ ] i18n framework (react-i18next)
- [ ] Turkish (default) + English translations
- [ ] Language switcher in UI

## Phase 7: Advanced Features (P2)
- [ ] Two-factor authentication (2FA)
- [ ] Audit logging
- [ ] API rate limiting per user/role
- [ ] Webhook system for events
- [ ] Backup scheduling UI with calendar

## Current Status (v2.0.0)
- ✅ All 52 E2E tests passing
- ✅ Backend modules: SSL, PHP Selector, Firewall, Monitoring, Backup S3
- ✅ CI/CD Pipeline (GitHub Actions)
- ✅ Dockerfile + docker-compose.yml
- ✅ Rate limiting, UTF-8 fixes
- ✅ Systemd service running

## Next Immediate Steps
1. Set up React + TypeScript + Vite project
2. Create component library
3. Migrate sidebar, header, dashboard
4. Migrate WHM modules one by one
5. Add frontend for new backend modules