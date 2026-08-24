import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Cpu, Server, Code, Settings, Plus } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useState } from 'react';
import { clsx } from 'clsx';

interface PHPVersion {
  version: string;
  installed: boolean;
  default: boolean;
}

interface DomainPHP {
  domain: string;
  phpVersion: string;
}

interface Pool {
  name: string;
  version: string;
  status: 'running' | 'stopped';
}

export function SystemPHPSelector() {
  const [activeTab, setActiveTab] = useState<'versions' | 'domains' | 'pools'>('versions');

  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ['php-selector', 'versions'],
    queryFn: async () => {
      const response = await api.get('/api/php-selector/versions');
      return response.data;
    },
  });

  const { data: domainsData } = useQuery({
    queryKey: ['php-selector', 'domains'],
    queryFn: async () => {
      const response = await api.get('/api/php-selector/domains');
      return response.data;
    },
  });

  const { data: poolsData } = useQuery({
    queryKey: ['php-selector', 'pools'],
    queryFn: async () => {
      const response = await api.get('/api/php-selector/pools/8.2');
      return response.data;
    },
  });

  if (versionsLoading && !versionsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'versions', label: 'PHP Versions', icon: Cpu },
    { id: 'domains', label: 'Domain PHP', icon: Server },
    { id: 'pools', label: 'FPM Pools', icon: Settings },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">PHP Selector</h1>
          <p className="page-subtitle">Manage PHP versions per domain and FPM pools</p>
        </div>
        <button className="btn-x3-primary" disabled>
          <Plus className="w-4 h-4 mr-2" /> Add Pool
        </button>
      </div>

      <div className="tabs mb-6" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={clsx('tab', activeTab === tab.id && 'active')}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'versions' && (
        <Card>
          <CardHeader title="Installed PHP Versions" subtitle="Select default version and manage installations" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {versionsData?.installed?.map((v: string) => (
                <div key={v} className="card p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">PHP {v}</div>
                  <span className={clsx('badge', versionsData.default === v ? 'badge-success' : 'badge-gray')}>
                    {versionsData.default === v ? 'Default' : 'Available'}
                  </span>
                  <div className="mt-3">
                    <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>Set Default</button>
                    <button className="btn-x3-secondary btn-x3-sm" disabled>Config</button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'domains' && (
        <Card>
          <CardHeader title="Domain PHP Versions" subtitle="Assign PHP version to each domain" />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Current PHP</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domainsData?.domains?.map((d: DomainPHP) => (
                    <tr key={d.domain}>
                      <td>{d.domain}</td>
                      <td>
                        <span className="badge badge-info">PHP {d.phpVersion}</span>
                      </td>
                      <td className="text-right">
                        <button className="btn-x3-secondary btn-x3-sm" disabled>Change</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'pools' && (
        <Card>
          <CardHeader title="FPM Pools (PHP 8.2)" subtitle="Manage PHP-FPM worker pools" />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pool Name</th>
                    <th>User</th>
                    <th>Socket</th>
                    <th>Process Manager</th>
                    <th>Max Children</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {poolsData?.pools?.map((pool: Pool) => (
                    <tr key={pool.name}>
                      <td className="font-medium">{pool.name}</td>
                      <td>{pool.name}</td>
                      <td className="font-mono text-sm">/run/php/php8.2-fpm-{pool.name}.sock</td>
                      <td>ondemand</td>
                      <td>50</td>
                      <td>
                        <span className={clsx('badge', pool.status === 'running' ? 'badge-success' : 'badge-warning')}>
                          {pool.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>Edit</button>
                        <button className="btn-x3-danger btn-x3-sm" disabled>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}