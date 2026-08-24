import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Calendar, Clock, Plus } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { clsx } from 'clsx';

interface CronJob {
  id: string;
  schedule: string;
  command: string;
  user: string;
  enabled: boolean;
  nextRun: string;
  lastRun: string | null;
}

export function SystemCron() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cron'],
    queryFn: async () => {
      const response = await api.get<{ jobs: CronJob[] }>('/api/cron');
      return response.data;
    },
  });

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Cron</h1>
          <p className="page-subtitle">Manage scheduled tasks</p>
        </div>
        <button className="btn-x3-primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Job
        </button>
      </div>

      <Card>
        <CardHeader title="Scheduled Jobs" subtitle={`${data?.jobs?.length || 0} jobs configured`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Schedule</th>
                  <th>Command</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Next Run</th>
                  <th>Last Run</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.jobs?.map((job) => (
                  <tr key={job.id}>
                    <td className="font-mono text-sm">{job.schedule}</td>
                    <td className="font-mono text-sm max-w-xs truncate">{job.command}</td>
                    <td>{job.user}</td>
                    <td>
                      <span className={clsx('badge', job.enabled ? 'badge-success' : 'badge-gray')}>
                        {job.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500">{job.nextRun}</td>
                    <td className="text-sm text-slate-500">{job.lastRun || 'Never'}</td>
                    <td className="text-right">
                      <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>Edit</button>
                      <button className={clsx('btn-x3-sm mr-1', job.enabled ? 'btn-x3-secondary' : 'btn-x3-primary')} disabled>
                        {job.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn-x3-danger btn-x3-sm" disabled>Delete</button>
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