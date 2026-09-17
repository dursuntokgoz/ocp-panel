import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, UserPlus, Trash2, Shield, Pencil } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';

interface PanelUser {
  id: number;
  username: string;
  role: string;
  name: string;
  active: boolean;
  created: string;
  lastLogin: string | null;
}

interface UsersResponse {
  users: PanelUser[];
  roles: Record<string, { label: string; permissions: string[] }>;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'badge badge-error',
  reseller: 'badge badge-success',
  user: 'badge',
};

export function SystemUsers() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PanelUser | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['panel-users'],
    queryFn: async () => {
      const res = await api.get<UsersResponse>('/api/users');
      return res.data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['panel-users'] });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, string>) => (await api.post('/api/users', body)).data,
    onSuccess: () => { setShowCreate(false); setError(''); invalidate(); },
    onError: (e: unknown) => setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      (await api.put(`/api/users/${id}`, body)).data,
    onSuccess: () => { setEditing(null); setError(''); invalidate(); },
    onError: (e: unknown) => setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/api/users/${id}`)).data,
    onSuccess: invalidate,
  });

  const meUsername = ((): string => {
    try { return JSON.parse(localStorage.getItem('ocp_user') || '{}').username; } catch { return ''; }
  })();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (loadError) {
    return <div className="alert alert-error">Failed to load users — you may not have permission.</div>;
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">User Manager</h1>
          <p className="page-subtitle">Panel users and roles (RBAC)</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-x3-secondary btn-x3-sm" onClick={() => refetch()}>Refresh</button>
          <button className="btn-x3-primary btn-x3-sm flex items-center gap-1" onClick={() => { setShowCreate(true); setError(''); }}>
            <UserPlus className="w-4 h-4" /> Create User
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <Card>
        <CardBody className="p-0">
          <table className="table-x3 w-full">
            <thead>
              <tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Last Login</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {(data?.users || []).map((u) => (
                <tr key={u.id}>
                  <td className="font-medium font-mono">{u.username}{u.username === meUsername && <span className="text-xs text-slate-400 ml-1">(you)</span>}</td>
                  <td className="text-sm text-slate-600">{u.name}</td>
                  <td><span className={ROLE_COLORS[u.role] || 'badge'}><Shield className="w-3 h-3 inline mr-1" />{u.role}</span></td>
                  <td><span className={u.active ? 'badge badge-success' : 'badge badge-error'}>{u.active ? 'active' : 'disabled'}</span></td>
                  <td className="text-sm text-slate-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('tr-TR') : 'never'}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button title="Edit" className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                        onClick={() => { setEditing(u); setError(''); }}><Pencil className="w-4 h-4" /></button>
                      {u.username !== meUsername && (
                        <button title="Delete" className="p-1.5 rounded hover:bg-red-50 text-red-600"
                          disabled={deleteMutation.isPending}
                          onClick={() => { if (confirm(`Delete user ${u.username}?`)) deleteMutation.mutate(u.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.users || []).length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">No users</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {showCreate && (
        <UserModal
          title="Create User"
          roles={Object.keys(data?.roles || { admin: 1, reseller: 1, user: 1 })}
          onClose={() => setShowCreate(false)}
          onSubmit={(body) => createMutation.mutate(body as Record<string, string>)}
        />
      )}
      {editing && (
        <UserModal
          title={`Edit User — ${editing.username}`}
          user={editing}
          roles={Object.keys(data?.roles || { admin: 1, reseller: 1, user: 1 })}
          onClose={() => setEditing(null)}
          onSubmit={(body) => updateMutation.mutate({ id: editing.id, body })}
        />
      )}
    </div>
  );
}

function UserModal({
  title, user, roles, onClose, onSubmit,
}: {
  title: string;
  user?: PanelUser;
  roles: string[];
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'user');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(user?.active ?? true);

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="modal bg-white rounded-xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b"><h2 className="font-semibold text-lg">{title}</h2></div>
        <form
          className="p-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const body: Record<string, unknown> = { name, role, active };
            if (!user) body.username = username;
            if (password) body.password = password;
            onSubmit(body);
          }}
        >
          {!user && (
            <div>
              <label className="text-sm font-medium text-slate-700">Username</label>
              <input className="input-x3 w-full mt-1" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" required />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700">Display Name</label>
            <input className="input-x3 w-full mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select className="input-x3 w-full mt-1" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password {user && '(leave blank to keep)'}</label>
            <input type="password" className="input-x3 w-full mt-1" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={user ? '••••••••' : 'min 8 characters'} minLength={user ? 0 : 8} required={!user} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
          </label>
          <div className="modal-footer flex justify-end gap-2 pt-2">
            <button type="button" className="btn-x3-secondary btn-x3-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-x3-primary btn-x3-sm">{user ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
