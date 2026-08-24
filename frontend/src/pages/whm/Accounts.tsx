import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Plus, Edit, Trash2, Search, Loader2, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { clsx } from 'clsx';

interface Account {
  username: string;
  domain: string;
  package: string;
  email: string;
  disk_used: number;
  disk_limit: number;
  created: string;
  status: 'active' | 'suspended';
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface ApiResponse<T> {
  ok: boolean;
  accounts: T[];
}

export function WHMAccounts() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.append('search', search);
      const response = await api.get<ApiResponse<Account>>(`/api/whm/accounts?${params}`);
      return { data: response.data.accounts, total: response.data.accounts.length, page, limit: 20 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (account: Omit<Account, 'created' | 'disk_used'>) => api.post('/api/whm/accounts', account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showToast('Account created successfully', 'success');
      setShowCreateModal(false);
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to create account', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (account: Account) => api.put(`/api/whm/accounts/${account.username}`, account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showToast('Account updated successfully', 'success');
      setEditingAccount(null);
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to update account', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (username: string) => api.delete(`/api/whm/accounts/${username}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showToast('Account deleted successfully', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to delete account', 'error'),
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = (account: Account) => {
    if (editingAccount) {
      updateMutation.mutate(account);
    } else {
      createMutation.mutate(account);
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
          <h1 className="page-title">Account Functions</h1>
          <p className="page-subtitle">Manage hosting accounts</p>
        </div>
        <button
          className="btn-x3-primary"
          onClick={() => { setEditingAccount(null); setShowCreateModal(true); }}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Account
        </button>
      </div>

      <Card>
        <CardHeader title="Accounts List" subtitle={`${data?.total || 0} total accounts`} />
        <CardBody>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="x3-input pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Domain</th>
                  <th>Package</th>
                  <th>Disk Usage</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((account) => (
                  <tr key={account.username}>
                    <td className="font-medium">{account.username}</td>
                    <td>{account.domain}</td>
                    <td>
                      <span className="badge badge-info">{account.package}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-xs">
                          <div
                            className={`h-full rounded-full ${
                              account.disk_limit > 0 && (account.disk_used / account.disk_limit) > 0.8
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: account.disk_limit > 0 ? `${(account.disk_used / account.disk_limit) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatBytes(account.disk_used)} / {formatBytes(account.disk_limit)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={clsx('badge', account.status === 'active' ? 'badge-success' : 'badge-warning')}>
                        {account.status}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500">{new Date(account.created).toLocaleDateString()}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                          onClick={() => { setEditingAccount(account); setShowCreateModal(true); }}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Delete account ${account.username}?`)) {
                              deleteMutation.mutate(account.username);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.total > 20 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Page {page} of {Math.ceil(data.total / 20)}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn-x3-secondary btn-x3-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  className="btn-x3-secondary btn-x3-sm"
                  onClick={() => setPage((p) => Math.min(Math.ceil(data.total / 20), p + 1))}
                  disabled={page >= Math.ceil(data.total / 20)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAccount) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingAccount(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingAccount ? 'Edit Account' : 'Create Account'}</h3>
              <button className="p-1 text-slate-400 hover:text-slate-600" onClick={() => { setShowCreateModal(false); setEditingAccount(null); }}>
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <AccountForm
              initialData={editingAccount}
              onSubmit={handleSubmit}
              onCancel={() => { setShowCreateModal(false); setEditingAccount(null); }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface AccountFormProps {
  initialData: Account | null;
  onSubmit: (account: Account) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function AccountForm({ initialData, onSubmit, onCancel, isLoading }: AccountFormProps) {
  const [form, setForm] = useState({
    username: '',
    domain: '',
    package: 'default',
    email: '',
    disk_limit: 5368709120, // 5GB
    password: '',
    status: 'active' as 'active' | 'suspended',
  });

  useState(() => {
    if (initialData) {
      setForm({
        username: initialData.username,
        domain: initialData.domain,
        package: initialData.package,
        email: initialData.email,
        disk_limit: initialData.disk_limit,
        password: '',
        status: initialData.status,
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="x3-label">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="x3-input"
            disabled={!!initialData}
            placeholder="username"
            required
          />
        </div>
        <div>
          <label className="x3-label">Domain</label>
          <input
            type="text"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            className="x3-input"
            placeholder="example.com"
            required
          />
        </div>
        <div>
          <label className="x3-label">Package</label>
          <select
            value={form.package}
            onChange={(e) => setForm({ ...form, package: e.target.value })}
            className="x3-input"
          >
            <option value="default">Default</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div>
          <label className="x3-label">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="x3-input"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label className="x3-label">Disk Limit (GB)</label>
          <input
            type="number"
            value={form.disk_limit / 1073741824}
            onChange={(e) => setForm({ ...form, disk_limit: parseInt(e.target.value) * 1073741824 })}
            className="x3-input"
            min="1"
            max="1000"
          />
        </div>
        <div>
          <label className="x3-label">{initialData ? 'New Password (leave blank to keep current)' : 'Password'}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="x3-input"
            placeholder="••••••••"
            required={!initialData}
          />
        </div>
      </div>
      <div>
        <label className="x3-label">Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'suspended' })}
          className="x3-input"
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-x3-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-x3-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}