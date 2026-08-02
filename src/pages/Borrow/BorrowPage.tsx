import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book } from '../../types';
import { toast } from 'sonner';
import { BookOpen, UserCheck, Calendar, ArrowLeft, Send } from 'lucide-react';

export const BorrowPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookIdParam = searchParams.get('bookId') || '';

  const { data: books = [] } = useQuery({
    queryKey: ['books'],
    queryFn: () => dataService.getBooks(),
  });

  const [selectedBookId, setSelectedBookId] = useState<string>(bookIdParam);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('BS Information Technology');
  const [yearLevel, setYearLevel] = useState('3rd Year');
  const [section, setSection] = useState('');
  const [durationDays, setDurationDays] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);

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

  const handleBookChange = (id: string) => {
    setSelectedBookId(id);
    const found = books.find((b) => b.id === id);
    setSelectedBook(found || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim() || !studentId.trim() || !course.trim() || !yearLevel.trim() || !section.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    if (durationDays < 1 || durationDays > 7) {
      toast.error('Borrow duration cannot exceed 7 days.');
      return;
    }

    if (!selectedBookId) {
      toast.error('Please select a book to borrow.');
      return;
    }

    setSubmitting(true);
    try {
      await dataService.submitBorrowRequest({
        student_name: studentName,
        student_id: studentId,
        course,
        year_level: yearLevel,
        section,
        book_id: selectedBookId,
        duration_days: durationDays,
      });

      toast.success('Borrow request submitted successfully.');
      navigate('/request-success', {
        state: {
          studentName,
          bookTitle: selectedBook?.title || 'Book',
          durationDays,
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit borrow request.');
    } finally {
      setSubmitting(false);
    }
  };

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
          Please fill out your student details and select your requested duration (1-7 days).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Student Info Card */}
          <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Student Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan Dela Cruz"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Student ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2023-01042"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Course *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BS Information Technology"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Year Level *</label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Section *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSIT-3A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
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
                <span className="text-slate-700 font-medium">Duration (1-7 Days):</span>
                <span className="font-extrabold text-emerald-700 text-base">{durationDays} Day(s)</span>
              </div>

              <input
                type="range"
                min={1}
                max={7}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>1 Day</span>
                <span>3 Days</span>
                <span>5 Days</span>
                <span>7 Days (Max)</span>
              </div>
            </div>
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
              <span>Book Information (Read Only)</span>
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Select Book Title</label>
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
                <div className="w-full h-32 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                  <BookOpen className="w-10 h-10 text-emerald-600" />
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Title</span>
                    <p className="text-base font-bold text-slate-900">{selectedBook.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Type</span>
                      <span className="text-xs font-bold text-emerald-700">{selectedBook.type_name}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Series</span>
                      <span className="text-xs font-bold text-slate-700">{selectedBook.series_name}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Availability:</span>
                    <span className="font-bold text-slate-900">
                      {selectedBook.available_copies} / {selectedBook.total_copies} Copies
                    </span>
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
