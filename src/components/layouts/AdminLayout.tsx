import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Inbox, BookmarkCheck, 
  RotateCcw, Users, Settings, LogOut, Library, Menu, X, ExternalLink
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = dataService.getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dataService.logoutAdmin();
    toast.success('Logout successful.');
    navigate('/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/books', label: 'Books', icon: BookOpen },
    { to: '/admin/requests', label: 'Borrow Requests', icon: Inbox },
    { to: '/admin/borrowed', label: 'Borrowed Books', icon: BookmarkCheck },
    { to: '/admin/returns', label: 'Returns', icon: RotateCcw },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/config', label: 'Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900">Talisay Admin</span>
              <span className="block text-[10px] uppercase font-bold text-emerald-600">Library Portal</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-500 hover:text-slate-900 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick View Public Site & User info */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span>View Student Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.full_name || 'Admin User'}</p>
              <p className="text-[11px] text-emerald-600 font-mono">@{currentUser?.username || 'woopsy'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white/90 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-800">
              Admin Portal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Database Active
            </span>
          </div>
        </header>

        {/* Dynamic Admin Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
