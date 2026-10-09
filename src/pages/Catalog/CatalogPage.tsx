import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book } from '../../types';
import { Search, Filter, BookOpen, CheckCircle, BookMarked, Sparkles, Hash, X, Info } from 'lucide-react';

const BookSerialsModal: React.FC<{
  book: Book;
  onClose: () => void;
  onBorrow: (bookId: string) => void;
}> = ({ book, onClose, onBorrow }) => {
  const { data: copies = [], isLoading } = useQuery({
    queryKey: ['copies', book.id],
    queryFn: () => dataService.getBookCopies(book.id),
  });

  const availableCount = copies.filter((c) => c.status === 'Available').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Book Information &amp; Serial Numbers</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Book Details */}
        <div className="flex gap-4">
          <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-600">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {book.type_name || 'General'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">{book.title}</h4>
            {book.author && <p className="text-xs text-slate-500 font-medium">by {book.author}</p>}
            <p className="text-xs text-slate-600 font-semibold pt-1">
              Availability: <span className="text-emerald-700 font-bold">{book.available_copies} / {book.total_copies} Copies</span>
            </p>
          </div>
        </div>

        {/* Copy Serials Section */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-emerald-600" />
                <span>Physical Copies &amp; Serials</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Each physical book has a unique serial number automatically assigned.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
              {availableCount} Available
            </span>
          </div>

          {isLoading ? (
            <p className="text-xs text-slate-400 py-4 text-center">Loading serial numbers...</p>
          ) : copies.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center italic">No copies registered for this book yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {copies.map((copy) => {
                const isAvail = copy.status === 'Available';
                return (
                  <div
                    key={copy.id}
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isAvail
                        ? 'bg-white border-emerald-200 text-slate-800 shadow-xs'
                        : 'bg-slate-100/70 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="font-mono font-bold text-[11px]">{copy.serial_number}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isAvail
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {copy.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onBorrow(book.id);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Borrow This Book</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBookForInfo, setSelectedBookForInfo] = useState<Book | null>(null);

  const { data: books = [], isLoading: loadingBooks } = useQuery({
    queryKey: ['books'],
    queryFn: () => dataService.getBooks(),
  });

  const { data: bookTypes = [] } = useQuery({
    queryKey: ['bookTypes'],
    queryFn: () => dataService.getBookTypes(),
  });

  const filteredBooks = books.filter((book) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(q) ||
      (book.type_name && book.type_name.toLowerCase().includes(q)) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (Array.isArray(book.tags) && book.tags.some((t) => t.toLowerCase().includes(q)));

    const matchesType = selectedType === 'all' || book.type_id === selectedType;

    return matchesSearch && matchesType;
  });

  const getBookCover = (index: number) => {
    const covers = [
      '/images/1.jpg',
      '/images/2.jpg',
      '/images/1.jpg',
      '/images/2.jpg',
    ];
    return covers[index % covers.length];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Library Collection</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Library Book Catalog</h1>
          <p className="text-sm text-slate-600 font-medium">Search available titles, check copy inventory, and select a book to submit a borrow request.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-xs">
          <BookMarked className="w-4 h-4 text-emerald-600" />
          <span>Showing {filteredBooks.length} of {books.length} Books</span>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="glass-card p-4 rounded-2xl space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 shadow-sm border border-slate-200">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, type, series, author, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all shadow-xs"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer shadow-xs font-medium"
          >
            <option value="all">All Book Types</option>
            {bookTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Book Cards Grid */}
      {loadingBooks ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Loading library catalog...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3 bg-white border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No books found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">
            Try adjusting your search criteria or resetting filters to browse all available books.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book, idx) => {
            const isAvailable = Number(book.available_copies) > 0;
            const coverImg = book.cover_url || getBookCover(idx);
            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl p-4 flex flex-col justify-between space-y-4 group overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all duration-300"
              >
                <div className="space-y-3">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {book.type_name || 'General'}
                    </span>
                  </div>

                  {/* Book Cover Image */}
                  <div className="w-full h-48 rounded-xl overflow-hidden relative bg-slate-100 border border-slate-200 group-hover:shadow-sm transition-all">
                    <img
                      src={coverImg}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                      <span className="text-[10px] font-mono font-bold bg-white/90 px-2 py-0.5 rounded text-slate-800 border border-slate-200 shadow-xs">
                        {book.available_copies} / {book.total_copies} Copies
                      </span>
                    </div>
                  </div>

                  {/* Book Title */}
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-xs text-slate-500 font-medium -mt-2">by {book.author}</p>
                  )}
                  {Array.isArray(book.tags) && book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.tags.slice(0, 4).map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inventory & Borrow Button */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isAvailable ? 'Available' : book.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookForInfo(book)}
                      className="py-2.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs"
                      title="View book information and copy serial numbers"
                    >
                      <Hash className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Serials</span>
                    </button>

                    <button
                      onClick={() => {
                        const borrowUrl = `/borrow?bookId=${book.id}`;
                        if (!dataService.getCurrentStudent()) {
                          navigate('/login', { state: { from: borrowUrl } });
                        } else {
                          navigate(borrowUrl);
                        }
                      }}
                      className={`py-2.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                        isAvailable
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Borrow' : 'Waitlist'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Information & Serials Modal */}
      {selectedBookForInfo && (
        <BookSerialsModal
          book={selectedBookForInfo}
          onClose={() => setSelectedBookForInfo(null)}
          onBorrow={(id) => {
            const borrowUrl = `/borrow?bookId=${id}`;
            if (!dataService.getCurrentStudent()) {
              navigate('/login', { state: { from: borrowUrl } });
            } else {
              navigate(borrowUrl);
            }
          }}
        />
      )}
    </div>
  );
};
