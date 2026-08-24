import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Lock, Server, AlertCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      showToast('Login successful', 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Invalid username or password';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <Server className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">OCP Panel</h1>
          <p className="text-slate-500 mt-1">Gerçek Sunucu Kontrol Paneli</p>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900">Sign In</h2>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-error mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="x3-label">Username</label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="x3-input pl-10"
                    placeholder="admin"
                    disabled={isLoading || authLoading}
                    required
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Server className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="x3-label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="x3-input pl-10"
                    placeholder="••••••••"
                    disabled={isLoading || authLoading}
                    required
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-x3-primary w-full"
                disabled={isLoading || authLoading}
              >
                {isLoading || authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
              <p>Demo credentials: <code className="bg-slate-100 px-1.5 py-0.5 rounded">admin</code> / <code className="bg-slate-100 px-1.5 py-0.5 rounded">9952f52f</code></p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          cPanel X3 Theme • OCP Panel v2.0
        </p>
      </div>
    </div>
  );
}