'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { AID_TYPE_LABELS, AID_TYPE_COLORS } from '../../../lib/constants';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

export default function AidPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [aidType, setAidType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        ...(aidType && { aidType }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });
      const res = await fetch(`/api/aid?${params}`);
      const data = await res.json();
      setRecords(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, aidType, fromDate, toDate]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // async function handleDelete(id: number) {
  //   if (!confirm('هل تريد حذف هذا السجل؟')) return;
  //   await fetch(`/api/aid/${id}`, { method: 'DELETE' });
  //   fetchRecords();
  // }
  async function handleDelete(id: number) {
    await fetch(`/api/aid/${id}`, { method: 'DELETE' });
    setConfirmId(null);
    fetchRecords();
  }

  return (
    
    <div>
      <ConfirmDialog
        open={confirmId !== null}
        title="حذف سجل المساعدة"
        message="هل تريد حذف هذا السجل نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        danger
        onConfirm={() => confirmId !== null && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
      <PageHeader
        title="سجلات المساعدات"
        subtitle={`إجمالي: ${total} سجل`}
        actions={
          <Link href="/aid/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            ➕ تسجيل مساعدة
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">نوع المساعدة</label>
            <select value={aidType} onChange={e => { setAidType(e.target.value); setPage(1); }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">الكل</option>
              {Object.entries(AID_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">من تاريخ</label>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">إلى تاريخ</label>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => { setAidType(''); setFromDate(''); setToDate(''); setPage(1); }}
            className="border border-slate-300 hover:bg-slate-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            مسح
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <LoadingSpinner /> : records.length === 0 ? (
          <EmptyState message="لا توجد سجلات مساعدات" icon="🤝" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">رب الأسرة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">نوع المساعدة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">المبلغ</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">التاريخ</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">المصدر</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">ملاحظات</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/residents/${r.headOfHouseholdId}`}
                        className="text-blue-600 hover:underline font-medium">
                        {r.headOfHousehold?.firstName} {r.headOfHousehold?.familyName}
                      </Link>
                      <p className="text-xs text-slate-400 font-mono">{r.headOfHousehold?.nationalId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={AID_TYPE_LABELS[r.aidType]} color={AID_TYPE_COLORS[r.aidType]} />
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {r.amount ? `₪ ${r.amount}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(r.aidDate).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.source}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setConfirmId(r.id)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}