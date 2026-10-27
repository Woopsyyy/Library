import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Book } from '../types';
import { dataService } from '../services/dataService';
import { BookOpen, Hash, Info, X } from 'lucide-react';

export const BookDetailsModal: React.FC<{ book: Book; onClose: () => void }> = ({ book, onClose }) => {
  const { data: copies = [], isLoading } = useQuery({
    queryKey: ['copies', book.id],
    queryFn: () => dataService.getBookCopies(book.id),
  });
  const availableCount = copies.filter(copy => copy.status === 'Available').length;

  return (
    <div className="book-modal-backdrop fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="book-modal-panel bg-white rounded-3xl p-5 sm:p-8 max-w-3xl w-full space-y-6 border border-white/70 shadow-2xl max-h-[94vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="book-details-title">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3"><span className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center"><Info className="w-6 h-6 text-emerald-700" /></span><div><h3 id="book-details-title" className="text-xl sm:text-2xl font-black text-slate-900">Book Details</h3><p className="text-sm text-slate-500">Title information and copy availability</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close book details" className="p-3 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-5 sm:gap-7">
          <div className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            {book.cover_url ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-emerald-600"><BookOpen className="w-12 h-12" /></div>}
          </div>
          <div className="space-y-3 min-w-0">
            <span className="inline-flex px-3 py-1 rounded-full text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">{book.type_name || 'General'}</span>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{book.title}</h4>
            {book.author && <p className="text-lg text-slate-700 font-semibold">by {book.author}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-base text-slate-700">
              {book.publisher && <p><span className="font-bold text-slate-900">Publisher:</span> {book.publisher}</p>}
              {book.published_date && <p><span className="font-bold text-slate-900">Published:</span> {book.published_date}</p>}
              {book.copyright_year && <p><span className="font-bold text-slate-900">Copyright:</span> {book.copyright_year}</p>}
              {book.location && <p><span className="font-bold text-slate-900">Location:</span> {book.location}</p>}
              {book.accession_number && <p><span className="font-bold text-slate-900">Accession number:</span> {book.accession_number}</p>}
            </div>
            {book.tags && book.tags.length > 0 && <div className="flex flex-wrap items-center gap-2 pt-1"><span className="text-base font-bold text-slate-900">Tags:</span>{book.tags.map(tag => <span key={tag} className="px-3 py-1 rounded-full text-sm font-semibold bg-violet-50 text-violet-800 border border-violet-100">{tag}</span>)}</div>}
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-base font-bold text-slate-800"><span>Available copies</span><span className="text-emerald-700">{book.available_copies} of {book.total_copies}</span></div>
          </div>
        </div>

        <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div><h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><Hash className="w-5 h-5 text-emerald-700" />Calling Numbers</h4><p className="text-sm text-slate-600 mt-1">Green numbers are available; red numbers are unavailable.</p></div>
            <span className="text-sm font-bold text-emerald-800 bg-white px-3 py-2 rounded-xl border border-emerald-200">{availableCount} available</span>
          </div>
          {isLoading ? <p className="text-base text-slate-500 py-5 text-center">Loading calling numbers...</p> : copies.length === 0 ? <p className="text-base text-slate-500 py-5 text-center">No calling numbers registered yet.</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {copies.map(copy => {
                const available = copy.status === 'Available';
                return <div key={copy.id} className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-base ${available ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                  <span className="font-mono font-bold">{copy.serial_number}</span><span className={`text-sm px-3 py-1 rounded-full font-bold ${available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{available ? 'Available' : 'Unavailable'}</span>
                </div>;
              })}
            </div>
          )}
        </section>
        <div className="flex justify-end"><button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-base font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors">Close</button></div>
      </div>
    </div>
  );
};
