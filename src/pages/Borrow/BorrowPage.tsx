import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book } from '../../types';
import { toast } from 'sonner';
import { 
  Search, 
  RotateCcw, 
  BookOpen, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  X, 
  BookMarked,
  Sparkles,
  ChevronRight,
  Info,
  Check,
  GraduationCap
} from 'lucide-react';

export const BorrowPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Manual borrower details (students cannot create accounts)
  const [studentSchoolId, setStudentSchoolId] = useState('');
  const [studentFullName, setStudentFullName] = useState('');
  const [studentSection, setStudentSection] = useState('');
  const [studentYear, setStudentYear] = useState('');
  const [studentCourse, setStudentCourse] = useState('');

  const [bookId, setBookId] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookSearch, setBookSearch] = useState('');
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);

  const [days, setDays] = useState<number>(3);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');

  // Container refs for click-outside
  const bookRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: books = [] } = useQuery({ 
    queryKey: ['books'], 
    queryFn: () => dataService.getBooks() 
  });

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ['borrowRecords'], 
    queryFn: () => dataService.getBorrowRecords() 
  });

  // Click outside listener for book dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bookRef.current && !bookRef.current.contains(e.target as Node)) {
        setIsBookDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter book suggestions
  const suggestedBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    if (!q) return books.slice(0, 8);
    return books.filter((b) => 
      b.title.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.type_name && b.type_name.toLowerCase().includes(q)) ||
      (b.accession_number && b.accession_number.toLowerCase().includes(q)) ||
      (Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 10);
  }, [books, bookSearch]);

  // Synchronize max days when selected book changes
  const maxBorrowDays = selectedBook ? (selectedBook.borrow_duration_days ?? 7) : 3;

  const handleClearStudent = () => {
    setStudentSchoolId('');
    setStudentFullName('');
    setStudentSection('');
    setStudentYear('');
    setStudentCourse('');
  };

  const handleSelectBook = (book: Book) => {
    if ((book.available_copies || 0) <= 0) {
      toast.error('No copies available for this book.');
      return;
    }
    setSelectedBook(book);
    setBookId(book.id);
    const bookMax = book.borrow_duration_days ?? 7;
    // Cap or default days to book's max days
    setDays((prev) => (prev > bookMax ? bookMax : prev || bookMax));
    setBookSearch('');
    setIsBookDropdownOpen(false);
  };

  const handleClearBook = () => {
    setSelectedBook(null);
    setBookId('');
    setBookSearch('');
    setDays(3);
  };

  // Borrow Mutation
  const borrowMutation = useMutation({
    mutationFn: () => dataService.borrowBook({
      school_id: studentSchoolId,
      full_name: studentFullName,
      section: studentSection,
      year_level: studentYear,
      course: studentCourse,
      book_id: bookId,
      days,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowRecords'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['copies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Book loan recorded successfully.');
      handleClearStudent();
      handleClearBook();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to borrow book.'),
  });

  // Return Mutation
  const returnMutation = useMutation({
    mutationFn: (id: string) => dataService.returnBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowRecords'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['copies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Book marked as returned.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to return book.'),
  });

  const handleBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSchoolId.trim()) { 
      toast.error('Please enter student ID.'); 
      return; 
    }
    if (!studentFullName.trim()) { 
      toast.error('Please enter student full name.'); 
      return; 
    }
    if (!bookId) { 
      toast.error('Please select a book to borrow.'); 
      return; 
    }
    if (!Number.isInteger(days) || days < 1 || days > maxBorrowDays) {
      toast.error(`Borrow duration must be between 1 and ${maxBorrowDays} days.`);
      return;
    }
    borrowMutation.mutate();
  };

  // Due date preview
  const calculatedDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }, [days]);

  // Statistics
  const stats = useMemo(() => {
    let active = 0;
    let overdue = 0;
    let returned = 0;
    const now = Date.now();

    records.forEach((r) => {
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

    const availableBooksCount = books.reduce((acc, b) => acc + (b.available_copies || 0), 0);

    return { active, overdue, returned, total: records.length, availableBooksCount };
  }, [records, books]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const now = Date.now();

    return records.filter((r) => {
      const isReturned = r.status === 'Returned';
      const isOverdue = !isReturned && new Date(r.due_date).getTime() < now;

      // Status filter tab
      if (statusFilter === 'active' && (isReturned || isOverdue)) return false;
      if (statusFilter === 'overdue' && !isOverdue) return false;
      if (statusFilter === 'returned' && !isReturned) return false;

      // Text search
      if (!q) return true;
      return (
        (r.student_name || '').toLowerCase().includes(q) ||
        (r.student_school_id || '').toLowerCase().includes(q) ||
        (r.book_title || '').toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    });
  }, [records, searchTerm, statusFilter]);

  // Quick preset days options
  const presetDays = [1, 2, 3, 5, 7, 14, 21, 30].filter((n) => n <= maxBorrowDays);

  return (
    <div className="space-y-7 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Borrow Books</h1>
              <p className="text-xs font-medium text-slate-500">
                Record student loans, customize borrow duration with slider limits, and track due dates.
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700">{stats.active} Active</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-xs font-bold text-slate-700">{stats.overdue} Overdue</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-xs font-bold text-slate-700">{stats.returned} Returned</span>
          </div>
        </div>
      </div>

      {/* Main Borrow Section Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Issue New Book Loan</h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
            Admin Checkout
          </span>
        </div>

        <form onSubmit={handleBorrow} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Student Borrower Details (manual entry) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                Student Borrower *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Student ID (e.g. 1234-5678)"
                  value={studentSchoolId}
                  onChange={(e) => setStudentSchoolId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={studentFullName}
                  onChange={(e) => setStudentFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                <input
                  type="text"
                  placeholder="Section"
                  value={studentSection}
                  onChange={(e) => setStudentSection(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={studentYear}
                  onChange={(e) => setStudentYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                <input
                  type="text"
                  placeholder="Course"
                  value={studentCourse}
                  onChange={(e) => setStudentCourse(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs sm:col-span-2"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1">
                Enter student details manually. No student account required.
              </p>
            </div>

            {/* 2. Book Selection with Search Bar & Suggestions */}
            <div className="space-y-2" ref={bookRef}>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Book Title *
                </span>
                {selectedBook && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {selectedBook.available_copies} of {selectedBook.total_copies} Copies Available
                  </span>
                )}
              </label>

              {selectedBook ? (
                // Selected Book Card
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 flex items-center justify-between gap-3 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedBook.cover_url ? (
                      <img
                        src={selectedBook.cover_url}
                        alt={selectedBook.title}
                        className="w-10 h-13 rounded-lg object-cover border border-emerald-200 shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-13 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{selectedBook.title}</h4>
                      <p className="text-[11px] text-slate-600 truncate">
                        {selectedBook.author ? `By ${selectedBook.author}` : 'No author specified'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.2 rounded">
                          {selectedBook.type_name || 'Course'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Max loan: {selectedBook.borrow_duration_days ?? 7} days
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearBook}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                    title="Change Book"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // Book Search Input & Suggestions Popover
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by book title, author, course, or accession #..."
                      value={bookSearch}
                      onChange={(e) => {
                        setBookSearch(e.target.value);
                        setIsBookDropdownOpen(true);
                      }}
                      onFocus={() => setIsBookDropdownOpen(true)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>

                  {isBookDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-100">
                      <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                        <span>Select Catalog Book ({suggestedBooks.length} available)</span>
                        <span className="text-[10px] text-slate-400">Click to select</span>
                      </div>
                      {suggestedBooks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No books found matching "{bookSearch}".
                        </div>
                      ) : (
                        suggestedBooks.map((b) => {
                          const isAvailable = (b.available_copies || 0) > 0;
                          return (
                            <div
                              key={b.id}
                              onClick={() => isAvailable && handleSelectBook(b)}
                              className={`p-2.5 flex items-center justify-between gap-3 transition-colors ${
                                isAvailable 
                                  ? 'hover:bg-emerald-50/70 cursor-pointer' 
                                  : 'opacity-50 cursor-not-allowed bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {b.cover_url ? (
                                  <img 
                                    src={b.cover_url} 
                                    alt={b.title} 
                                    className="w-8 h-10 object-cover rounded shadow-2xs shrink-0" 
                                  />
                                ) : (
                                  <div className="w-8 h-10 rounded bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                    <BookOpen className="w-4 h-4 text-emerald-600" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{b.title}</p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {b.author || 'Unknown'} {b.type_name ? `• ${b.type_name}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                                  isAvailable 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                                }`}>
                                  {isAvailable ? `${b.available_copies} available` : 'Out of stock'}
                                </span>
                                <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                                  Max: {b.borrow_duration_days ?? 7}d
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 font-medium pt-1">
                    Live suggestion search. Books with 0 copies cannot be loaned out.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* 3. Borrow Days Slider */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Loan Duration (Days) *
                </label>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Slide to adjust borrowing time limit. Maximum is capped by this book's configuration ({maxBorrowDays} days).
                </p>
              </div>

              {/* Large Days Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-semibold text-slate-500">Selected:</span>
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-sm font-black tracking-wide shadow-2xs">
                  {days} {days === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-2">
              <input
                type="range"
                min={1}
                max={maxBorrowDays}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
              />
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                <span>1 Day (Min)</span>
                <span className="text-emerald-700 font-bold">
                  {days} {days === 1 ? 'Day' : 'Days'}
                </span>
                <span>{maxBorrowDays} Days (Max limit)</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Select:</span>
              {presetDays.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDays(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    days === p
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  {p}d
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDays(maxBorrowDays)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  days === maxBorrowDays
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
                }`}
              >
                Max ({maxBorrowDays}d)
              </button>
            </div>

            {/* Live Due Date Calculation Card */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Calculated Due Date:</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {calculatedDueDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium sm:text-right">
                Student must return on or before due date to avoid overdue flags.
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                handleClearStudent();
                handleClearBook();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              type="submit"
              disabled={borrowMutation.isPending || !studentSchoolId || !studentFullName || !bookId}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {borrowMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Recording Loan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Borrow Book</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Borrow Records Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header with Search and Filter Tabs */}
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Borrow Records History</h2>
              <p className="text-xs text-slate-500">Track and manage active loans, past returns, and overdue items.</p>
            </div>
            
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, book, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === 'overdue'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Overdue ({stats.overdue})
            </button>
            <button
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === 'returned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Returned ({stats.returned})
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Student Borrower</th>
                <th className="px-4 py-3.5">Book Title</th>
                <th className="px-4 py-3.5 text-center">Duration</th>
                <th className="px-4 py-3.5">Borrowed On</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No borrow records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isReturned = r.status === 'Returned';
                  const isOverdue = !isReturned && new Date(r.due_date).getTime() < Date.now();

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {(r.student_name || 'S').charAt(0).toUpperCase()}
                          </div>
                           <div>
                             <p className="font-bold text-slate-900">{r.student_name || 'Unknown Student'}</p>
                             <p className="font-mono text-[11px] text-emerald-700 font-semibold">
                               {r.student_school_id || r.student_id}
                             </p>
                             {(r.student_course || r.student_year_level || r.student_section) && (
                               <p className="text-[10px] text-slate-500">
                                 {[r.student_course, r.student_year_level, r.student_section].filter(Boolean).join(' • ')}
                               </p>
                             )}
                           </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 max-w-xs truncate">
                            {r.book_title || r.book_id}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {r.borrow_days} {r.borrow_days === 1 ? 'day' : 'days'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {new Date(r.borrowed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`font-semibold ${
                          isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'
                        }`}>
                          {new Date(r.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isReturned ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Returned
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Active Loan
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {!isReturned && (
                          <button
                            onClick={() => returnMutation.mutate(r.id)}
                            disabled={returnMutation.isPending}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs hover:shadow-xs transition-all disabled:opacity-60"
                          >
                            {returnMutation.isPending ? 'Returning...' : 'Return'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
