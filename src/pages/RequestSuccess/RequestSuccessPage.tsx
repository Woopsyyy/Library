import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, BookOpen, Clock, ArrowRight } from 'lucide-react';

export const RequestSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { studentName?: string; bookTitle?: string; durationDays?: number } | null;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100 animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-800">Request Submitted!</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Your borrow request has been successfully registered and sent to the Talisay Library administration.
        </p>
      </div>

      {state && (
        <div className="bg-white rounded-2xl p-6 text-left space-y-3 text-xs border border-slate-200 shadow-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Student Name:</span>
            <span className="font-bold text-slate-700">{state.studentName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Requested Book:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {state.bookTitle}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Borrow Duration:</span>
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              {state.durationDays} Days
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Current Status:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
              Pending Admin Approval
            </span>
          </div>
        </div>
      )}

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-200 transition-all"
        >
          <span>Return to Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
