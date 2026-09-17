import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Play, Square, RotateCcw, Pause, PlayCircle, Skull, ScrollText, BarChart3, Container } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
  created: string;
  size: string;
}

interface ContainerStats {
  cpu: string;
  memUsage: string;
  memPerc: string;
  netIO: string;
  blockIO: string;
  pids: string;
}

const ACTIONS = ['start', 'stop', 'restart', 'pause', 'unpause', 'kill'] as const;

export function SystemDocker() {
  const queryClient = useQueryClient();
  const [logsFor, setLogsFor] = useState<Container | null>(null);
  const [statsFor, setStatsFor] = useState<Container | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['docker'],
    queryFn: async () => {
      const res = await api.get<{ containers: Container[] }>('/api/docker');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await api.post(`/api/docker/${id}/${action}`);
      return res.data;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['docker'] }),
  });

  const isUp = (c: Container) => c.status.toLowerCase().startsWith('up');
  const isPaused = (c: Container) => c.status.toLowerCase().includes('paused');

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">Failed to load containers</div>;
  }

  const containers = data?.containers || [];
  const running = containers.filter(isUp).length;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Docker</h1>
          <p className="page-subtitle">Manage containers — start, stop, logs, stats</p>
        </div>
        <button className="btn-x3-secondary btn-x3-sm" onClick={() => refetch()}>Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-100 rounded-xl"><Container className="w-5 h-5 text-cyan-600" /></div>
            <div><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold text-slate-900">{containers.length}</p></div>
          </div>
        </CardBody></Card>
        <Card><CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl"><Play className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-sm text-slate-500">Running</p><p className="text-2xl font-bold text-slate-900">{running}</p></div>
          </div>
        </CardBody></Card>
        <Card><CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl"><Square className="w-5 h-5 text-slate-600" /></div>
            <div><p className="text-sm text-slate-500">Stopped</p><p className="text-2xl font-bold text-slate-900">{containers.length - running}</p></div>
          </div>
        </CardBody></Card>
      </div>

      <Card>
        <CardBody className="p-0">
          <table className="table-x3 w-full">
            <thead>
              <tr>
                <th>Name</th><th>Image</th><th>Status</th><th>Ports</th><th>Size</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td className="text-sm text-slate-500 max-w-[180px] truncate">{c.image}</td>
                  <td>
                    <span className={isUp(c) ? 'badge badge-success' : 'badge badge-error'}>{c.status}</span>
                  </td>
                  <td className="text-xs text-slate-500 max-w-[140px] truncate">{c.ports || '—'}</td>
                  <td className="text-sm text-slate-500">{c.size.split(' ')[0]}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      {!isUp(c) && (
                        <button title="Start" className="p-1.5 rounded hover:bg-green-50 text-green-600"
                          onClick={() => actionMutation.mutate({ id: c.id, action: 'start' })}><Play className="w-4 h-4" /></button>
                      )}
                      {isUp(c) && !isPaused(c) && (
                        <>
                          <button title="Stop" className="p-1.5 rounded hover:bg-red-50 text-red-600"
                            onClick={() => actionMutation.mutate({ id: c.id, action: 'stop' })}><Square className="w-4 h-4" /></button>
                          <button title="Restart" className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                            onClick={() => actionMutation.mutate({ id: c.id, action: 'restart' })}><RotateCcw className="w-4 h-4" /></button>
                          <button title="Pause" className="p-1.5 rounded hover:bg-amber-50 text-amber-600"
                            onClick={() => actionMutation.mutate({ id: c.id, action: 'pause' })}><Pause className="w-4 h-4" /></button>
                        </>
                      )}
                      {isPaused(c) && (
                        <button title="Unpause" className="p-1.5 rounded hover:bg-green-50 text-green-600"
                          onClick={() => actionMutation.mutate({ id: c.id, action: 'unpause' })}><PlayCircle className="w-4 h-4" /></button>
                      )}
                      <button title="Kill" className="p-1.5 rounded hover:bg-red-50 text-red-700"
                        onClick={() => actionMutation.mutate({ id: c.id, action: 'kill' })}><Skull className="w-4 h-4" /></button>
                      <button title="Logs" className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                        onClick={() => setLogsFor(c)}><ScrollText className="w-4 h-4" /></button>
                      <button title="Stats" className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                        onClick={() => setStatsFor(c)}><BarChart3 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {containers.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">No containers found</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {logsFor && <ContainerLogs container={logsFor} onClose={() => setLogsFor(null)} />}
      {statsFor && <ContainerStatsModal container={statsFor} onClose={() => setStatsFor(null)} />}
    </div>
  );
}

function ContainerLogs({ container, onClose }: { container: Container; onClose: () => void }) {
  const [lines, setLines] = useState(100);
  const { data, isLoading } = useQuery({
    queryKey: ['docker-logs', container.id, lines],
    queryFn: async () => {
      const res = await api.get<{ logs: string }>(`/api/docker/${container.id}/logs?lines=${lines}`);
      return res.data;
    },
  });

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="modal bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Logs — {container.name}</h2>
          <div className="flex items-center gap-2">
            <select className="input-x3 input-x3-sm" value={lines} onChange={(e) => setLines(Number(e.target.value))}>
              {[50, 100, 200, 500].map((n) => <option key={n} value={n}>{n} lines</option>)}
            </select>
            <button className="btn-x3-secondary btn-x3-sm" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="p-4 overflow-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : (
            <pre className="text-xs bg-slate-900 text-green-300 p-4 rounded-lg overflow-auto whitespace-pre-wrap">{data?.logs || 'No logs'}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

function ContainerStatsModal({ container, onClose }: { container: Container; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['docker-stats', container.id],
    queryFn: async () => {
      const res = await api.get<ContainerStats>(`/api/docker/${container.id}/stats`);
      return res.data;
    },
    refetchInterval: 3000,
  });

  const rows: [string, string | undefined][] = [
    ['CPU', data?.cpu],
    ['Memory', data?.memUsage],
    ['Mem %', data?.memPerc],
    ['Net I/O', data?.netIO],
    ['Block I/O', data?.blockIO],
    ['PIDs', data?.pids],
  ];

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="modal bg-white rounded-xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Stats — {container.name}</h2>
          <button className="btn-x3-secondary btn-x3-sm" onClick={onClose}>Close</button>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : (
            <dl className="grid grid-cols-2 gap-3">
              {rows.map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="text-sm font-semibold text-slate-900">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
