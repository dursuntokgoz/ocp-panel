import { useState } from 'react';
import { api } from '../api/client';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';

export function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (next !== confirm) {
      setError('Yeni parolalar eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/me/password', { current, next });
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Parola değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="page-header">
        <h1 className="page-title">Change Password</h1>
        <p className="page-subtitle">Update your panel password</p>
      </div>

      <Card>
        <CardBody className="p-6">
          {success && (
            <div className="alert alert-success mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Parola başarıyla değiştirildi
            </div>
          )}
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Current Password</label>
              <input type="password" className="input-x3 w-full mt-1" value={current}
                onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <input type="password" className="input-x3 w-full mt-1" value={next}
                onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" />
              <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
              <input type="password" className="input-x3 w-full mt-1" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <button type="submit" className="btn-x3-primary flex items-center gap-2" disabled={loading}>
              <KeyRound className="w-4 h-4" />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
