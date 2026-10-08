import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { User } from '../../types';
import { toast } from 'sonner';
import { UserPlus, Key, Edit2, Trash2, Power, X, Copy, CopyCheck } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<User['role']>('Admin');
  const [password, setPassword] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => dataService.getAdminUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { username: string; full_name: string; role: 'Admin' | 'Librarian'; password: string }) =>
      dataService.addAdminUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Admin created.');
      setIsCreateOpen(false);
      setUsername('');
      setFullName('');
      setPassword('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create admin.');
    },
  });

  const editMutation = useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      dataService.updateAdminUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Admin updated.');
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update admin.');
    },
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => dataService.disableAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Admin updated.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Admin deleted.');
    },
  });

  const handleResetPassword = async (u: User) => {
    try {
      const newPassword = await dataService.resetAdminPassword(u.username);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success(`Password reset. New password: ${newPassword}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password.');
    }
  };

  const handleCopyPassword = (u: User) => {
    if (!u.plain_password) return;
    navigator.clipboard.writeText(u.plain_password).then(() => {
      setCopiedId(u.id);
      toast.success(`Password copied for @${u.username}.`);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy password.');
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This form only creates staff accounts (Admin/Librarian options).
    createMutation.mutate({ username, full_name: fullName, role: role === 'Student' ? 'Admin' : role, password });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    editMutation.mutate({
      id: editingUser.id,
      updates: { full_name: fullName, role },
    });
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFullName(u.full_name);
    setRole(u.role);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Admin Account Management</h1>
          <p className="text-xs text-slate-500">Manage administrative users, credentials, roles, and status access.</p>
        </div>

        <button
          onClick={() => {
            setUsername('');
            setFullName('');
            setPassword('');
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Admin User</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading admin accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-600">@{u.username}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.full_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleCopyPassword(u)}
                        disabled={!u.plain_password}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                        title={u.plain_password ? 'Click to copy password' : 'No password set'}
                      >
                        {u.plain_password ? (
                          <>
                            <span className="truncate max-w-[120px]">{u.plain_password}</span>
                            {copiedId === u.id ? (
                              <CopyCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => disableMutation.mutate(u.id)}
                          className={`p-1.5 rounded-lg bg-slate-100 transition-colors ${
                            u.status === 'Active' ? 'text-slate-500 hover:text-amber-600' : 'text-emerald-600'
                          }`}
                          title={u.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        {u.username !== 'woopsy' && (
                          <button
                            onClick={() => deleteMutation.mutate(u.id)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">Create Admin Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. librarian1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ana Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'Admin' | 'Librarian')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="Admin">Admin</option>
                  <option value="Librarian">Librarian</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">Edit Admin User (@{editingUser.username})</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'Admin' | 'Librarian')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="Admin">Admin</option>
                  <option value="Librarian">Librarian</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
