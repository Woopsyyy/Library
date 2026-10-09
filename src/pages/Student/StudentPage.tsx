import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import {
  Bell, BookOpen, CalendarDays, CircleAlert, CircleCheck, Clock, Library, LogOut, Send,
} from 'lucide-react';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export const StudentPage: React.FC = () => {
  const navigate = useNavigate();
  const student = dataService.getCurrentStudent();
  const notifiedRef = useRef(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['borrowed-books'],
    queryFn: () => dataService.getBorrowedBooks(),
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['borrow-requests'],
    queryFn: () => dataService.getBorrowRequests(),
  });

  const myId = (student?.school_id || '').trim().toLowerCase();
  const myBorrows = useMemo(
    () => records.filter((r) => r.student_id.trim().toLowerCase() === myId),
    [records, myId],
  );
  const myPending = useMemo(
    () =>
      requests.filter(
        (r) => r.student_id.trim().toLowerCase() === myId && r.status === 'Pending',
      ),
    [requests, myId],
  );

  const overdue = useMemo(
    () => myBorrows.filter((b) => b.status === 'Overdue' || (b.remaining_days ?? 0) < 0),
    [myBorrows],
  );
  const dueSoon = useMemo(
    () =>
      myBorrows.filter((b) => {
        const left = b.remaining_days ?? 99;
        return b.status === 'Borrowed' && left >= 0 && left <= 1;
      }),
    [myBorrows],
  );

  // Expiry toast notifications — fired once per login when data arrives.
  // The bell button below keeps the same alerts visible at any time.
  const notifications = useMemo(() => {
    const items: { id: string; kind: 'overdue' | 'due-soon'; title: string; detail: string }[] = [];
    for (const b of overdue) {
      const late = Math.abs(b.remaining_days ?? 0);
      items.push({
        id: `overdue-${b.id}`,
        kind: 'overdue',
        title: `"${b.book_title || 'Book'}" is overdue`,
        detail: late > 0 ? `${late} day(s) past due (${formatDate(b.due_date)}). Please return it.` : `Was due ${formatDate(b.due_date)}. Please return it.`,
      });
    }
    for (const b of dueSoon) {
      items.push({
        id: `due-${b.id}`,
        kind: 'due-soon',
        title: `"${b.book_title || 'Book'}" expires ${(b.remaining_days ?? 1) === 0 ? 'today' : 'tomorrow'}`,
        detail: `Due ${formatDate(b.due_date)}. Return on time to avoid it going overdue.`,
      });
    }
    return items;
  }, [overdue, dueSoon]);

  // Expiry toast notifications — fired once per login when data arrives.
  useEffect(() => {
    if (recordsLoading || requestsLoading || notifiedRef.current || !student) return;
    notifiedRef.current = true;
    if (overdue.length > 0) {
      toast.error(
        overdue.length === 1
          ? `"${overdue[0].book_title}" is overdue. Please return it.`
          : `${overdue.length} borrowed books are overdue. Please return them.`,
      );
    } else if (dueSoon.length > 0) {
      toast.warning(
        dueSoon.length === 1
          ? `"${dueSoon[0].book_title}" is due ${dueSoon[0].remaining_days === 0 ? 'today' : 'tomorrow'}.`
          : `${dueSoon.length} books are due within a day.`,
      );
    } else if (myBorrows.length > 0) {
      toast.success('No overdue books. Enjoy reading!');
    }
  }, [recordsLoading, requestsLoading, overdue, dueSoon, myBorrows.length, student]);

  const handleLogout = () => {
    dataService.logoutStudent();
    toast.success('Signed out.');
    navigate('/login');
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight">My Library</span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Student Portal
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                title="Notifications"
                className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">Notifications</p>
                      <span className="text-[11px] font-bold text-slate-400">
                        {notifications.length === 0 ? 'All clear' : `${notifications.length} alert${notifications.length > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center space-y-2">
                        <CircleCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">You're all caught up!</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          No books are expiring soon.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {notifications.map((n) => (
                          <li key={n.id} className="px-4 py-3 flex gap-3">
                            {n.kind === 'overdue' ? (
                              <CircleAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900">{n.title}</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{n.detail}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{student.full_name}</p>
              <p className="text-[11px] text-emerald-700 font-mono font-bold">{student.school_id}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {student.full_name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Here are the books you borrowed and when they expire.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Borrowed</p>
            <p className="text-2xl font-black text-slate-900">{myBorrows.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue</p>
            <p className={`text-2xl font-black ${overdue.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overdue.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Due Soon</p>
            <p className={`text-2xl font-black ${dueSoon.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {dueSoon.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
            <p className="text-2xl font-black text-slate-900">{myPending.length}</p>
          </div>
        </div>

        {/* Borrowed books */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold">My Borrowed Books</h2>
          </div>
          {recordsLoading ? (
            <p className="px-5 py-8 text-sm text-slate-500 text-center">Loading your books...</p>
          ) : myBorrows.length === 0 ? (
            <div className="px-5 py-8 text-center space-y-3">
              <p className="text-sm text-slate-500 font-medium">You have no borrowed books right now.</p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Catalog</span>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {myBorrows.map((b) => {
                const left = b.remaining_days ?? 0;
                const isOverdue = b.status === 'Overdue' || left < 0;
                const isDueSoon = !isOverdue && left <= 1;
                return (
                  <li key={b.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{b.book_title || 'Book'}</p>
                      {b.serial_number && (
                        <p className="text-[11px] text-emerald-800 font-mono font-bold mt-1 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span>Serial:</span>
                          <span>{b.serial_number}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Borrowed {formatDate(b.borrow_date)} • Due {formatDate(b.due_date)}</span>
                      </p>
                    </div>
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <CircleAlert className="w-3.5 h-3.5" />
                        <span>Overdue{left < 0 ? ` (${Math.abs(left)}d late)` : ''}</span>
                      </span>
                    ) : isDueSoon ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{left === 0 ? 'Due today' : 'Due tomorrow'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CircleCheck className="w-3.5 h-3.5" />
                        <span>{left}d left</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Pending requests */}
        {myPending.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold">Pending Requests</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {myPending.map((r) => (
                <li key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {r.book_title || 'Book'}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="text-[11px] text-slate-500 font-mono">{r.inquiry_number}</p>
                      {r.serial_number && (
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Serial: {r.serial_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Pending approval
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};
