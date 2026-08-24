import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Activity, Server, Database, HardDrive, TrendingUp, BarChart2, Bell, Plus } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useState } from 'react';
import { clsx } from 'clsx';

interface Metric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface AlertRule {
  name: string;
  expr: string;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

export function SystemMonitoring() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'alerts' | 'channels'>('metrics');

  const tabs = [
    { id: 'metrics', label: 'Metrics', icon: BarChart2 },
    { id: 'alerts', label: 'Alert Rules', icon: Bell },
    { id: 'channels', label: 'Notifications', icon: Plus },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Monitoring & Alerting</h1>
          <p className="page-subtitle">Prometheus metrics, alerting, and notification channels</p>
        </div>
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

      {activeTab === 'metrics' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">CPU Usage</p>
                    <p className="text-2xl font-bold text-slate-900">42%</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Database className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Memory</p>
                    <p className="text-2xl font-bold text-slate-900">68%</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <HardDrive className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Disk</p>
                    <p className="text-2xl font-bold text-slate-900">45%</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Load Avg</p>
                    <p className="text-2xl font-bold text-slate-900">1.24</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="CPU Usage (Last Hour)" />
              <CardBody>
                <div className="h-64 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                  Chart placeholder - integrate with recharts or similar
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Memory Usage (Last Hour)" />
              <CardBody>
                <div className="h-64 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                  Chart placeholder - integrate with recharts or similar
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Alert Rules</h2>
            <button className="btn-x3-primary">
              <Plus className="w-4 h-4 mr-2" /> Create Rule
            </button>
          </div>
          <Card>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Expression</th>
                      <th>Severity</th>
                      <th>For</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>High CPU Usage</td>
                      <td className="font-mono text-sm">{"cpu_usage > 80"}</td>
                      <td><span className="badge badge-danger">critical</span></td>
                      <td>5m</td>
                      <td><span className="badge badge-success">Enabled</span></td>
                      <td className="text-right">
                        <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>Edit</button>
                        <button className="btn-x3-danger btn-x3-sm" disabled>Delete</button>
                      </td>
                    </tr>
                    <tr>
                      <td>High Memory Usage</td>
                      <td className="font-mono text-sm">{"memory_usage > 85"}</td>
                      <td><span className="badge badge-warning">warning</span></td>
                      <td>5m</td>
                      <td><span className="badge badge-success">Enabled</span></td>
                      <td className="text-right">
                        <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>Edit</button>
                        <button className="btn-x3-danger btn-x3-sm" disabled>Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'channels' && (
        <Card>
          <CardHeader title="Notification Channels" subtitle="Configure where alerts are sent" />
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bell className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Telegram</p>
                    <p className="text-sm text-slate-500">Configured &bull; chat_id: -1001234567890</p>
                  </div>
                </div>
                <span className="badge badge-success">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-slate-500">Not configured</p>
                  </div>
                </div>
                <span className="badge badge-gray">Disabled</span>
              </div>
              <button className="btn-x3-primary">
                <Plus className="w-4 h-4 mr-2" /> Add Channel
              </button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}