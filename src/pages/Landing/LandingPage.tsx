import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { 
  BookOpen, ArrowRight, Sparkles, Shield, 
  Layers, UserCheck, Clock, CheckCircle2, Zap, GraduationCap 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: books = [] } = useQuery({
    queryKey: ['books'],
    queryFn: () => dataService.getBooks(),
  });

  const { data: bookTypes = [] } = useQuery({
    queryKey: ['bookTypes'],
    queryFn: () => dataService.getBookTypes(),
  });

  const availableBooksCount = books.reduce((acc, b) => acc + (Number(b.available_copies) || 0), 0);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden bg-slate-50 text-slate-900">
      {/* Immersive Light Background Images with Soft Gradient Overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-[65%] bg-cover bg-center opacity-15 filter blur-[1px] scale-105"
          style={{ backgroundImage: `url('/images/1.jpg')` }}
        />
        <div 
          className="absolute bottom-0 right-0 w-full h-[55%] bg-cover bg-center opacity-15 filter blur-[2px] scale-105"
          style={{ backgroundImage: `url('/images/2.jpg')` }}
        />

        {/* Ambient Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-slate-50/95 to-slate-50" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-200/40 blur-[160px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-teal-200/30 blur-[140px] rounded-full" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 w-full space-y-16">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-sm backdrop-blur-md">
            <img src="/images/logo.png" alt="Talisay Logo" className="w-5 h-5 object-contain" />
            <span className="tracking-wide">Talisay Online Library Management System</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Welcome to <br />
            <span className="gradient-text drop-shadow-xs">Talisay Online Library</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Your gateway to academic literature, technical references, and educational series. Search available copies and submit borrowing requests online.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/catalog')}
              className="px-8 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-800 shadow-lg shadow-emerald-600/20 transition-all duration-300 flex items-center gap-3 text-base group hover:scale-105"
            >
              <BookOpen className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Explore Book Catalog</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/borrow')}
              className="px-7 py-4 rounded-2xl font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all duration-300 flex items-center gap-2.5 text-sm hover:scale-105"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Submit Borrow Request</span>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-6 py-4 rounded-2xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-2 text-sm"
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Animated Stats Floating Cards */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="glass-card p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all duration-300 text-center space-y-1 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{books.length}</p>
              <p className="text-[11px] font-bold text-slate-500">Total Book Titles</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 hover:border-teal-300 transition-all duration-300 text-center space-y-1 group">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{availableBooksCount}</p>
              <p className="text-[11px] font-bold text-slate-500">Copies Available</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 hover:border-cyan-300 transition-all duration-300 text-center space-y-1 group">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{bookTypes.length}</p>
              <p className="text-[11px] font-bold text-slate-500">Book Categories</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 hover:border-violet-300 transition-all duration-300 text-center space-y-1 group">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">1-7 Days</p>
              <p className="text-[11px] font-bold text-slate-500">Borrow Duration</p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-200 space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Instant Online Catalog</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Search by title, filter by Agriculture, Technical, Educational, or Research types, and check real-time stock copies before requesting.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-200 space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Simple Student Workflow</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Select your desired borrowing period (1-7 days), fill in your student ID details, and submit borrowing requests without needing to log in.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-200 space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-700 flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Automated Management</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Librarians approve or reject requests, automatically track due dates and overdue loans, replenishment on return, and configure book series.
            </p>
          </div>
        </div>

        {/* Borrow Rules Info Section */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4 border border-emerald-200 shadow-md">
          <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span>Talisay Library Borrow Rules</span>
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-700 font-medium">
            <li className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <strong className="block text-slate-900 font-bold">Max Duration:</strong>
              Borrow period is between 1 to 7 calendar days max.
            </li>
            <li className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <strong className="block text-slate-900 font-bold">Duplicate Policy:</strong>
              Students cannot submit multiple pending requests for the same book.
            </li>
            <li className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <strong className="block text-slate-900 font-bold">Inventory Tracking:</strong>
              Copies are automatically reserved once an admin approves the request.
            </li>
            <li className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <strong className="block text-slate-900 font-bold">Approval Workflow:</strong>
              Requests remain in 'Pending' status until approved by a librarian.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
