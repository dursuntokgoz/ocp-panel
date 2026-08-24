import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, HardDrive, Cloud, Plus, Download, RotateCcw, Trash2, Settings, Upload } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { clsx } from 'clsx';

interface Backup {
  name: string;
  size: number;
  created: string;
  sources: string[];
  s3?: { key: string; uploaded: string };
}

interface BackupSettings {
  dir: string;
  sources: string[];
  s3?: {
    enabled: boolean;
    endpoint: string;
    bucket: string;
    prefix: string;
  };
}

export function SystemBackups() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'list' | 'settings' | 's3'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: backupsData, isLoading: backupsLoading, refetch: refetchBackups } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await api.get('/api/backups');
      return response.data.backups || [];
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ['backups', 'settings'],
    queryFn: async () => {
      const response = await api.get('/api/backups/settings');
      return response.data;
    },
  });

  const { data: s3Data } = useQuery({
    queryKey: ['backups', 's3'],
    queryFn: async () => {
      const response = await api.get('/api/backups/s3/list');
      return response.data.backups || [];
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'list', label: 'Backups', icon: HardDrive },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 's3', label: 'S3/MinIO', icon: Cloud },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Backups</h1>
          <p className="page-subtitle">Manage backups and S3/MinIO storage</p>
        </div>
        {activeTab === 'list' && (
          <button className="btn-x3-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Backup
          </button>
        )}
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

      {activeTab === 'list' && (
        <Card>
          <CardHeader title="Backups" subtitle={`${backupsData?.length || 0} backups`} />
          <CardBody>
            {backupsLoading && !backupsData && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            {!backupsLoading && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th>Sources</th>
                      <th>S3 Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupsData?.map((backup: Backup) => (
                      <tr key={backup.name}>
                        <td className="font-medium">{backup.name}</td>
                        <td>{formatBytes(backup.size)}</td>
                        <td className="text-sm text-slate-500">{new Date(backup.created || backup.mtime).toLocaleString()}</td>
                        <td className="text-sm text-slate-500 max-w-xs truncate">
                          {backup.sources && backup.sources.length > 0 ? backup.sources.join(', ') : '—'}
                        </td>
                        <td>
                          {backup.s3 ? (
                            <span className="badge badge-success">Uploaded</span>
                          ) : (
                            <span className="badge badge-gray">Local only</span>
                          )}
                        </td>
                        <td className="text-right">
                          <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          {backup.s3 && (
                            <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>
                              <Cloud className="w-4 h-4" />
                            </button>
                          )}
                          <button className="btn-x3-danger btn-x3-sm" disabled>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Backup Directory & Sources" />
            <CardBody className="space-y-4">
              <div>
                <label className="x3-label">Backup Directory</label>
                <input
                  type="text"
                  className="x3-input"
                  defaultValue={settingsData?.settings?.dir || '/home/dursun/backups'}
                  disabled
                />
              </div>
              <div>
                <label className="x3-label">Default Sources (one per line)</label>
                <textarea
                  className="x3-input h-32 font-mono text-sm"
                  defaultValue={(settingsData?.settings?.sources || []).join('\n') || '/home'}
                  disabled
                />
              </div>
              <button className="btn-x3-primary" disabled>Save Settings</button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Schedule" subtitle="Automatic backup timing" />
            <CardBody className="space-y-4">
              <div>
                <label className="x3-label">Frequency</label>
                <select className="x3-input" disabled>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Cron</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="x3-label">Hour (0-23)</label>
                  <input type="number" className="x3-input" min="0" max="23" defaultValue="3" disabled />
                </div>
                <div>
                  <label className="x3-label">Minute (0-59)</label>
                  <input type="number" className="x3-input" min="0" max="59" defaultValue="0" disabled />
                </div>
              </div>
              <button className="btn-x3-primary" disabled>Save Schedule</button>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 's3' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="S3/MinIO Configuration" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="font-medium">Enable S3/MinIO Backup Upload</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="x3-label">Endpoint</label>
                  <input type="text" className="x3-input" placeholder="https://s3.amazonaws.com" disabled />
                </div>
                <div>
                  <label className="x3-label">Region</label>
                  <input type="text" className="x3-input" placeholder="us-east-1 / auto" disabled />
                </div>
                <div>
                  <label className="x3-label">Access Key</label>
                  <input type="text" className="x3-input" placeholder="AKIA..." disabled />
                </div>
                <div>
                  <label className="x3-label">Secret Key</label>
                  <input type="password" className="x3-input" placeholder="••••••••" disabled />
                </div>
                <div>
                  <label className="x3-label">Bucket</label>
                  <input type="text" className="x3-input" placeholder="my-backups" disabled />
                </div>
                <div>
                  <label className="x3-label">Prefix</label>
                  <input type="text" className="x3-input" placeholder="backups/" defaultValue="backups/" disabled />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-x3-secondary" disabled>
                  <Settings className="w-4 h-4 mr-1" /> Test Connection
                </button>
                <button className="btn-x3-primary" disabled>
                  <Cloud className="w-4 h-4 mr-1" /> Save & Enable
                </button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="S3 Backups" subtitle="Backups stored in S3/MinIO" />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Size</th>
                      <th>Last Modified</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s3Data?.map((item: any) => (
                      <tr key={item.key}>
                        <td className="font-mono text-sm">{item.key}</td>
                        <td>{formatBytes(item.size)}</td>
                        <td className="text-sm text-slate-500">{new Date(item.lastModified).toLocaleString()}</td>
                        <td className="text-right">
                          <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="btn-x3-danger btn-x3-sm" disabled>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}