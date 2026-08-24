import axios from 'axios';

export const api = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ocp_token');
      localStorage.removeItem('ocp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiEndpoints = {
  auth: {
    login: '/api/login',
    logout: '/api/logout',
    me: '/api/me',
  },
  stats: '/api/stats',
  whm: {
    accounts: '/api/whm/accounts',
    packages: '/api/whm/packages',
    resellers: '/api/whm/resellers',
    domains: '/api/whm/domains',
    dns: '/api/whm/dns-zones',
    email: '/api/whm/emails',
    ftp: '/api/whm/ftp',
  },
  system: {
    terminal: '/api/terminal',
    files: '/api/files',
    processes: '/api/processes',
    cron: '/api/cron',
    logs: '/api/logs',
    mysql: '/api/mysql',
    ssl: '/api/ssl',
    phpSelector: '/api/php-selector',
    firewall: '/api/firewall',
    monitoring: '/api/monitoring',
    backups: '/api/backups',
  },
};

export default api;