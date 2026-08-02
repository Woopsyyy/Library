import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { CheckCircle2 } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  const { data: returnsList = [], isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => dataService.getReturns(),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-800">Returns History</h1>
        <p className="text-xs text-slate-500">Complete log of all returned books and replenished inventory copies.</p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Book Title</th>
                <th className="px-4 py-3">Borrow Date</th>
                <th className="px-4 py-3">Return Date</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Loading returns history...
                  </td>
                </tr>
              ) : returnsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No return records found. Returned books will be logged here.
                  </td>
                </tr>
              ) : (
                returnsList.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{ret.student_name}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 max-w-xs truncate">
                      {ret.book_title}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(ret.borrow_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[11px] font-medium">
                      {new Date(ret.return_date).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(ret.return_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Returned</span>
                      </span>
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
