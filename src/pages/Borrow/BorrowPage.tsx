import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book } from '../../types';
import { toast } from 'sonner';
import { BookOpen, Calendar, ArrowLeft, Send, User, Hash } from 'lucide-react';

export const BorrowPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bookIdParam = searchParams.get('bookId') || '';

  const { data: books = [] } = useQuery({
    queryKey: ['books'],
    queryFn: () => dataService.getBooks(),
  });

  const [selectedBookId, setSelectedBookId] = useState<string>(bookIdParam);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [selectedSerial, setSelectedSerial] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Get student from session — guaranteed to exist (guard below handles null).
  const currentStudent = dataService.getCurrentStudent();

  const { data: bookCopies = [], isLoading: loadingCopies } = useQuery({
    queryKey: ['copies', selectedBookId],
    queryFn: () => (selectedBookId ? dataService.getBookCopies(selectedBookId) : Promise.resolve([])),
    enabled: Boolean(selectedBookId),
  });

  const availableCopies = bookCopies.filter((c) => c.status === 'Available');

  useEffect(() => {
    if (bookIdParam && books.length > 0) {
      const found = books.find((b) => b.id === bookIdParam);
      if (found) {
        setSelectedBookId(found.id);
        setSelectedBook(found);
      }
    } else if (books.length > 0 && !selectedBookId) {
      setSelectedBookId(books[0].id);
      setSelectedBook(books[0]);
    }
  }, [bookIdParam, books]);

  useEffect(() => {
    if (availableCopies.length > 0) {
      if (!selectedSerial || !availableCopies.some((c) => c.serial_number === selectedSerial)) {
        setSelectedSerial(availableCopies[0].serial_number);
      }
    } else {
      setSelectedSerial('');
    }
  }, [bookCopies, selectedBookId]);

  const handleBookChange = (id: string) => {
    setSelectedBookId(id);
    const found = books.find((b) => b.id === id);
    setSelectedBook(found || null);
    setSelectedSerial('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const student = dataService.getCurrentStudent();
    if (!student) {
      toast.error('Please log in first to borrow a book.');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }

    if (durationDays < 1 || durationDays > 3) {
      toast.error('Borrow duration cannot exceed 3 days.');
      return;
    }

    if (!selectedBookId) {
      toast.error('Please select a book to borrow.');
      return;
    }

    setSubmitting(true);
    try {
      const assignedSerial = selectedSerial || availableCopies[0]?.serial_number;
      const request = await dataService.submitBorrowRequest({
        student_name: student.full_name,
        student_id: student.school_id,
        course: student.course || '',
        year_level: student.year_level || '',
        section: student.section || '',
        book_id: selectedBookId,
        serial_number: assignedSerial,
        duration_days: durationDays,
      });

      toast.success('Borrow request submitted successfully.');
      navigate('/request-success', {
        state: {
          inquiryNumber: request.inquiry_number,
          studentName: student.full_name,
          studentId: student.school_id,
          bookTitle: selectedBook?.title || 'Book',
          serialNumber: assignedSerial || request.serial_number,
          durationDays,
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit borrow request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect logged-out visitors straight to login (preserves the book they picked).
  if (!currentStudent) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </Link>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Submit Borrow Request</h1>
        <p className="text-slate-600 text-sm mt-1 font-medium">
          Select your requested borrow duration (1–3 days) and confirm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

          {/* Logged-in Student Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Borrowing as</p>
              <p className="text-sm font-bold text-slate-900 truncate">{currentStudent.full_name}</p>
              <p className="text-xs text-slate-500 font-medium">{currentStudent.school_id}</p>
            </div>
          </div>

          {/* Borrow Duration Card */}
          <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Borrow Duration</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 font-medium">Duration (1-3 Days):</span>
                <span className="font-extrabold text-emerald-700 text-base">{durationDays} Day(s)</span>
              </div>

              <input
                type="range"
                min={1}
                max={3}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>1 Day</span>
                <span>2 Days</span>
                <span>3 Days (Max)</span>
              </div>
            </div>
          </div>

          {/* Assigned Copy Serial Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-emerald-600" />
                <span>Assigned Serial Number</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Auto-Assigned Copy
              </span>
            </div>
            {selectedSerial ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Copy Serial</span>
                  <p className="font-mono font-black text-sm text-emerald-800">{selectedSerial}</p>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Automatically assigned for your borrow request
                </span>
              </div>
            ) : loadingCopies ? (
              <p className="text-xs text-slate-400 font-medium py-1">Loading copy serial numbers...</p>
            ) : availableCopies.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                All copies are currently borrowed. You may still submit a request to enter the waitlist.
              </div>
            ) : null}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            <span>{submitting ? 'Submitting to Database...' : 'Submit Borrow Request'}</span>
          </button>
        </form>

        {/* Read-Only Book Information Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 space-y-4 sticky top-24 border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Book Information</span>
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Selected Book</label>
              <select
                value={selectedBookId}
                onChange={(e) => handleBookChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedBook ? (
              <div className="space-y-4 pt-2">
                <div className="w-full h-32 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                  {selectedBook.cover_url ? (
                    <img
                      src={selectedBook.cover_url}
                      alt={`Cover of ${selectedBook.title}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-10 h-10 text-emerald-600" />
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Title</span>
                    <p className="text-base font-bold text-slate-900">{selectedBook.title}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Type</span>
                    <span className="text-xs font-bold text-emerald-700">{selectedBook.type_name}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Availability:</span>
                    <span className="font-bold text-slate-900">
                      {selectedBook.available_copies} / {selectedBook.total_copies} Copies
                    </span>
                  </div>

                  {/* Serial Number Section in Book Information */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Book Serial Number</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Auto-Generated
                      </span>
                    </div>

                    {loadingCopies ? (
                      <p className="text-xs text-slate-400 font-medium">Loading serials...</p>
                    ) : selectedSerial ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-600">Assigned Serial:</span>
                          <span className="font-mono font-black text-xs text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-xs">
                            {selectedSerial}
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          Each copy of this book has a unique serial number automatically assigned upon registration.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No available serial copy at the moment.</p>
                    )}
                  </div>

                  {/* All Copies & Unique Serials */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Copies &amp; Serials ({bookCopies.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Click to select copy</span>
                    </div>

                    {loadingCopies ? (
                      <p className="text-xs text-slate-400">Loading copies...</p>
                    ) : bookCopies.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No copies registered.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {bookCopies.map((copy) => {
                          const isAvail = copy.status === 'Available';
                          const isSelected = copy.serial_number === selectedSerial;
                          return (
                            <button
                              key={copy.id}
                              type="button"
                              disabled={!isAvail}
                              onClick={() => isAvail && setSelectedSerial(copy.serial_number)}
                              title={isAvail ? `Click to choose copy ${copy.serial_number}` : `Copy ${copy.serial_number} is currently borrowed`}
                              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all text-left flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/50'
                                  : isAvail
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <span>{copy.serial_number}</span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-sans font-semibold ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : isAvail
                                    ? 'bg-emerald-200/60 text-emerald-800'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {copy.status}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No book selected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
