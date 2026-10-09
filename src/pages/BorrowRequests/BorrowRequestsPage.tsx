import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Check, X, User } from 'lucide-react';

export const BorrowRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['borrowRequests'],
    queryFn: () => dataService.getBorrowRequests(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => dataService.approveBorrowRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowRequests'] });
      queryClient.invalidateQueries({ queryKey: ['borrowedBooks'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['copies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Borrow approved.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to approve request.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => dataService.rejectBorrowRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowRequests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Borrow rejected.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject request.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-800">Borrow Requests</h1>
        <p className="text-xs text-slate-500">Review pending online book requests submitted by students.</p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Course / Year / Sec</th>
                <th className="px-4 py-3">Requested Book</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3 text-center">Duration</th>
                <th className="px-4 py-3">Request Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    No borrow requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500" />
                      <span>{req.student_name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{req.student_id}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {req.course} ({req.year_level} - {req.section})
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{req.book_title}</td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-700">
                      {req.serial_number ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {req.serial_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Auto-assign</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {req.duration_days} Days
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(req.request_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => approveMutation.mutate(req.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 font-semibold flex items-center gap-1 transition-all"
                            title="Approve Request"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(req.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-semibold flex items-center gap-1 transition-all"
                            title="Reject Request"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
