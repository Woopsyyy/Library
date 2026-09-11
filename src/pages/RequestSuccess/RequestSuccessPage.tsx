import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, BookOpen, Clock, ArrowRight, Hash, User, GraduationCap } from 'lucide-react';

export const RequestSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as {
    inquiryNumber?: string;
    studentName?: string;
    studentId?: string;
    course?: string;
    yearLevel?: string;
    section?: string;
    bookTitle?: string;
    durationDays?: number;
  } | null;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100 animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-800">Request Submitted!</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Your borrow request has been successfully registered. Take a screenshot of this page and give it to your librarian.
        </p>
      </div>

      {state && (
        <div className="bg-white rounded-2xl p-6 text-left space-y-3 text-xs border border-slate-200 shadow-sm">
          {/* Inquiry Number - Prominent */}
          {state.inquiryNumber && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Your Inquiry Number</span>
              <p className="text-xl font-black text-emerald-700 tracking-widest">{state.inquiryNumber}</p>
              <p className="text-[10px] text-emerald-600 font-medium">
                Enter this on the home page to check your request status anytime.
              </p>
            </div>
          )}

          <div className="flex justify-between border-b border-slate-100 pb-2 pt-1">
            <span className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> Student Name:</span>
            <span className="font-bold text-slate-700">{state.studentName}</span>
          </div>
          {state.studentId && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Student ID:</span>
              <span className="font-bold text-slate-700">{state.studentId}</span>
            </div>
          )}
          {state.course && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Course:</span>
              <span className="font-bold text-slate-700">{state.course}</span>
            </div>
          )}
          {(state.yearLevel || state.section) && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Year & Section:</span>
              <span className="font-bold text-slate-700">{state.yearLevel} - {state.section}</span>
            </div>
          )}
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

      <div className="pt-4 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-200 transition-all"
        >
          <span>Return to Home</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
