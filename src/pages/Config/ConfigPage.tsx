import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Plus, Trash2, Tag, User, Tags, Edit2, Save } from 'lucide-react';

export const ConfigPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDuration, setNewTypeDuration] = useState('7');
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [editingTypeDuration, setEditingTypeDuration] = useState('');

  // Queries
  const { data: bookTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['bookTypes'],
    queryFn: () => dataService.getBookTypes(),
  });

const { data: authors = [], isLoading: loadingAuthors } = useQuery({
    queryKey: ['authors'],
    queryFn: () => dataService.getAuthors(),
  });

  const { data: tags = [], isLoading: loadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => dataService.getTags(),
  });

  // Type Mutations
  const addTypeMutation = useMutation({
    mutationFn: (data: { name: string; borrow_duration_days?: number }) => dataService.addBookType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookTypes'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Course added.');
      setNewTypeName('');
      setNewTypeDuration('7');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add course.');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteBookType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookTypes'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Course removed.');
      if (editingTypeId) setEditingTypeId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete course.');
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: (data: { id: string; name: string; borrow_duration_days: number }) => dataService.updateBookType(data.id, { name: data.name, borrow_duration_days: data.borrow_duration_days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookTypes'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Course updated.');
      setEditingTypeId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update course.');
    },
  });

  const handleUpdateType = (id: string) => {
    if (!editingTypeName.trim()) {
      toast.error('Course name is required.');
      return;
    }
    const duration = Number(editingTypeDuration || '7');
    if (!Number.isInteger(duration) || duration < 1) {
      toast.error('Borrow duration must be at least 1 day.');
      return;
    }
    updateTypeMutation.mutate({ id, name: editingTypeName, borrow_duration_days: duration });
  };

  // Author Mutations
  const addAuthorMutation = useMutation({
    mutationFn: (name: string) => dataService.addAuthor(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Author added.');
      setNewAuthorName('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add author.');
    },
  });

  const deleteAuthorMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteAuthor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Author removed.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete author.');
    },
  });

  // Tag Mutations
  const addTagMutation = useMutation({
    mutationFn: (name: string) => dataService.addTag(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Tag added.');
      setNewTagName('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add tag.');
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Tag removed.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete tag.');
    },
  });

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      toast.error('Course name is required.');
      return;
    }
    addTypeMutation.mutate({ name: newTypeName, borrow_duration_days: Number(newTypeDuration || '7') });
  };

  const handleAddAuthor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthorName.trim()) {
      toast.error('Author name is required.');
      return;
    }
    addAuthorMutation.mutate(newAuthorName);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      toast.error('Tag name is required.');
      return;
    }
    addTagMutation.mutate(newTagName);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-800">Dynamic Library Configuration</h1>
        <p className="text-xs text-slate-500">Configure courses, authors, and tags. Changes automatically update all catalog dropdowns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Courses Configuration */}
        <div className="bg-white rounded-2xl p-6 space-y-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Courses</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{bookTypes.length} Configured</span>
          </div>

          {/* Add Type Form */}
          <form onSubmit={handleAddType} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a course or subject area..."
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

          {/* Add Type Form */}
          <form onSubmit={handleAddType} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a course or subject area..."
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <input
              type="number"
              min="1"
              placeholder="Days"
              value={newTypeDuration}
              onChange={(e) => setNewTypeDuration(e.target.value)}
              className="w-16 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
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

          {/* Course List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {loadingTypes ? (
              <p className="text-xs text-slate-400 text-center py-4">Loading courses...</p>
            ) : bookTypes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No courses configured.</p>
            ) : (
              bookTypes.map((type) => {
                const isEditing = editingTypeId === type.id;
                return (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="text"
                            value={editingTypeName}
                            onChange={(e) => setEditingTypeName(e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-emerald-400"
                          />
                          <input
                            type="number"
                            min="1"
                            value={editingTypeDuration}
                            onChange={(e) => setEditingTypeDuration(e.target.value)}
                            className="w-16 px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-emerald-400"
                          />
                          <span className="text-[10px] text-slate-400 font-medium">days</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold text-slate-700 truncate">{type.name}</span>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-200 px-2 py-0.5 rounded">{type.borrow_duration_days ?? 7} days</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 ml-2">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateType(type.id)}
                            disabled={updateTypeMutation.isPending}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Save Course"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTypeId(type.id);
                              setEditingTypeName(type.name);
                              setEditingTypeDuration(String(type.borrow_duration_days ?? '7'));
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Edit Course"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTypeMutation.mutate(type.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Authors Configuration */}
        <div className="bg-white rounded-2xl p-6 space-y-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Authors</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{authors.length} Configured</span>
          </div>

          {/* Add Author Form */}
          <form onSubmit={handleAddAuthor} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Jose Rizal..."
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={addAuthorMutation.isPending}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Authors List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {loadingAuthors ? (
              <p className="text-xs text-slate-400 text-center py-4">Loading authors...</p>
            ) : authors.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No authors configured.</p>
            ) : (
              authors.map((author) => (
                <div
                  key={author.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-700">{author.name}</span>
                  <button
                    onClick={() => deleteAuthorMutation.mutate(author.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Author"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tags Configuration */}
        <div className="bg-white rounded-2xl p-6 space-y-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <Tags className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Tags</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{tags.length} Configured</span>
          </div>

          {/* Add Tag Form */}
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Fiction, Reference..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
            />
            <button
              type="submit"
              disabled={addTagMutation.isPending}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Tags List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {loadingTags ? (
              <p className="text-xs text-slate-400 text-center py-4">Loading tags...</p>
            ) : tags.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No tags configured.</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-700">{tag.name}</span>
                  <button
                    onClick={() => deleteTagMutation.mutate(tag.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Tag"
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
