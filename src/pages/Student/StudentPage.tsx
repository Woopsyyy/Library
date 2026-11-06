import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book, StudentBookListKind, BorrowRecord } from '../../types';
import { BookDetailsModal } from '../../components/BookDetailsModal';
import { getLoanRemainingInfo } from '../../lib/loanUtils';
import { toast } from 'sonner';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Heart,
  BookmarkPlus,
  ThumbsUp,
  LogOut,
  X,
  Info,
  Clock,
  BarChart3,
  Users,
  GraduationCap,
  BookMarked,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';

type SectionKind = StudentBookListKind | 'new_arrivals';

type SectionConfig = {
  kind: SectionKind;
  label: string;
  Icon: React.ElementType;
  tone: string;
  bg: string;
  accent: string;
};

const sections: SectionConfig[] = [
  { kind: 'new_arrivals', label: 'New Arrivals', Icon: Clock, tone: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'text-emerald-600' },
  { kind: 'favorite', label: 'Favorites', Icon: Heart, tone: 'text-rose-600', bg: 'bg-rose-50', accent: 'text-rose-600' },
  { kind: 'wishlist', label: 'Wishlist', Icon: BookmarkPlus, tone: 'text-amber-600', bg: 'bg-amber-50', accent: 'text-amber-600' },
  { kind: 'recommendation', label: 'Recommendations', Icon: ThumbsUp, tone: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'text-emerald-600' },
];

const sparklinePoints: Record<SectionKind, string> = {
  new_arrivals: '10,34 22,28 34,22 46,30 58,24 70,20 82,26 94,30 100,24',
  favorite: '10,28 22,32 34,24 46,30 58,22 70,26 82,20 94,24 100,22',
  wishlist: '10,30 22,26 34,22 46,28 58,24 70,20 82,26 94,22 100,26',
  recommendation: '10,26 22,30 34,24 46,28 58,22 70,26 82,20 94,24 100,28',
};

const Sparkline: React.FC<{ kind: SectionKind; color: string }> = ({ kind, color }) => (
  <svg className={`w-full h-5 opacity-60 ${color}`} viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={sparklinePoints[kind]} />
  </svg>
);

