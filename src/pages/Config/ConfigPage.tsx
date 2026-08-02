import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Plus, Trash2, Tag, Layers } from 'lucide-react';

export const ConfigPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [newTypeName, setNewTypeName] = useState('');
  const [newSeriesName, setNewSeriesName] = useState('');

  // Queries
  const { data: bookTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['bookTypes'],
    queryFn: () => dataService.getBookTypes(),
  });

  const { data: bookSeries = [], isLoading: loadingSeries } = useQuery({
    queryKey: ['bookSeries'],
    queryFn: () => dataService.getBookSeries(),
  });

  // Type Mutations
  const addTypeMutation = useMutation({
    mutationFn: (name: string) => dataService.addBookType(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookTypes'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Type added.');
      setNewTypeName('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add type.');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteBookType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookTypes'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Type removed.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete type.');
    },
  });

  // Series Mutations
  const addSeriesMutation = useMutation({
    mutationFn: (name: string) => dataService.addBookSeries(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookSeries'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Series added.');
      setNewSeriesName('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add series.');
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteBookSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookSeries'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Series removed.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete series.');
    },
  });

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      toast.error('Type name is required.');
      return;
    }
    addTypeMutation.mutate(newTypeName);
  };

  const handleAddSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesName.trim()) {
      toast.error('Series name is required.');
      return;
    }
    addSeriesMutation.mutate(newSeriesName);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-800">Dynamic Library Configuration</h1>
        <p className="text-xs text-slate-500">Configure book categories (Types) and Series. Changes automatically update all catalog dropdowns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Book Types Configuration */}
        <div className="bg-white rounded-2xl p-6 space-y-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Book Types</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{bookTypes.length} Configured</span>
          </div>

          {/* Add Type Form */}
          <form onSubmit={handleAddType} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Agriculture, Technical..."
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <button
              type="submit"
              disabled={addTypeMutation.isPending}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Type List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {loadingTypes ? (
              <p className="text-xs text-slate-400 text-center py-4">Loading types...</p>
            ) : bookTypes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No book types configured.</p>
            ) : (
              bookTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-700">{type.name}</span>
                  <button
                    onClick={() => deleteTypeMutation.mutate(type.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Type"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Series Configuration */}
        <div className="bg-white rounded-2xl p-6 space-y-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Series</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{bookSeries.length} Configured</span>
          </div>

          {/* Add Series Form */}
          <form onSubmit={handleAddSeries} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Series 1, Series 2..."
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
            <button
              type="submit"
              disabled={addSeriesMutation.isPending}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Series List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {loadingSeries ? (
              <p className="text-xs text-slate-400 text-center py-4">Loading series...</p>
            ) : bookSeries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No series configured.</p>
            ) : (
              bookSeries.map((series) => (
                <div
                  key={series.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-700">{series.name}</span>
                  <button
                    onClick={() => deleteSeriesMutation.mutate(series.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Series"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
