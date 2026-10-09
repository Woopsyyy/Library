import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Shield, KeyRound, User, Library, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || null;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error('Please enter your username or School ID and password.');
      return;
    }

    setLoading(true);
    try {
      // Single lookup in users — admins go to the admin page, students to theirs.
      const user = await dataService.loginUser(identifier, password);
      if (from) {
        // User was sent here by a guard (e.g. clicked Borrow while logged out) — send them back.
        // Admins should never land on student-only pages, so keep them on the dashboard instead.
        if (user.account_type === 'admin' && (from.startsWith('/borrow') || from.startsWith('/student'))) {
          toast.success('Login successful.');
          navigate('/admin/dashboard', { replace: true });
        } else {
          toast.success(user.account_type === 'admin' ? 'Login successful.' : 'Welcome back!');
          navigate(from, { replace: true });
        }
      } else if (user.account_type === 'admin') {
        toast.success('Login successful.');
        navigate('/admin/dashboard');
      } else {
        toast.success('Welcome back!');
        navigate('/student');
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50 text-slate-900 relative">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-md">
            <Library className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Talisay Library Login
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Sign in with your username or School ID (e.g. 2026-1234).
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200 shadow-md">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Username or School ID</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Username or School ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 font-medium">
            Student without an account?{' '}
            <Link to="/signup" className="font-bold text-emerald-700 hover:text-emerald-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
