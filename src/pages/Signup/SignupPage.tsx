import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dataService, generateSchoolId, isValidSchoolId } from '../../services/dataService';
import { toast } from 'sonner';
import { GraduationCap, IdCard, User, KeyRound, ArrowLeft, Dices, UserPlus } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setSchoolId(generateSchoolId());
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!isValidSchoolId(schoolId)) {
      toast.error(`School ID must look like ${year}-1234.`);
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      toast.error('Username must be at least 3 characters.');
      return;
    }
    if (/\s/.test(username)) {
      toast.error('Username cannot contain spaces.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await dataService.signupStudent({ school_id: schoolId, username, full_name: fullName, password });
      toast.success('Account created. Welcome to your library!');
      navigate('/student');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50 text-slate-900 relative">
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
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-md">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Create Student Account</h1>
          <p className="text-xs text-slate-600 font-medium">
            Sign up with your School ID and a username — you can sign in later with either one.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200 shadow-md">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">School ID</label>
              <div className="relative">
                <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder={`${year}-1234`}
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  title="Generate a valid School ID"
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Format: <span className="font-mono font-bold">{year}-XXXX</span> (current year + 4 random digits)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. juan_dc (no spaces)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                You can sign in with this username or your School ID.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
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
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
