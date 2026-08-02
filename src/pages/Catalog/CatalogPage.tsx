import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Search, Filter, BookOpen, CheckCircle, BookMarked, Sparkles } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');

  const { data: books = [], isLoading: loadingBooks } = useQuery({
    queryKey: ['books'],
    queryFn: () => dataService.getBooks(),
  });

  const { data: bookTypes = [] } = useQuery({
    queryKey: ['bookTypes'],
    queryFn: () => dataService.getBookTypes(),
  });

  const { data: bookSeries = [] } = useQuery({
    queryKey: ['bookSeries'],
    queryFn: () => dataService.getBookSeries(),
  });

  const filteredBooks = books.filter((book) => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.type_name && book.type_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.series_name && book.series_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || book.type_id === selectedType;
    const matchesSeries = selectedSeries === 'all' || book.series_id === selectedSeries;

    return matchesSearch && matchesType && matchesSeries;
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
            placeholder="Search by title, type, or series..."
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

        {/* Series Filter */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer shadow-xs font-medium"
          >
            <option value="all">All Series</option>
            {bookSeries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {book.series_name || 'Series'}
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

                  <button
                    onClick={() => navigate(`/borrow?bookId=${book.id}`)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                      isAvailable
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isAvailable ? 'Borrow Book' : 'Request Book (Waitlist)'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
