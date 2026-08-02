import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Book, BookStatus } from '../../types';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search, BookOpen, X, UploadCloud } from 'lucide-react';

const BookCoverDropzone: React.FC<{
  preview: string;
  onSelect: (file: File, preview: string) => void;
  onClear: () => void;
}> = ({ preview, onSelect, onClear }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onSelect(file, String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`cursor-pointer rounded-xl border-2 border-dashed transition-all ${
        dragOver
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Book cover preview" className="w-full h-40 object-contain p-2" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-500 hover:text-rose-600 shadow-xs"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">Drag &amp; drop book cover here</p>
          <p className="text-[11px] text-slate-500 font-medium">or click to browse · PNG, JPG, WebP (max 5MB)</p>
        </div>
      )}
    </div>
  );
};

export const BooksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const actionParam = searchParams.get('action');

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [typeId, setTypeId] = useState('');
  const [seriesId, setSeriesId] = useState('');
  const [totalCopies, setTotalCopies] = useState<number>(1);
  const [availableCopies, setAvailableCopies] = useState<number>(1);
  const [status, setStatus] = useState<BookStatus>('Available');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');

  // Queries
  const { data: books = [], isLoading } = useQuery({
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

  useEffect(() => {
    if (actionParam === 'add') {
      openAddModal();
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [actionParam]);

  const openAddModal = () => {
    setTitle('');
    if (bookTypes.length > 0) setTypeId(bookTypes[0].id);
    if (bookSeries.length > 0) setSeriesId(bookSeries[0].id);
    setTotalCopies(1);
    setCoverFile(null);
    setCoverPreview('');
    setIsAddOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setTypeId(book.type_id);
    setSeriesId(book.series_id);
    setTotalCopies(book.total_copies);
    setAvailableCopies(book.available_copies);
    setStatus(book.status);
    setCoverFile(null);
    setCoverPreview(book.cover_url || '');
  };

  const addMutation = useMutation({
    mutationFn: (data: { title: string; type_id: string; series_id: string; total_copies: number; cover_file?: File | null }) =>
      dataService.addBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Book added.');
      setIsAddOpen(false);
      setCoverFile(null);
      setCoverPreview('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add book.');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Book> & { cover_file?: File | null } }) =>
      dataService.updateBook(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Book updated.');
      setEditingBook(null);
      setCoverFile(null);
      setCoverPreview('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update book.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Book deleted.');
      setDeletingBookId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete book.');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    addMutation.mutate({
      title,
      type_id: typeId || (bookTypes[0]?.id || ''),
      series_id: seriesId || (bookSeries[0]?.id || ''),
      total_copies: Number(totalCopies),
      cover_file: coverFile,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    editMutation.mutate({
      id: editingBook.id,
      updates: {
        title,
        type_id: typeId,
        series_id: seriesId,
        total_copies: Number(totalCopies),
        available_copies: Number(availableCopies),
        status,
        cover_file: coverFile,
      },
    });
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.type_name && b.type_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.series_name && b.series_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Books Inventory</h1>
          <p className="text-xs font-medium text-slate-500">Manage catalog titles, series, and available stock copies.</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Book</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by title, type, or series..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Cover</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Series</th>
                <th className="px-4 py-3 text-center">Total Copies</th>
                <th className="px-4 py-3 text-center">Available Copies</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Loading books from database...
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No books found in catalog. Click "Add Book" to add one to Supabase database.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={`Cover of ${book.title}`}
                          className="w-9 h-11 rounded object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-9 h-11 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-emerald-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-xs truncate">{book.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {book.type_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {book.series_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">{book.total_copies}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">
                      {book.available_copies} / {book.total_copies}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          book.available_copies > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {book.available_copies > 0 ? 'Available' : book.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(book)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Edit Book"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingBookId(book.id)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Book Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Book</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Book Cover (Optional)</label>
                <BookCoverDropzone
                  preview={coverPreview}
                  onSelect={(file, preview) => {
                    setCoverFile(file);
                    setCoverPreview(preview);
                  }}
                  onClear={() => {
                    setCoverFile(null);
                    setCoverPreview('');
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Type *</label>
                  <select
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                  >
                    {bookTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Series *</label>
                  <select
                    value={seriesId}
                    onChange={(e) => setSeriesId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                  >
                    {bookSeries.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Total Copies *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Book</h3>
              <button onClick={() => setEditingBook(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Book Cover</label>
                <BookCoverDropzone
                  preview={coverPreview}
                  onSelect={(file, preview) => {
                    setCoverFile(file);
                    setCoverPreview(preview);
                  }}
                  onClear={() => {
                    setCoverFile(null);
                    setCoverPreview('');
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Type</label>
                  <select
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                  >
                    {bookTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Series</label>
                  <select
                    value={seriesId}
                    onChange={(e) => setSeriesId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                  >
                    {bookSeries.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Total Copies</label>
                  <input
                    type="number"
                    min={1}
                    value={totalCopies}
                    onChange={(e) => setTotalCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Available Copies</label>
                  <input
                    type="number"
                    min={0}
                    max={totalCopies}
                    value={availableCopies}
                    onChange={(e) => setAvailableCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBookId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 text-center border border-slate-200 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Delete Book?</h3>
            <p className="text-xs text-slate-500 font-medium">
              Are you sure you want to remove this book from the catalog? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingBookId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingBookId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
