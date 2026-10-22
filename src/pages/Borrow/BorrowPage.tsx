import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book } from '../../types';
import { toast } from 'sonner';
import {
  BookOpen,
  Calendar,
  ArrowLeft,
  Send,
  User,
  Hash,
  MapPin,
  Calendar as CalendarIcon,
  Building2,
  User as UserIcon,
  Tag,
  BookCopy,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  ExternalLink,
  Library,
  Sparkles,
} from 'lucide-react';

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

  const currentStudent = dataService.getCurrentStudent();

  const { data: bookCopies = [], isLoading: loadingCopies } = useQuery({
    queryKey: ['copies', selectedBookId],
    queryFn: () => (selectedBookId ? dataService.getBookCopies(selectedBookId) : Promise.resolve([])),
    enabled: Boolean(selectedBookId),
  });

  const availableCopies = bookCopies.filter((c) => c.status === 'Available');
  const borrowedCopies = bookCopies.filter((c) => c.status === 'Borrowed');

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

  if (!currentStudent) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  const detailItems = selectedBook ? [
    { 
      label: 'Author', 
      value: selectedBook.author, 
      icon: UserIcon, 
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    { 
      label: 'Publisher', 
      value: selectedBook.publisher, 
      icon: Building2, 
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    { 
      label: 'Copyright Year', 
      value: selectedBook.copyright_year, 
      icon: CalendarIcon, 
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    { 
      label: 'Location', 
      value: selectedBook.location, 
      icon: MapPin, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    { 
      label: 'Date Published', 
      value: selectedBook.published_date, 
      icon: CalendarIcon, 
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    { 
      label: 'Type', 
      value: selectedBook.type_name, 
      icon: Tag, 
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200'
    },
  ].filter(item => item.value) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Catalog</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Borrow Request
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Submit Borrow Request</h1>
            <p className="text-emerald-100 mt-1 font-medium">Select duration and confirm your book selection</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            <User className="w-5 h-5" />
            <span className="font-medium">{currentStudent.full_name}</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">{currentStudent.school_id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left Column - Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Book Selection Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Select Book</h2>
                  <p className="text-xs text-slate-500">Choose from available titles</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {books.length} Available
              </span>
            </div>
            
            <div className="p-6">
              <select
                value={selectedBookId}
                onChange={(e) => handleBookChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs appearance-none bg-no-repeat bg-right"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5rem' }}
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} {b.available_copies > 0 ? `(${b.available_copies} available)` : '(Waitlist)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedBook && (
            <>
              {/* Book Cover & Title Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="relative h-56 sm:h-64 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                  {selectedBook.cover_url ? (
                    <img
                      src={selectedBook.cover_url}
                      alt={`Cover of ${selectedBook.title}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <BookOpen className="w-16 h-16" />
                      <span className="text-sm font-medium">No cover available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  
                  {/* Availability Badge */}
                  <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 text-slate-800 backdrop-blur-sm shadow-lg border border-white/20">
                        {selectedBook.available_copies} / {selectedBook.total_copies} Copies
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg border ${
                        selectedBook.available_copies > 0
                          ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                          : 'bg-amber-500/90 text-white border-amber-400/50'
                      }`}>
                        {selectedBook.available_copies > 0 ? 'Available Now' : 'Waitlist Only'}
                      </span>
                    </div>
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 text-slate-800 backdrop-blur-sm shadow-lg border border-white/20 flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      {selectedBook.type_name}
                    </span>
                  </div>
                </div>

                {/* Book Details Grid */}
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">{selectedBook.title}</h3>

                  {/* Detail Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className={`p-4 rounded-xl border ${item.border} ${item.bg} hover:border-opacity-50 transition-all group`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} bg-white/80 shadow-sm group-hover:scale-105 transition-transform`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{item.label}</p>
                              <p className="text-sm font-semibold text-slate-900 truncate">{item.value}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Availability Card - Always Show */}
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Availability</p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-lg text-emerald-800">{selectedBook.available_copies}</span>
                            <span className="text-slate-400">/</span>
                            <span className="font-medium text-slate-700">{selectedBook.total_copies} Total</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Serial Numbers Section */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-lg font-bold text-slate-900">Physical Copies & Serial Numbers</h4>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {availableCopies.length} Available
                      </span>
                    </div>

                    {loadingCopies ? (
                      <div className="py-8 text-center text-slate-400">
                        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm font-medium">Loading copy serial numbers...</p>
                      </div>
                    ) : availableCopies.length === 0 && borrowedCopies.length === 0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                        <BookCopy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 font-medium">No copies registered for this book yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Available Copies */}
                        {availableCopies.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Available Copies - Click to Select
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {availableCopies.map((copy) => {
                                const isSelected = copy.serial_number === selectedSerial;
                                return (
                                  <button
                                    key={copy.id}
                                    type="button"
                                    onClick={() => setSelectedSerial(copy.serial_number)}
                                    className={`px-3 py-2.5 rounded-xl font-mono font-bold text-sm border transition-all min-w-[140px] flex items-center justify-center gap-2 ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg ring-2 ring-emerald-400/50 scale-105'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer'
                                    }`}
                                  >
                                    <span>{copy.serial_number}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/30 text-emerald-800">
                                      Available
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Borrowed Copies */}
                        {borrowedCopies.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Currently Borrowed
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {borrowedCopies.map((copy) => (
                                <button
                                  key={copy.id}
                                  type="button"
                                  disabled
                                  className="px-3 py-2.5 rounded-xl font-mono font-bold text-sm border bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60 min-w-[140px] flex items-center justify-center gap-2"
                                >
                                  <span>{copy.serial_number}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                    Borrowed
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Serial Display */}
                    {selectedSerial && (
                      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <Hash className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Your Selected Copy</p>
                              <p className="font-mono font-black text-xl text-emerald-900">{selectedSerial}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Ready to Borrow
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-2">
                          This unique serial number will be assigned to your borrow request.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Borrow Duration Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Borrow Duration</h2>
                      <p className="text-xs text-slate-500">Maximum 3 days per borrow request</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Duration:</span>
                      <span className="font-extrabold text-emerald-700 text-lg">{durationDays} Day(s)</span>
                    </div>
                    
                    <input
                      type="range"
                      min={1}
                      max={3}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>1 Day</span>
                      <span>2 Days</span>
                      <span>3 Days (Max)</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {[1, 2, 3].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setDurationDays(day)}
                          className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                            durationDays === day
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {day} Day{day > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || availableCopies.length === 0}
                className="w-full py-4 rounded-xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                <span>{submitting ? 'Submitting Request...' : availableCopies.length > 0 ? 'Submit Borrow Request' : 'No Available Copies - Join Waitlist'}</span>
              </button>
            </>
          )}
        </form>

        {/* Right Column - Book Info Card (Sticky) */}
        <div className="lg:sticky lg:top-24 space-y-6">
          {/* Quick Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Book</p>
                <h3 className="text-lg font-black text-slate-900 truncate">{selectedBook?.title || 'No book selected'}</h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total Copies</span>
                <span className="font-bold text-slate-900">{selectedBook?.total_copies || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Available</span>
                <span className="font-bold text-emerald-700">{selectedBook?.available_copies || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Borrowed</span>
                <span className="font-bold text-amber-700">{selectedBook ? selectedBook.total_copies - selectedBook.available_copies : 0}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  selectedBook && selectedBook.available_copies > 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {selectedBook && selectedBook.available_copies > 0 ? 'Ready to Borrow' : 'Waitlist Only'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info Card */}
          {selectedBook && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Info className="w-4 h-4 text-emerald-600" />
                Quick Details
              </h4>
              <div className="space-y-3">
                {selectedBook.author && (
                  <div className="flex items-center gap-3 text-sm">
                    <UserIcon className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-slate-700">{selectedBook.author}</span>
                  </div>
                )}
                {selectedBook.publisher && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-700">{selectedBook.publisher}</span>
                  </div>
                )}
                {selectedBook.copyright_year && (
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-slate-700">© {selectedBook.copyright_year}</span>
                  </div>
                )}
                {selectedBook.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-700">{selectedBook.location}</span>
                  </div>
                )}
                {selectedBook.published_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-slate-700">Published: {selectedBook.published_date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              How It Works
            </h4>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Select a book from the dropdown</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Choose an available copy serial number</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Set borrow duration (1-3 days)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <span>Submit request for librarian approval</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};