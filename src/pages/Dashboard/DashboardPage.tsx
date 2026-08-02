import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, CheckCircle, BookmarkCheck, Inbox, AlertTriangle, 
  Users, PlusCircle, ArrowRight, Activity, RotateCcw 
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dataService.getDashboardStats(),
    refetchInterval: 5000,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: () => dataService.getActivityLogs(),
  });

  const cards = [
    {
      title: 'Total Books',
      value: isNaN(Number(stats?.totalBooks)) ? 0 : Number(stats?.totalBooks),
      icon: BookOpen,
      color: 'bg-blue-50/80 text-blue-700 border-blue-200',
    },
    {
      title: 'Available Books',
      value: isNaN(Number(stats?.availableBooks)) ? 0 : Number(stats?.availableBooks),
      icon: CheckCircle,
      color: 'bg-emerald-50/80 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Borrowed Books',
      value: isNaN(Number(stats?.borrowedBooks)) ? 0 : Number(stats?.borrowedBooks),
      icon: BookmarkCheck,
      color: 'bg-teal-50/80 text-teal-700 border-teal-200',
    },
    {
      title: 'Pending Requests',
      value: isNaN(Number(stats?.pendingRequests)) ? 0 : Number(stats?.pendingRequests),
      icon: Inbox,
      color: 'bg-amber-50/80 text-amber-700 border-amber-200',
    },
    {
      title: 'Overdue Books',
      value: isNaN(Number(stats?.overdueBooks)) ? 0 : Number(stats?.overdueBooks),
      icon: AlertTriangle,
      color: 'bg-rose-50/80 text-rose-700 border-rose-200',
    },
    {
      title: 'Admin Users',
      value: isNaN(Number(stats?.adminUsersCount)) ? 0 : Number(stats?.adminUsersCount),
      icon: Users,
      color: 'bg-violet-50/80 text-violet-700 border-violet-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Library Overview</h1>
          <p className="text-xs font-medium text-slate-500">Real-time statistics, inventory metrics, and administrative activities.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/books?action=add')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${card.color} flex flex-col justify-between space-y-3 shadow-xs`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">{card.title}</span>
                <Icon className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-black tracking-tight text-slate-900">
                {loadingStats ? '...' : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activities split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Quick Actions</span>
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/books?action=add')}
              className="w-full bg-white hover:bg-slate-50 p-4 rounded-xl flex items-center justify-between text-left group border border-slate-200 shadow-xs transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Add New Book</p>
                  <p className="text-[11px] text-slate-500 font-medium">Expand the library collection</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/requests')}
              className="w-full bg-white hover:bg-slate-50 p-4 rounded-xl flex items-center justify-between text-left group border border-slate-200 shadow-xs transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Review Requests</p>
                  <p className="text-[11px] text-slate-500 font-medium">Approve or reject student submissions</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/returns')}
              className="w-full bg-white hover:bg-slate-50 p-4 rounded-xl flex items-center justify-between text-left group border border-slate-200 shadow-xs transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Process Returns</p>
                  <p className="text-[11px] text-slate-500 font-medium">Log returned books to inventory</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        {/* Recent Activities Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Recent Activity Stream</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">Last 20 events</span>
          </div>

          <div className="bg-white rounded-2xl p-4 divide-y divide-slate-100 border border-slate-200 shadow-xs max-h-96 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">No recent activity recorded.</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{log.action}</p>
                    {log.details && <p className="text-[11px] text-slate-600 font-medium">{log.details}</p>}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 block">{log.user_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
