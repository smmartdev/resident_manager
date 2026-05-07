'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import ResidentBadges from '../../../components/ui/ResidentBadges';
import Badge from '../../../components/ui/Badge';
import { GENDER_LABELS, RELATION_LABELS } from '../../../lib/constants';

export default function ResidentsPage() {
  const [residents, setResidents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [headOnly, setHeadOnly] = useState(false);
  const [gender, setGender] = useState('');

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        ...(search && { search }),
        ...(headOnly && { headOnly: 'true' }),
        ...(gender && { gender }),
      });
      const res = await fetch(`/api/residents?${params}`);
      const data = await res.json();
      setResidents(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, headOnly, gender]);

  useEffect(() => { fetchResidents(); }, [fetchResidents]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="المقيمون"
        subtitle={`إجمالي: ${total} مقيم`}
        actions={
          <Link href="/residents/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            ➕ إضافة مقيم
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">بحث</label>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="اسم، رقم هوية، هاتف..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الجنس</label>
            <select
              value={gender}
              onChange={e => { setGender(e.target.value); setPage(1); }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">الكل</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="headOnly"
              checked={headOnly}
              onChange={e => { setHeadOnly(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="headOnly" className="text-sm font-medium text-slate-700">أرباب الأسر فقط</label>
          </div>

          <button type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            بحث
          </button>

          <button type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setGender(''); setHeadOnly(false); setPage(1); }}
            className="border border-slate-300 hover:bg-slate-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            مسح
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : residents.length === 0 ? (
          <EmptyState message="لا يوجد مقيمون مطابقون للبحث" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الاسم</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">رقم الهوية</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الجنس</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">العمر</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الصلة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الخيمة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الهاتف</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {residents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {r.firstName} {r.fatherName} {r.familyName}
                      </div>
                      <ResidentBadges resident={r} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{r.nationalId}</td>
                    <td className="px-4 py-3 text-slate-600">{GENDER_LABELS[r.gender]}</td>
                    <td className="px-4 py-3 text-slate-600">{r.age} سنة</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={RELATION_LABELS[r.relationToHead]}
                        color={r.relationToHead === 'head' ? 'blue' : 'gray'}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.tentNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{r.phoneNumber1}</td>
                    <td className="px-4 py-3">
                      <Badge label={r.isActive ? 'نشط' : 'غير نشط'} color={r.isActive ? 'green' : 'gray'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/residents/${r.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                          عرض
                        </Link>
                        <Link href={`/residents/${r.id}/edit`}
                          className="text-slate-600 hover:text-slate-800 font-medium text-xs px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                          تعديل
                        </Link>
                      </div>
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