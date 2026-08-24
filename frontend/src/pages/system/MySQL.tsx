import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Database, Cylinder, Server, Activity, HardDrive } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { clsx } from 'clsx';

interface MySQLStats {
  version: string;
  uptime: number;
  connections: number;
  queriesPerSecond: number;
  databases: { name: string; size: number; tables: number }[];
  status: 'running' | 'stopped';
}

export function SystemMySQL() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mysql'],
    queryFn: async () => {
      const response = await api.get<MySQLStats>('/api/mysql');
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

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load MySQL status
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">MySQL</h1>
          <p className="page-subtitle">Monitor and manage MySQL databases</p>
        </div>
        <div className="flex gap-2">
          <span className={clsx('badge px-3 py-1', data?.status === 'running' ? 'badge-success' : 'badge-danger')}>
            {data?.status === 'running' ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Version</p>
                <p className="text-xl font-bold text-slate-900">{data?.version || '—'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Uptime</p>
                <p className="text-xl font-bold text-slate-900">{data?.uptime ? formatUptime(data.uptime) : '—'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Server className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Connections</p>
                <p className="text-xl font-bold text-slate-900">{data?.connections || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Cylinder className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Queries/sec</p>
                <p className="text-xl font-bold text-slate-900">{data?.queriesPerSecond || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Databases" subtitle={`${data?.databases?.length || 0} databases`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Database</th>
                  <th>Size</th>
                  <th>Tables</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.databases?.map((db) => (
                  <tr key={db.name}>
                    <td className="font-medium">{db.name}</td>
                    <td>{formatBytes(db.size)}</td>
                    <td>{db.tables}</td>
                    <td className="text-right">
                      <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>Manage</button>
                      <button className="btn-x3-secondary btn-x3-sm" disabled>Backup</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}