import { useQuery } from '@tanstack/react-query';
import { api, apiEndpoints } from '../../api/client';
import { Loader2, Mail, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useState } from 'react';

interface EmailAccount {
  email: string;
  domain: string;
  quota: number;
  used: number;
  created: string;
}

interface ApiResponse<T> {
  ok: boolean;
  emails: T[];
}

export function WHMEmail() {
  const { data, isLoading } = useQuery({
    queryKey: ['email'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<EmailAccount>>(apiEndpoints.whm.email);
      return response.data.emails || [];
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
          <h1 className="page-title">Email</h1>
          <p className="page-subtitle">Manage email accounts</p>
        </div>
        <button className="btn-x3-primary" disabled>
          <Plus className="w-4 h-4 mr-2" /> Create Account
        </button>
      </div>

      <Card>
        <CardHeader title="Email Accounts" subtitle={`${data?.length || 0} accounts`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Quota</th>
                  <th>Used</th>
                  <th>Usage</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((account: any) => (
                  <tr key={account.email}>
                    <td className="font-medium">{account.email}</td>
                    <td>{account.quota > 0 ? formatBytes(account.quota * 1024 * 1024) : 'Unlimited'}</td>
                    <td>{formatBytes(account.used || 0)}</td>
                    <td>
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: account.quota > 0 ? `${(account.used / (account.quota * 1024 * 1024)) * 100}%` : '0%' }}
                        />
                      </div>
                    </td>
                    <td className="text-sm text-slate-500">{new Date(account.created).toLocaleDateString()}</td>
                    <td className="text-right">
                      <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>Edit</button>
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