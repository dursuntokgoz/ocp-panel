import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, FileText, Filter, RefreshCw, Download } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { clsx } from 'clsx';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
}

export function SystemLogs() {
  const { showToast } = useToast();
  const [selectedSource, setSelectedSource] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs', selectedSource, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '100' });
      if (selectedSource !== 'all') params.append('source', selectedSource);
      if (search) params.append('search', search);
      const response = await api.get<{ logs: LogEntry[]; total: number }>(`/api/logs?${params}`);
      return response.data;
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const sources = ['all', 'system', 'nginx', 'mysql', 'php', 'mail', 'firewall', 'backup'];

  const levelColors = {
    error: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
    debug: 'badge-gray',
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Parse logs from the raw journalctl output
  const parseLogs = (logsString: string): LogEntry[] => {
    if (!logsString) return [];
    return logsString.split('\n').filter(Boolean).map((line, index) => {
      // Parse journalctl short format: "Aug 24 14:29:01 python[2471]: message"
      const match = line.match(/^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s*:\s*(.*)$/);
      if (match) {
        const [, timestamp, source, message] = match;
        let level: LogEntry['level'] = 'info';
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('exception')) level = 'error';
        else if (lowerMsg.includes('warn')) level = 'warning';
        else if (lowerMsg.includes('debug')) level = 'debug';
        return { timestamp, level, message, source };
      }
      return { timestamp: new Date().toISOString(), level: 'info', message: line, source: 'system' };
    });
  };

  const parsedLogs = parseLogs(data?.logs || '');

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Error Logs</h1>
          <p className="page-subtitle">View system and application logs</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded" />
            Auto-refresh (5s)
          </label>
          <button className="btn-x3-secondary btn-x3-sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </button>
          <button className="btn-x3-secondary btn-x3-sm">
            <Download className="w-4 h-4 mr-1" /> Download
          </button>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="border-b border-slate-200 px-4 py-3 flex flex-wrap gap-4">
            <div className="flex gap-2">
              {sources.map((source) => (
                <button
                  key={source}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded transition-colors',
                    selectedSource === source
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                  onClick={() => { setSelectedSource(source); setPage(1); }}
                >
                  {source === 'all' ? 'All Sources' : source.charAt(0).toUpperCase() + source.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter messages..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="x3-input pl-10 w-64"
              />
            </div>
          </div>

          <div className="h-96 overflow-y-auto font-mono text-sm">
            {parsedLogs.map((log, index) => (
              <div
                key={index}
                className={`px-4 py-2 border-b border-slate-100 hover:bg-slate-50 ${log.level === 'error' ? 'bg-red-50' : ''}`}
              >
                <div className="flex gap-3">
                  <span className="text-slate-400 w-32 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={clsx('badge whitespace-nowrap shrink-0', levelColors[log.level])}>{log.level.toUpperCase()}</span>
                  <span className="text-slate-500 w-24 shrink-0">{log.source}</span>
                  <span className="flex-1 break-all">{log.message}</span>
                </div>
              </div>
            ))}
            {(!parsedLogs.length) && (
              <div className="p-8 text-center text-slate-500">
                No log entries found
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}