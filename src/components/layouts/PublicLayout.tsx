import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Shield, GraduationCap, Library } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/images/logo.png" 
              alt="Talisay Library Logo" 
              className="w-10 h-10 rounded-xl object-contain bg-slate-100 p-1 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform" 
            />
            <div>
              <span className="font-extrabold text-lg tracking-tight gradient-text">
                Talisay Library
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Online Catalog & Borrowing
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/catalog"
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              Book Catalog
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Admin Login</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-16 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-700">Talisay Online Library Management System v1.0</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Talisay Library. Designed for seamless student borrowing.
          </p>
        </div>
      </footer>
    </div>
  );
};
