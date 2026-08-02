import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { RotateCcw, Clock, AlertTriangle } from 'lucide-react';

export const BorrowedBooksPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['borrowedBooks'],
    queryFn: () => dataService.getBorrowedBooks(),
  });

  const returnMutation = useMutation({
    mutationFn: (recordId: string) => dataService.markReturned(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowedBooks'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Book returned.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to process return.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-800">Borrowed Books</h1>
        <p className="text-xs text-slate-500">Track active book loans, remaining days until due date, and process returns.</p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name (ID)</th>
                <th className="px-4 py-3">Book Title</th>
                <th className="px-4 py-3">Borrow Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-center">Remaining Days</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No active borrowed books.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const isOverdue = rec.remaining_days !== undefined && rec.remaining_days < 0;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 block">{rec.student_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{rec.student_id}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 max-w-xs truncate">
                        {rec.book_title}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(rec.borrow_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px] font-medium">
                        {new Date(rec.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {rec.status === 'Returned' ? (
                          <span className="text-slate-400">-</span>
                        ) : isOverdue ? (
                          <span className="text-rose-600 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {Math.abs(rec.remaining_days || 0)} Days Overdue
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {rec.remaining_days} Day(s) left
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === 'Returned'
                              ? 'bg-slate-100 text-slate-500'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {rec.status !== 'Returned' ? (
                          <button
                            onClick={() => returnMutation.mutate(rec.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-semibold flex items-center gap-1.5 ml-auto transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Mark Returned</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Returned</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
