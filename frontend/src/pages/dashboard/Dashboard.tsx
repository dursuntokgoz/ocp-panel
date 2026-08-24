import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Activity, Database } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

interface Stats {
  cpu: number;
  memory: { total: number; used: number; free: number; percent: number };
  disk: { total: number; used: number; free: number; pct: number; mount?: string };
  load: number[];
  uptime: number;
  hostname: string;
}

export function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await api.get<Stats>('/api/stats');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load dashboard stats
      </div>
    );
  }

  const diskPercent = stats?.disk?.pct || 0;
  const memPercent = stats?.memory?.percent || 0;

  const statCards = [
    {
      title: 'CPU Usage',
      value: stats?.cpu ? `${stats.cpu}%` : '—',
      icon: Activity,
      color: 'bg-blue-500',
      trend: stats?.cpu && stats.cpu > 80 ? 'high' : 'normal',
    },
    {
      title: 'Memory Usage',
      value: stats?.memory ? `${memPercent}%` : '—',
      icon: Database,
      color: 'bg-green-500',
      trend: memPercent > 80 ? 'high' : 'normal',
    },
    {
      title: 'Disk Usage',
      value: `${diskPercent}%`,
      icon: Database,
      color: 'bg-purple-500',
      trend: diskPercent > 80 ? 'high' : 'normal',
    },
    {
      title: 'Load Average',
      value: stats?.load ? stats.load[0].toFixed(2) : '—',
      icon: Activity,
      color: 'bg-orange-500',
      trend: stats?.load && stats.load[0] > 2 ? 'high' : 'normal',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Server overview and system statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.title} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              {card.trend === 'high' && (
                <span className="inline-block mt-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  High usage
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="System Information" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Hostname</dt>
                <dd className="font-medium text-slate-900">{stats?.hostname || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Uptime</dt>
                <dd className="font-medium text-slate-900">{stats?.uptime ? formatUptime(stats.uptime) : '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Load (1m)</dt>
                <dd className="font-medium text-slate-900">{stats?.load?.[0]?.toFixed(2) || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Load (5m)</dt>
                <dd className="font-medium text-slate-900">{stats?.load?.[1]?.toFixed(2) || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Load (15m)</dt>
                <dd className="font-medium text-slate-900">{stats?.load?.[2]?.toFixed(2) || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">CPU Cores</dt>
                <dd className="font-medium text-slate-900">{stats?.cpu ? 'Multi-core' : '—'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Memory Details" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Total</dt>
                <dd className="font-medium text-slate-900">{stats?.memory ? formatBytes(stats.memory.total) : '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Used</dt>
                <dd className="font-medium text-slate-900">{stats?.memory ? formatBytes(stats.memory.used) : '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Free</dt>
                <dd className="font-medium text-slate-900">{stats?.memory ? formatBytes(stats.memory.free) : '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Usage</dt>
                <dd className="font-medium text-slate-900">{memPercent}%</dd>
              </div>
            </dl>
            <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  memPercent > 80 ? 'bg-red-500' : memPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${memPercent}%` }}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Disk Usage" />
          <CardBody>
            <div className="space-y-4">
              {stats?.disk && (
                <div key="root" className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{stats.disk.mount || '/'}</span>
                    <span className="font-medium text-slate-900">
                      {formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)} ({stats.disk.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        parseFloat(stats.disk.pct) > 80 ? 'bg-red-500' : parseFloat(stats.disk.pct) > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${stats.disk.pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}