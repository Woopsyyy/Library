import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Users, PlusCircle, ArrowRight, Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: loadingStats } = useQuery({ queryKey: ['dashboardStats'], queryFn: () => dataService.getDashboardStats(), refetchInterval: 5000 });
  const { data: activityLogs = [] } = useQuery({ queryKey: ['activityLogs'], queryFn: () => dataService.getActivityLogs() });
  const cards = [
    { title: 'Total Copies', value: Number(stats?.totalBooks) || 0, icon: BookOpen, color: 'bg-blue-50/80 text-blue-700 border-blue-200' },
    { title: 'Available Copies', value: Number(stats?.availableBooks) || 0, icon: CheckCircle, color: 'bg-emerald-50/80 text-emerald-700 border-emerald-200' },
    { title: 'Admin Users', value: Number(stats?.adminUsersCount) || 0, icon: Users, color: 'bg-violet-50/80 text-violet-700 border-violet-200' },
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4"><div><h1 className="text-2xl font-black text-slate-900">Library Overview</h1><p className="text-xs font-medium text-slate-500">Inventory, availability, and recent administrative activity.</p></div><button type="button" onClick={() => navigate('/admin/books?action=add')} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"><PlusCircle className="w-4 h-4" />Add Book</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{cards.map(card => { const Icon = card.icon; return <div key={card.title} className={`p-4 rounded-2xl border ${card.color} flex items-center justify-between shadow-xs`}><div><span className="text-xs font-bold text-slate-600">{card.title}</span><p className="text-3xl font-black mt-2 text-slate-900">{loadingStats ? '...' : card.value}</p></div><Icon className="w-6 h-6 opacity-80" /></div>; })}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-emerald-600" />Quick Actions</h2><button type="button" onClick={() => navigate('/admin/books?action=add')} className="w-full bg-white hover:bg-slate-50 p-4 rounded-xl flex items-center justify-between text-left group border border-slate-200 shadow-xs"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200"><BookOpen className="w-5 h-5" /></div><div><p className="text-sm font-bold text-slate-900">Add New Book</p><p className="text-[11px] text-slate-500">Expand the library collection</p></div></div><ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" /></button></div>
        <div className="lg:col-span-2 space-y-4"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" />Recent Activity</h2><span className="text-[11px] text-slate-500">Last 20 events</span></div><div className="bg-white rounded-2xl p-4 divide-y divide-slate-100 border border-slate-200 shadow-xs max-h-96 overflow-y-auto">{activityLogs.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">No recent activity recorded.</p> : activityLogs.map(log => <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4"><div className="space-y-0.5"><p className="text-xs font-bold text-slate-900">{log.action}</p>{log.details && <p className="text-[11px] text-slate-600">{log.details}</p>}</div><div className="text-right whitespace-nowrap"><span className="text-[10px] font-mono font-bold text-emerald-700 block">{log.user_name}</span><span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></div>)}</div></div>
      </div>
    </div>
  );
};
