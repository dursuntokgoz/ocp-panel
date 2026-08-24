import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, HardDrive, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useState } from 'react';

interface FTPAccount {
  user: string;
  domain: string;
  path: string;
  quota: number;
  created: string;
}

interface ApiResponse<T> {
  ok: boolean;
  ftp: T[];
}

export function WHMFTP() {
  const { data, isLoading } = useQuery({
    queryKey: ['ftp'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<FTPAccount>>('/api/whm/ftp');
      return response.data.ftp || [];
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
          <h1 className="page-title">FTP Functions</h1>
          <p className="page-subtitle">Manage FTP accounts</p>
        </div>
        <button className="btn-x3-primary" disabled>
          <Plus className="w-4 h-4 mr-2" /> Create Account
        </button>
      </div>

      <Card>
        <CardHeader title="FTP Accounts" subtitle={`${data?.accounts?.length || 0} accounts`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Domain</th>
                  <th>Path</th>
                  <th>Quota</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.accounts?.map((account: any) => (
                  <tr key={account.user}>
                    <td className="font-medium">{account.user}</td>
                    <td>{account.domain}</td>
                    <td className="font-mono text-sm">{account.path}</td>
                    <td>{account.quota > 0 ? `${account.quota} MB` : 'Unlimited'}</td>
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