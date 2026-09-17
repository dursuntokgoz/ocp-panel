import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Play, Square, RotateCcw, RefreshCcw, Search } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';

interface Service {
  name: string;
  load: string;
  active: string;
  sub: string;
  desc: string;
}

const ACTIONS = ['start', 'stop', 'restart', 'reload'] as const;

export function SystemServices() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get<{ services: Service[] }>('/api/services');
      return res.data;
    },
    refetchInterval: 20000,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ name, action }: { name: string; action: string }) => {
      const res = await api.post(`/api/services/${encodeURIComponent(name)}/${action}`);
      return res.data;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">Failed to load services</div>;
  }

  let services = data?.services || [];
  if (!showAll) services = services.filter((s) => s.active === 'active');
  if (filter) {
    const q = filter.toLowerCase();
    services = services.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.desc || '').toLowerCase().includes(q)
    );
  }

  const active = (data?.services || []).filter((s) => s.active === 'active').length;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">Manage systemd services — {active} active / {data?.services?.length || 0} total</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-x3-secondary btn-x3-sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Active Only' : 'Show All'}
          </button>
          <button className="btn-x3-secondary btn-x3-sm" onClick={() => refetch()}>Refresh</button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input-x3 pl-9 w-full max-w-md"
          placeholder="Filter by name or description..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Card>
        <CardBody className="p-0">
          <table className="table-x3 w-full">
            <thead>
              <tr>
                <th>Service</th><th>Description</th><th>Active</th><th>Sub</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.slice(0, 200).map((s) => {
                const running = s.active === 'active';
                return (
                  <tr key={s.name}>
                    <td className="font-medium font-mono text-sm">{s.name}</td>
                    <td className="text-sm text-slate-500 max-w-[280px] truncate">{s.desc || '—'}</td>
                    <td><span className={running ? 'badge badge-success' : 'badge badge-error'}>{s.active}</span></td>
                    <td className="text-sm text-slate-500">{s.sub}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {!running && (
                          <button title="Start" className="p-1.5 rounded hover:bg-green-50 text-green-600"
                            disabled={actionMutation.isPending}
                            onClick={() => actionMutation.mutate({ name: s.name, action: 'start' })}><Play className="w-4 h-4" /></button>
                        )}
                        {running && (
                          <button title="Stop" className="p-1.5 rounded hover:bg-red-50 text-red-600"
                            disabled={actionMutation.isPending}
                            onClick={() => actionMutation.mutate({ name: s.name, action: 'stop' })}><Square className="w-4 h-4" /></button>
                        )}
                        <button title="Restart" className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          disabled={actionMutation.isPending}
                          onClick={() => actionMutation.mutate({ name: s.name, action: 'restart' })}><RotateCcw className="w-4 h-4" /></button>
                        <button title="Reload" className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                          disabled={actionMutation.isPending}
                          onClick={() => actionMutation.mutate({ name: s.name, action: 'reload' })}><RefreshCcw className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {services.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-400 py-8">No services match</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
