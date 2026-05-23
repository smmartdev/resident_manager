'use client';

import * as XLSX from 'xlsx';
import { GENDER_LABELS, RELATION_LABELS } from '../../lib/constants';

interface ResidentsModalProps {
  open: boolean;
  data: any[];
  loading: boolean;
  onClose: () => void;
}

export default function ResidentsModal({ open, data, loading, onClose }: ResidentsModalProps) {
  if (!open) return null;

  function exportToExcel() {
    const rows = data.map(r => ({
      'رقم الهوية': r.nationalId,
      'الاسم الكامل': `${r.firstName} ${r.fatherName} ${r.grandfatherName} ${r.familyName}`,
      'الجنس': GENDER_LABELS[r.gender] ?? r.gender,
      'تاريخ الميلاد': r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString('ar-EG') : '—',
      'العمر': r.age,
      'رقم الهاتف': r.phoneNumber1,
      'رقم الخيمة': r.tentNumber ?? '—',
      'الصلة': RELATION_LABELS[r.relationToHead] ?? r.relationToHead,
      'رب الأسرة': r.headOfHousehold
        ? `${r.headOfHousehold.firstName} ${r.headOfHousehold.familyName}`
        : '—',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    ws['!cols'] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 8 },
      { wch: 15 },
      { wch: 8 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'كشف المقيمين');
    XLSX.writeFile(wb, 'كشف_المقيمين.xlsx');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">👥 كشف المقيمين</h2>
          <div className="flex items-center gap-2">
            {data.length > 0 && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span>📥</span>
                <span>تصدير Excel</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">جاري التحميل...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-sm">لا توجد بيانات</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">#</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">رقم الهوية</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الاسم الكامل</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الجنس</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">العمر</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الهاتف</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الخيمة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الصلة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">رب الأسرة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((r: any, i: number) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.nationalId}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.firstName} {r.fatherName} {r.grandfatherName} {r.familyName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{GENDER_LABELS[r.gender] ?? r.gender}</td>
                    <td className="px-4 py-3 text-slate-600">{r.age}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.phoneNumber1}</td>
                    <td className="px-4 py-3 text-slate-600">{r.tentNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {RELATION_LABELS[r.relationToHead] ?? r.relationToHead}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.headOfHousehold
                        ? `${r.headOfHousehold.firstName} ${r.headOfHousehold.familyName}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {data.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 text-sm text-slate-500">
            إجمالي المقيمين: {data.length}
          </div>
        )}
      </div>
    </div>
  );
}