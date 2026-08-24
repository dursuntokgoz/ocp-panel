import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useState } from 'react';
import { clsx } from 'clsx';

interface Reseller {
  username: string;
  package: string;
  email: string;
  domainCount: number;
  diskUsed: number;
  created: string;
  status: 'active' | 'suspended';
}

interface ApiResponse<T> {
  ok: boolean;
  resellers: T[];
}

export function WHMResellers() {
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['resellers'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Reseller>>('/api/whm/resellers');
      return response.data.resellers || [];
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
          <h1 className="page-title">Resellers</h1>
          <p className="page-subtitle">Manage reseller accounts</p>
        </div>
        <button className="btn-x3-primary" onClick={() => { setEditingReseller(null); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create Reseller
        </button>
      </div>

      <Card>
        <CardHeader title="Reseller Center" subtitle={`${data?.resellers?.length || 0} resellers`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Package</th>
                  <th>Domains</th>
                  <th>Disk Usage</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.resellers?.map((reseller: Reseller) => (
                  <tr key={reseller.username}>
                    <td className="font-medium">{reseller.username}</td>
                    <td><span className="badge badge-info">{reseller.package}</span></td>
                    <td>{reseller.domainCount}</td>
                    <td>{formatBytes(reseller.diskUsed)}</td>
                    <td>
                      <span className={clsx('badge', reseller.status === 'active' ? 'badge-success' : 'badge-warning')}>
                        {reseller.status}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500">{new Date(reseller.created).toLocaleDateString()}</td>
                    <td className="text-right">
                      <button className="btn-x3-secondary btn-x3-sm mr-1" onClick={() => { setEditingReseller(reseller); setShowCreateModal(true); }}>
                        <Edit className="w-4 h-4" />
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
  );
}