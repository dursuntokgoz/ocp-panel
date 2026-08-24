import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Shield, Key, Calendar, Download, Plus } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useState } from 'react';
import { clsx } from 'clsx';

interface Certificate {
  domain: string;
  type: 'letsencrypt' | 'custom';
  expires: string;
  issuer: string;
  san: string[];
  status: 'valid' | 'expiring' | 'expired';
}

export function SystemSSL() {
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ssl'],
    queryFn: async () => {
      const response = await api.get<{ certificates: Certificate[] }>('/api/ssl');
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'badge-success';
      case 'expiring': return 'badge-warning';
      case 'expired': return 'badge-danger';
      default: return 'badge-gray';
    }
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
          <h1 className="page-title">SSL/TLS Manager</h1>
          <p className="page-subtitle">Manage SSL certificates and Let's Encrypt</p>
        </div>
        <button className="btn-x3-primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Certificate
        </button>
      </div>

      <Card>
        <CardHeader title="Certificates" subtitle={`${data?.certificates?.length || 0} certificates`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Type</th>
                  <th>Issuer</th>
                  <th>Expires</th>
                  <th>SAN</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.certificates?.map((cert) => (
                  <tr key={cert.domain}>
                    <td className="font-medium">{cert.domain}</td>
                    <td>
                      <span className={clsx('badge', cert.type === 'letsencrypt' ? 'badge-info' : 'badge-gray')}>
                        {cert.type === 'letsencrypt' ? 'Let\'s Encrypt' : 'Custom'}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500 max-w-xs truncate">{cert.issuer}</td>
                    <td>{new Date(cert.expires).toLocaleDateString()}</td>
                    <td>
                      <span className="text-sm text-slate-500">{cert.san.join(', ') || '—'}</span>
                    </td>
                    <td>
                      <span className={clsx('badge', getStatusColor(cert.status))}>{cert.status}</span>
                    </td>
                    <td className="text-right">
                      <button className="btn-x3-secondary btn-x3-sm mr-1">
                        <Download className="w-4 h-4" />
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