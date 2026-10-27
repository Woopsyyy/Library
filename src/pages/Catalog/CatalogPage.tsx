import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book, StudentBookListKind } from '../../types';
import { BookDetailsModal } from '../../components/BookDetailsModal';
import { Search, Filter, BookOpen, BookMarked, Sparkles, Heart, BookmarkPlus, ThumbsUp, Info } from 'lucide-react';
import { toast } from 'sonner';

const listActions: { kind: StudentBookListKind; label: string; Icon: React.ElementType }[] = [
  { kind: 'favorite', label: 'Favorite', Icon: Heart },
  { kind: 'wishlist', label: 'Wishlist', Icon: BookmarkPlus },
  { kind: 'recommendation', label: 'Recommend', Icon: ThumbsUp },
];

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const student = dataService.getCurrentStudent();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [popAction, setPopAction] = useState<string | null>(null);
  const { data: books = [], isLoading: loadingBooks } = useQuery({ queryKey: ['books'], queryFn: () => dataService.getBooks() });
  const { data: bookTypes = [] } = useQuery({ queryKey: ['bookTypes'], queryFn: () => dataService.getBookTypes() });
  const listQueryKey = ['studentBookLists', student?.id];
  const { data: studentLists } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => dataService.getStudentBookLists(student!.id),
    enabled: Boolean(student),
  });
  const toggleList = useMutation({
    mutationFn: ({ bookId, kind }: { bookId: string; kind: StudentBookListKind }) => dataService.toggleStudentBookList(student!.id, bookId, kind),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listQueryKey }),
    onError: (error: Error) => toast.error(error.message || 'Could not update your book list.'),
  });
  const filteredBooks = books.filter(book => {
    const q = searchTerm.toLowerCase();
    const matches = book.title.toLowerCase().includes(q) || (book.type_name || '').toLowerCase().includes(q) || (book.author || '').toLowerCase().includes(q) || (book.tags || []).some(tag => tag.toLowerCase().includes(q));
    return matches && (selectedType === 'all' || book.type_id === selectedType);
  });
  const fallbackCovers = ['/images/1.jpg', '/images/2.jpg'];

  const handleListAction = (bookId: string, kind: StudentBookListKind) => {
    if (!student) {
      navigate('/login', { state: { from: '/catalog' } });
      return;
    }
    const actionKey = `${bookId}:${kind}`;
    setPopAction(actionKey);
    window.setTimeout(() => setPopAction(current => current === actionKey ? null : current), 650);
    toggleList.mutate({ bookId, kind });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2"><Sparkles className="w-3.5 h-3.5" /><span>Digital Library Collection</span></div><h1 className="text-3xl font-black text-slate-900">Library Book Catalog</h1><p className="text-sm text-slate-600 font-medium">Browse book details, calling numbers, and save books to your lists.</p></div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200"><BookMarked className="w-4 h-4" /><span>Showing {filteredBooks.length} of {books.length} Books</span></div>
      </div>
      <div className="glass-card p-4 rounded-2xl space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 shadow-sm border border-slate-200">
        <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Search by title, course, author, or tag..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm" /></div>
        <div className="flex items-center gap-2 min-w-[200px]"><Filter className="w-4 h-4 text-slate-400 hidden sm:inline" /><select value={selectedType} onChange={event => setSelectedType(event.target.value)} className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm cursor-pointer"><option value="all">All Courses</option>{bookTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></div>
      </div>
      {loadingBooks ? <div className="py-20 text-center text-slate-500 font-medium">Loading library catalog...</div> : filteredBooks.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-200"><BookOpen className="w-12 h-12 text-slate-400 mx-auto" /><h3 className="text-lg font-bold text-slate-800 mt-3">No books found</h3><p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria.</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book, index) => {
            const isAvailable = Number(book.available_copies) > 0;
            return <article key={book.id} className="bg-white rounded-2xl p-4 flex flex-col justify-between gap-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all">
              <div className="space-y-3"><span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{book.type_name || 'General'}</span>
                <div className="w-full h-48 rounded-xl overflow-hidden relative bg-slate-100 border border-slate-200"><img src={book.cover_url || fallbackCovers[index % fallbackCovers.length]} alt={book.title} className="w-full h-full object-cover" /><div className="absolute bottom-2 left-2"><span className="text-[10px] font-mono font-bold bg-white/90 px-2 py-0.5 rounded text-slate-800">{book.available_copies} / {book.total_copies} Copies</span></div></div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-2">{book.title}</h3>{book.author && <p className="text-xs text-slate-500 font-medium">by {book.author}</p>}
                {book.tags && book.tags.length > 0 && <div className="flex flex-wrap gap-1">{book.tags.slice(0, 4).map(tag => <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700">{tag}</span>)}</div>}
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Status</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{isAvailable ? 'Available' : 'Unavailable'}</span></div>
                <button type="button" onClick={() => setSelectedBook(book)} className="w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all hover:shadow-sm"><Info className="w-5 h-5" />More Details</button>
                <div className="grid grid-cols-3 gap-1.5">{listActions.map(({ kind, label, Icon }) => {
                  const active = studentLists?.[kind]?.some(item => item.id === book.id) || false;
                  const isPopping = popAction === `${book.id}:${kind}`;
                  const activeTone = kind === 'favorite' ? 'bg-rose-50 border-rose-300 text-rose-700' : kind === 'wishlist' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-emerald-50 border-emerald-300 text-emerald-800';
                  return <button key={kind} type="button" onClick={() => handleListAction(book.id, kind)} disabled={toggleList.isPending} aria-pressed={active} aria-label={`${active ? 'Remove from' : 'Add to'} ${label}`} title={label} className={`relative overflow-hidden py-2.5 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center gap-1 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${active ? activeTone : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} ${isPopping ? 'reaction-pop' : ''}`}><Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''} ${isPopping ? 'reaction-icon-pop' : ''}`} fill={active && kind === 'favorite' ? 'currentColor' : 'none'} /><span>{label}</span>{isPopping && <span key={popAction} className="reaction-burst" aria-hidden="true">{kind === 'favorite' ? '♥' : kind === 'wishlist' ? '★' : '✦'}</span>}</button>;
                })}</div>
              </div>
            </article>;
          })}
        </div>
      )}
      {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
};