const BookCard: React.FC<{
  book: Book;
  kind: SectionKind;
  label: string;
  tone: string;
  isNewArrival: boolean;
  onView: (book: Book) => void;
  onRemove?: (bookId: string, kind: StudentBookListKind) => void;
  removing: boolean;
}> = ({ book, kind, label, tone, isNewArrival, onView, onRemove, removing }) => {
  const cardClass = 'rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 group relative';
  const badgeClass = `absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md`;
  const detailClass = `inline-flex items-center gap-1 text-[10px] font-bold ${tone} bg-slate-50 px-2 py-1 rounded mt-1 self-start`;
  const removeClass = `absolute top-3 right-3 p-2 rounded-lg bg-white/90 backdrop-blur text-slate-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90`;

  return (
    <article className={cardClass}>
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <button
        type="button"
        onClick={() => onView(book)}
        aria-label={`View details for ${book.title}`}
        className="w-full block text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 active:scale-[0.98] transition-transform duration-100"
      >
        <div className="aspect-video w-full bg-slate-100 shrink-0 overflow-hidden relative">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <BookOpen className="w-10 h-10" />
            </div>
          )}
          {isNewArrival && (
            <span className={badgeClass}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Newly added
            </span>
          )}
        </div>
        <div className="p-4 min-w-0 flex-1 flex flex-col justify-between gap-3">
          <div>
            <p className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">{book.title}</p>
            {book.author && <p className="text-xs text-slate-500 mt-1">{book.author}</p>}
            <p className="text-xs text-slate-400 font-medium mt-2 uppercase tracking-wider">{book.type_name || 'General'}</p>
          </div>
          <span className={detailClass}>
            <Info className="w-3 h-3" /> View details
          </span>
        </div>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(book.id, kind as StudentBookListKind); }}
          disabled={removing}
          className={removeClass}
          aria-label={`Remove from ${label}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </article>
  );
};

export const StudentPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const student = dataService.getCurrentStudent();
  const [offsets, setOffsets] = useState<Record<SectionKind, number>>({ new_arrivals: 0, favorite: 0, wishlist: 0, recommendation: 0 });
  const [directions, setDirections] = useState<Record<SectionKind, -1 | 1>>({ new_arrivals: 1, favorite: 1, wishlist: 1, recommendation: 1 });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loanFilter, setLoanFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');

  // Query: Student's borrowed books
  const { data: myLoans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['studentBorrowRecords', student?.id, student?.school_id],
    queryFn: () => dataService.getBorrowRecordsForStudent(student?.id, student?.school_id, student?.full_name),
    enabled: Boolean(student),
  });

  // Query: Catalog books (for details modal)
  const { data: allBooks = [] } = useQuery({
    queryKey: ['books'],
    queryFn: () => dataService.getBooks(),
  });

  const { data: newArrivals = [], isLoading: arrivalsLoading } = useQuery({
    queryKey: ['newArrivals'],
    queryFn: () => dataService.getNewlyAddedBooks(),
  });

  const queryKey = ['studentBookLists', student?.id];
  const { data: lists, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => dataService.getStudentBookLists(student!.id),
    enabled: Boolean(student),
  });

  const toggleList = useMutation({
    mutationFn: ({ bookId, kind }: { bookId: string; kind: StudentBookListKind }) => dataService.toggleStudentBookList(student!.id, bookId, kind),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error: Error) => toast.error(error.message || 'Could not update your list.'),
  });

  // Calculate loan statistics
  const loanStats = useMemo(() => {
    let active = 0;
    let overdue = 0;
    let returned = 0;
    const now = Date.now();

    myLoans.forEach((r) => {
      if (r.status === 'Returned') {
        returned++;
      } else {
        const isPastDue = new Date(r.due_date).getTime() < now;
        if (isPastDue) {
          overdue++;
        } else {
          active++;
        }
      }
    });

    return { active, overdue, returned, total: myLoans.length };
  }, [myLoans]);

  // Filtered loan records
  const filteredLoans = useMemo(() => {
    const now = Date.now();
    return myLoans.filter((r) => {
      const isReturned = r.status === 'Returned';
      const isOverdue = !isReturned && new Date(r.due_date).getTime() < now;

      if (loanFilter === 'active') return !isReturned && !isOverdue;
      if (loanFilter === 'overdue') return isOverdue;
      if (loanFilter === 'returned') return isReturned;
      return true;
    });
  }, [myLoans, loanFilter]);

  if (!student) return null;

  const move = (kind: SectionKind, direction: -1 | 1, length: number) => {
    setDirections(current => ({ ...current, [kind]: direction }));
    setOffsets(current => ({ ...current, [kind]: (current[kind] + direction + length) % length }));
  };

  const getBooksForSection = (kind: SectionKind): Book[] => {
    if (kind === 'new_arrivals') return newArrivals;
    return lists?.[kind] || [];
  };

  const getLoadingForSection = (kind: SectionKind): boolean => {
    if (kind === 'new_arrivals') return arrivalsLoading;
    return isLoading;
  };

  const getErrorForSection = (kind: SectionKind): boolean => {
    if (kind === 'new_arrivals') return false;
    return isError;
  };

  const handleViewLoanBook = (record: BorrowRecord) => {
    const matchedBook = allBooks.find(b => b.id === record.book_id);
    if (matchedBook) {
      setSelectedBook(matchedBook);
    } else {
      // Create minimal book representation if not in catalog
      setSelectedBook({
        id: record.book_id,
        title: record.book_title || 'Borrowed Book',
        type_id: '',
        type_name: record.book_type_name || 'General',
        total_copies: 1,
        available_copies: 0,
        status: 'Available',
        author: record.book_author || 'Library Collection',
        cover_url: record.book_cover_url,
      });
    }
  };

  const firstName = student.full_name.split(' ')[0];

  const stats = [
    { label: 'Active Loans', value: loanStats.active, Icon: BookMarked, tone: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'New Arrivals', value: newArrivals.length, Icon: BarChart3, tone: 'text-emerald-600', kind: 'new_arrivals' as SectionKind },
    { label: 'Favorites', value: lists?.favorite.length ?? 0, Icon: Heart, tone: 'text-rose-600', kind: 'favorite' as SectionKind },
    { label: 'Wishlist', value: lists?.wishlist.length ?? 0, Icon: BookmarkPlus, tone: 'text-amber-600', kind: 'wishlist' as SectionKind },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-12%] left-[-8%] w-[35%] h-[35%] bg-emerald-200/40 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute bottom-[-12%] right-[-8%] w-[35%] h-[35%] bg-teal-200/30 rounded-full blur-[110px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[25%] right-[-5%] w-[30%] h-[30%] bg-violet-100/40 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <img src="/images/logo.png" alt="School Logo" className="w-9 h-9 rounded-xl object-contain bg-white p-1 shadow-sm group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900">Talisay City College Library</span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Student Portal</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/catalog" className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-50 hover:shadow-md transition-all">
              <BookOpen className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>
            <button
              type="button"
              onClick={() => { dataService.logoutStudent(); navigate('/login'); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-slate-900 text-white shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Welcome */}
        <section>
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-[90px] -mt-24 -mr-24" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/30">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome back, {firstName}!</h1>
                  <p className="text-emerald-100/90 text-sm sm:text-base font-medium">Your personal library hub — view borrowed books, active loans, days remaining &amp; saved lists.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur text-white border border-white/20">
                  <Users className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs sm:text-sm font-bold">{student.school_id}</span>
                </div>
                {loanStats.active > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-400/25 backdrop-blur text-white border border-emerald-300/40 shadow-xs animate-pulse">
                    <Clock className="w-4 h-4 text-emerald-200" />
                    <span className="text-xs sm:text-sm font-black">{loanStats.active} Active Loan{loanStats.active > 1 ? 's' : ''}</span>
                  </div>
                )}
                {loanStats.overdue > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/40 backdrop-blur text-white border border-rose-300/50 shadow-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-200" />
                    <span className="text-xs sm:text-sm font-black">{loanStats.overdue} Overdue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const color = stat.tone;
            const StatIcon = stat.Icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <StatIcon className="w-8 h-8" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-slate-50 shadow-sm`}>
                    <StatIcon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 h-5 w-full">
                  {stat.kind && <Sparkline kind={stat.kind} color={color} />}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Activity overview</p>
              </div>
            );
          })}
        </div>

        {/* MY BORROWED BOOKS & ACTIVE LOANS SECTION */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all">
          {/* Section Header with Tabs */}
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">My Borrowed Books &amp; Active Loans</h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {myLoans.length} total
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Track your borrowed books, live countdown of days remaining, and return statuses.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setLoanFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  loanFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Loans ({myLoans.length})
              </button>
              <button
                type="button"
                onClick={() => setLoanFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  loanFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                Active ({loanStats.active})
              </button>
              <button
                type="button"
                onClick={() => setLoanFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  loanFilter === 'overdue'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                Overdue ({loanStats.overdue})
              </button>
              <button
                type="button"
                onClick={() => setLoanFilter('returned')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  loanFilter === 'returned'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                Returned ({loanStats.returned})
              </button>
            </div>
          </div>

          {/* Section Body */}
          {loansLoading ? (
            <div className="px-6 py-14 text-center">
              <div className="flex items-center justify-center gap-2 mb-3 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <div className="w-3 h-3 rounded-full bg-emerald-600" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 rounded-full bg-emerald-600" style={{ animationDelay: '0.4s' }} />
              </div>
              <p className="text-sm text-slate-500 font-medium">Checking your borrowed books records...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-2xs">
                <BookMarked className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No books found in this view</h3>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1 mb-5">
                {myLoans.length === 0
                  ? 'You currently have no borrowed books. When the librarian issues a loan for your student ID, it will automatically appear here with days remaining.'
                  : `No books currently matching the "${loanFilter}" filter.`}
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Browse Library Catalog
              </Link>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLoans.map((record) => {
                const remaining = getLoanRemainingInfo(record.due_date, record.status);
                const isReturned = record.status === 'Returned';
                const isOverdue = remaining.isOverdue;

                // Duration and elapsed progress calculation
                const borrowedTime = new Date(record.borrowed_at).getTime();
                const dueTime = new Date(record.due_date).getTime();
                const totalDuration = Math.max(dueTime - borrowedTime, 1);
                const elapsedDuration = Math.max(Date.now() - borrowedTime, 0);
                const progressPercent = isReturned 
                  ? 100 
                  : Math.min(Math.round((elapsedDuration / totalDuration) * 100), 100);

                return (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between gap-4 group relative"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {/* Status Badge */}
                        {isReturned ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Returned
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Overdue
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            Active Loan
                          </span>
                        )}

                        {/* Days Remaining Pill */}
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs ${remaining.badgeBg} ${remaining.badgeText} ${remaining.badgeBorder}`}>
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{remaining.label}</span>
                        </span>
                      </div>

                      {/* Book Info Card Header */}
                      <div className="flex items-start gap-3.5">
                        {record.book_cover_url ? (
                          <img
                            src={record.book_cover_url}
                            alt={record.book_title || 'Book cover'}
                            className="w-14 h-18 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-14 h-18 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                            <BookOpen className="w-6 h-6" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                            {record.book_title || 'Catalog Book'}
                          </h4>
                          {record.book_author && (
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              By {record.book_author}
                            </p>
                          )}
                          {record.book_type_name && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {record.book_type_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Loan Timeline & Dates */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Borrowed:
                          </span>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {new Date(record.borrowed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Due Date:
                          </span>
                          <span className={`font-bold text-[11px] ${isOverdue ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                            {new Date(record.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {record.returned_at && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              Returned On:
                            </span>
                            <span className="font-semibold text-blue-700 text-[11px]">
                              {new Date(record.returned_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}

                        {/* Loan progress bar */}
                        {!isReturned && (
                          <div className="pt-1 space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                              <span>Loan period ({record.borrow_days}d)</span>
                              <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                                {remaining.shortLabel}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOverdue ? 'bg-rose-500' : progressPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <button
                      type="button"
                      onClick={() => handleViewLoanBook(record)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Info className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Book Info</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Catalog Sections (New Arrivals, Favorites, Wishlist, Recommendations) */}
        {sections.map(({ kind, label, Icon, tone, bg, accent }) => {
          const books = getBooksForSection(kind);
          const offset = offsets[kind];
          const loading = getLoadingForSection(kind);
          const error = getErrorForSection(kind);
          const visible = books.length > 5 ? Array.from({ length: 5 }, (_, i) => books[(offset + i) % books.length]) : books;
          const headerClass = `px-6 py-5 border-b border-slate-100 flex items-center justify-between ${bg}`;
          const iconCircleClass = `w-10 h-10 rounded-xl flex items-center justify-center ${tone} ${bg.replace('-50', '-200')}`;

          return (
            <section key={kind} className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-xl transition-all group">
              {/* Section Header */}
              <div className={headerClass}>
                <div className="flex items-center gap-3">
                  <div className={iconCircleClass}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">{label}</h2>
                    <p className="text-xs text-slate-500 font-medium">{books.length} book{books.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {books.length > 5 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => move(kind, -1, books.length)}
                      aria-label={`Previous ${label}`}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 transition-all hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(kind, 1, books.length)}
                      aria-label={`Next ${label}`}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 transition-all hover:scale-105 active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Loading / Error / Empty */}
              {loading ? (
                <div className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-emerald-600" />
                    <div className="w-3 h-3 rounded-full bg-emerald-600" style={{ animationDelay: '0.2s' }} />
                    <div className="w-3 h-3 rounded-full bg-emerald-600" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Loading your books...</p>
                </div>
              ) : error ? (
                <div className="px-6 py-12 text-center bg-rose-50 rounded-xl border border-rose-100 m-6">
                  <p className="text-sm text-rose-700 font-medium">Could not load this section. Please refresh the page and try again.</p>
                </div>
              ) : books.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-6">No books in this section yet.</p>
                  {kind !== 'new_arrivals' && (
                    <Link
                      to="/catalog"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/40 transition-all active:scale-95"
                    >
                      <BookOpen className="w-4 h-4" />
                      Browse Catalog
                    </Link>
                  )}
                </div>
              ) : (
                <div className="px-6 pb-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {visible.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      kind={kind}
                      label={label}
                      tone={tone}
                      isNewArrival={kind === 'new_arrivals'}
                      onView={setSelectedBook}
                      onRemove={kind !== 'new_arrivals' ? (bookId: string, k: StudentBookListKind) => toggleList.mutate({ bookId, kind: k }) : undefined}
                      removing={toggleList.isPending}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
};
