import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Activity, Cpu, MemoryStick, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { clsx } from 'clsx';

interface Process {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
  startTime: string;
}

export function SystemProcesses() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const response = await api.get<{ processes: Process[] }>('/api/processes');
      return response.data;
    },
    refetchInterval: 10000,
  });

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
        Failed to load processes
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Process</h1>
          <p className="page-subtitle">View and manage running processes</p>
        </div>
        <button className="btn-x3-secondary btn-x3-sm" onClick={() => refetch()}>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Processes</p>
                <p className="text-2xl font-bold text-slate-900">{data?.processes?.length || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <MemoryStick className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Memory</p>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.processes?.reduce((sum, p) => sum + p.mem, 0) / (data?.processes?.length || 1) || 0}
                  %
                </p>
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
                <p className="text-sm text-slate-500">Avg CPU</p>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.processes?.reduce((sum, p) => sum + p.cpu, 0) / (data?.processes?.length || 1) || 0}
                  %
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Running Processes" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>User</th>
                  <th>CPU %</th>
                  <th>Memory %</th>
                  <th>Command</th>
                  <th>Start Time</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.processes?.slice(0, 50).map((proc) => (
                  <tr key={proc.pid}>
                    <td className="font-mono text-sm">{proc.pid}</td>
                    <td>{proc.user}</td>
                    <td>
                      <span className={clsx('badge', Number(proc.cpu) > 50 ? 'badge-danger' : Number(proc.cpu) > 10 ? 'badge-warning' : 'badge-gray')}>
                        {Number(proc.cpu).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={clsx('badge', Number(proc.mem) > 50 ? 'badge-danger' : Number(proc.mem) > 10 ? 'badge-warning' : 'badge-gray')}>
                        {Number(proc.mem).toFixed(1)}%
                      </span>
                    </td>
                    <td className="font-mono text-sm max-w-xs truncate">{proc.command}</td>
                    <td className="text-sm text-slate-500">{proc.startTime}</td>
                    <td className="text-right">
                      <button className="btn-x3-danger btn-x3-sm" disabled>Kill</button>
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