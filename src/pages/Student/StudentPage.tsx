import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book, StudentBookListKind } from '../../types';
import { BookDetailsModal } from '../../components/BookDetailsModal';
import { toast } from 'sonner';
import { BookOpen, ChevronLeft, ChevronRight, Heart, BookmarkPlus, ThumbsUp, LogOut, X, Info, Clock } from 'lucide-react';

type SectionKind = StudentBookListKind | 'new_arrivals';

type SectionConfig = {
  kind: SectionKind;
  label: string;
  Icon: React.ElementType;
  tone: string;
  /** true for computed sections (new arrivals), false for saved student lists */
  computed: boolean;
};

const sections: SectionConfig[] = [
  { kind: 'new_arrivals', label: 'New Arrivals', Icon: Clock, tone: 'text-emerald-600', computed: true },
  { kind: 'favorite', label: 'Favorites', Icon: Heart, tone: 'text-rose-600', computed: false },
  { kind: 'wishlist', label: 'Wishlist', Icon: BookmarkPlus, tone: 'text-amber-600', computed: false },
  { kind: 'recommendation', label: 'Recommendations', Icon: ThumbsUp, tone: 'text-emerald-600', computed: false },
];

export const StudentPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const student = dataService.getCurrentStudent();
  const [offsets, setOffsets] = useState<Record<SectionKind, number>>({ new_arrivals: 0, favorite: 0, wishlist: 0, recommendation: 0 });
  const [directions, setDirections] = useState<Record<SectionKind, -1 | 1>>({ new_arrivals: 1, favorite: 1, wishlist: 1, recommendation: 1 });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><img src="/images/logo.png" alt="School Logo" className="w-9 h-9 rounded-lg object-contain" /><span className="font-bold">Talisay City College Library</span></Link>
          <div className="flex items-center gap-3"><Link to="/catalog" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Browse Catalog</Link><button type="button" onClick={() => { dataService.logoutStudent(); navigate('/login'); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200"><LogOut className="w-4 h-4" /><span>Sign Out</span></button></div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div><h1 className="text-2xl sm:text-3xl font-black tracking-tight">Welcome, {student.full_name.split(' ')[0]}!</h1><p className="text-sm text-slate-600 font-medium mt-1">Newly added books, your saved books and recommendations.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {sections.map(({ kind, label, Icon, tone }) => {
            const books = getBooksForSection(kind);
            return <div key={kind} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3"><Icon className={`w-5 h-5 ${tone}`} /><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="text-2xl font-black text-slate-900">{books.length}</p></div></div>;
          })}
        </div>
        {sections.map(({ kind, label, Icon, tone }) => {
          const books = getBooksForSection(kind);
          const offset = offsets[kind];
          const loading = getLoadingForSection(kind);
          const error = getErrorForSection(kind);
          const visible = books.length > 3 ? Array.from({ length: 3 }, (_, i) => books[(offset + i) % books.length]) : books;
          return <section key={kind} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Icon className={`w-5 h-5 ${tone}`} /><h2 className="text-base font-bold">{label}</h2><span className="text-xs text-slate-400">{books.length}</span></div>
              {books.length > 3 && <div className="flex gap-2"><button type="button" onClick={() => move(kind, -1, books.length)} aria-label={`Previous ${label}`} className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 transition-all hover:scale-105 active:scale-95"><ChevronLeft className="w-5 h-5" /></button><button type="button" onClick={() => move(kind, 1, books.length)} aria-label={`Next ${label}`} className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 transition-all hover:scale-105 active:scale-95"><ChevronRight className="w-5 h-5" /></button></div>}
            </div>
            {loading ? <div className="bg-white rounded-2xl p-10 text-center text-sm text-slate-500 border border-slate-200">Loading your books...</div> : error ? <div className="bg-rose-50 rounded-2xl p-6 text-center text-sm text-rose-700 border border-rose-200">Could not load this section. Please refresh the page and try again.</div> : books.length === 0 ? <div className="px-5 py-8 text-center space-y-3"><p className="text-sm text-slate-500 font-medium">No books in this section yet.</p>{kind !== 'new_arrivals' ? <Link to="/catalog" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white"><BookOpen className="w-4 h-4" />Browse Catalog</Link> : null}</div> : (
              <div key={`${kind}-${offset}`} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 ${directions[kind] > 0 ? 'carousel-enter-next' : 'carousel-enter-prev'}`}>
                {visible.map(book => <article key={book.id} className="book-list-card rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
                  <button type="button" onClick={() => setSelectedBook(book)} aria-label={`View details for ${book.title}`} className="w-full flex text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
                    <div className="w-28 sm:w-32 min-h-40 shrink-0 bg-slate-100">{book.cover_url ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" /> : <div className="h-full min-h-40 flex items-center justify-center text-emerald-600"><BookOpen className="w-8 h-8" /></div>}</div>
                    <div className="p-4 min-w-0 flex-1 flex flex-col justify-center gap-2"><p className="text-base sm:text-lg font-bold text-slate-900 line-clamp-3 leading-snug">{book.title}</p>{book.author && <p className="text-sm text-slate-600">{book.author}</p>}<p className="text-sm text-emerald-800 font-semibold">{book.type_name || 'General'}</p>{kind === 'new_arrivals' ? <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1">Newly added</span> : <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 mt-1"><Info className="w-4 h-4" />View details</span>}</div>
                  </button>
                  <div className="px-4 pb-3 flex justify-end">{kind !== 'new_arrivals' ? <button type="button" disabled={toggleList.isPending} onClick={() => toggleList.mutate({ bookId: book.id, kind: kind as StudentBookListKind })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"><X className="w-4 h-4" />Remove from {label}</button> : null}</div>
                </article>)}
              </div>
            )}
          </section>;
        })}
      </main>
      {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
};
