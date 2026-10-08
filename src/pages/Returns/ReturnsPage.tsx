import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { CheckCircle2, Search } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: returnsList = [], isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => dataService.getReturns(),
  });

  const filteredReturns = returnsList.filter((ret) => {
    const q = searchTerm.toLowerCase();
    return (
      ret.book_title.toLowerCase().includes(q) ||
      ret.student_name.toLowerCase().includes(q) ||
      (ret.serial_number && ret.serial_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-800">Returns History</h1>
        <p className="text-xs text-slate-500">Complete log of all returned books and replenished inventory copies.</p>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by book title, student, or serial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
        />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Book Title</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">Borrow Date</th>
                <th className="px-4 py-3">Return Date</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading returns history...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    {searchTerm ? 'No returns match your search.' : 'No return records found. Returned books will be logged here.'}
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{ret.student_name}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 max-w-xs truncate">
                      {ret.book_title}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-600">
                      {ret.serial_number || <span className="text-slate-300">—</span>}
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
