'use client';

import { useState } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import Badge from '../../../components/ui/Badge';
import ResidentBadges from '../../../components/ui/ResidentBadges';
import { GENDER_LABELS, RELATION_LABELS, AID_TYPE_LABELS, AID_TYPE_COLORS } from '../../../lib/constants';
import * as XLSX from 'xlsx';

type ReportType =
  | 'elderly' | 'chronic' | 'pregnant'
  | 'breastfeeding' | 'children-under-2'
  | 'children-under-5' | 'no-aid' | 'household-aid';

const REPORT_ITEMS: { key: ReportType; label: string; icon: string; color: string }[] = [
  { key: 'elderly', label: 'كبار السن (+60)', icon: '🧓', color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
  { key: 'chronic', label: 'أمراض مزمنة', icon: '🏥', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
  { key: 'pregnant', label: 'الحوامل', icon: '🤰', color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
  { key: 'breastfeeding', label: 'المرضعات', icon: '👶', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
  { key: 'children-under-2', label: 'أطفال دون سنتين', icon: '🍼', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
  { key: 'children-under-5', label: 'أطفال دون 5 سنوات', icon: '🧒', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
  { key: 'no-aid', label: 'أسر بدون مساعدة', icon: '⚠️', color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
  { key: 'household-aid', label: 'مساعدات الأسر', icon: '📋', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [total, setTotal] = useState(0);
  function exportToExcel() {
    if (!data.length) return;

    const rows = data.map((r: any) => {
      if (activeReport === 'household-aid') {
        return {
          'رب الأسرة': `${r.head?.firstName} ${r.head?.familyName}`,
          'رقم الهوية': r.head?.nationalId,
          'عدد المساعدات': r.records?.length,
        };
      }
      if (activeReport === 'no-aid') {
        return {
          'رقم الهوية': r.nationalId,
          'الاسم': `${r.firstName} ${r.fatherName} ${r.familyName}`,
          'الهاتف': r.phoneNumber1,
          'الخيمة': r.tentNumber ?? '—',
          'آخر مساعدة': r.lastAidDate ?? 'لم تُسجَّل',
          'أيام بدون مساعدة': r.daysSinceLastAid ?? '—',
        };
      }
      return {
        'رقم الهوية': r.nationalId,
        'الاسم الكامل': `${r.firstName} ${r.fatherName} ${r.grandfatherName} ${r.familyName}`,
        'رقم الهاتف': r.phoneNumber1,
        'العمر': r.age,
        'الجنس': r.gender === 'male' ? 'ذكر' : 'أنثى',
        'الخيمة': r.tentNumber ?? '—',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    ws['!cols'] = Array(8).fill({ wch: 20 });
    XLSX.utils.book_append_sheet(wb, ws, activeItem?.label ?? 'تقرير');
    XLSX.writeFile(wb, `${activeItem?.label ?? 'تقرير'}.xlsx`);
  }

  async function loadReport(key: ReportType, daysParam = days) {
    setActiveReport(key);
    setLoading(true);
    setData([]);
    try {
      const needsDays = key === 'no-aid' || key === 'household-aid';
      const url = needsDays
        ? `/api/reports/${key}?days=${daysParam}`
        : `/api/reports/${key}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  const activeItem = REPORT_ITEMS.find(r => r.key === activeReport);

  return (
    <div>
      <PageHeader title="التقارير" subtitle="تقارير حالة المخيم والمقيمين" />

      {/* Report Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {REPORT_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => loadReport(item.key)}
            className={`flex items-center gap-3 p-4 rounded-xl border text-right font-medium text-sm transition-all ${item.color} ${activeReport === item.key ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Days filter for relevant reports */}
      {(activeReport === 'no-aid' || activeReport === 'household-aid') && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">عدد الأيام:</label>
          {[7, 14, 30, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => { setDays(d); loadReport(activeReport, d); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${days === d ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 hover:bg-slate-50'}`}
            >
              {d} يوم
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {activeReport && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            {/* <h2 className="font-semibold text-slate-700">
              {activeItem?.icon} {activeItem?.label}
            </h2>
            <span className="text-sm text-slate-500">الإجمالي: {total}</span> */}
            <h2 className="font-semibold text-slate-700">
              {activeItem?.icon} {activeItem?.label}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">الإجمالي: {total}</span>
              {data.length > 0 && (
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <span>📥</span>
                  <span>Excel</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : data.length === 0 ? (
            <EmptyState message="لا توجد نتائج" />
          ) : activeReport === 'household-aid' ? (
            <HouseholdAidTable data={data} />
          ) : activeReport === 'no-aid' ? (
            <NoAidTable data={data} />
          ) : (
            <ResidentTable data={data} report={activeReport} />
          )}
        </div>
      )}

      {!activeReport && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <span className="text-5xl mb-3">📊</span>
          <p className="text-base font-medium">اختر تقريراً من القائمة أعلاه</p>
        </div>
      )}
    </div>
  );
}

function ResidentTable({ data, report }: { data: any[]; report: ReportType }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">الاسم</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">رقم الهوية</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">الجنس</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">العمر</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">الخيمة</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">الهاتف</th>
            {report === 'chronic' && <th className="text-right px-4 py-3 font-semibold text-slate-600">المرض</th>}
            <th className="text-right px-4 py-3 font-semibold text-slate-600">الحالة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((r: any) => (
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
              <td className="px-4 py-3 text-slate-600">{r.tentNumber ?? r.headOfHousehold?.tentNumber ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-slate-600">{r.phoneNumber1}</td>
              {report === 'chronic' && (
                <td className="px-4 py-3 text-slate-600 text-xs">{r.chronicDiseaseDescription ?? '—'}</td>
              )}
              <td className="px-4 py-3">
                <Badge label={RELATION_LABELS[r.relationToHead]} color={r.relationToHead === 'head' ? 'blue' : 'gray'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NoAidTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">رب الأسرة</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">رقم الهوية</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">الخيمة</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">الهاتف</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">آخر مساعدة</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">أيام بدون مساعدة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((r: any) => (
            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-800">
                {r.firstName} {r.fatherName} {r.familyName}
              </td>
              <td className="px-4 py-3 text-slate-600 font-mono">{r.nationalId}</td>
              <td className="px-4 py-3 text-slate-600">{r.tentNumber ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-slate-600">{r.phoneNumber1}</td>
              <td className="px-4 py-3 text-slate-500">
                {r.lastAidDate ? new Date(r.lastAidDate).toLocaleDateString('ar-EG') : 'لم تُسجَّل مساعدة'}
              </td>
              <td className="px-4 py-3">
                {r.daysSinceLastAid !== null ? (
                  <Badge label={`${r.daysSinceLastAid} يوم`} color={r.daysSinceLastAid > 60 ? 'red' : 'orange'} />
                ) : (
                  <Badge label="لا يوجد" color="red" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HouseholdAidTable({ data }: { data: any[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {data.map((household: any) => (
        <div key={household.head?.id} className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-semibold text-slate-800">
              {household.head?.firstName} {household.head?.fatherName} {household.head?.familyName}
            </span>
            <span className="text-slate-400 font-mono text-sm">{household.head?.nationalId}</span>
            {household.head?.tentNumber && (
              <Badge label={`خيمة ${household.head.tentNumber}`} color="blue" />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {household.records.map((rec: any) => (
              <div key={rec.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge label={AID_TYPE_LABELS[rec.aidType]} color={AID_TYPE_COLORS[rec.aidType]} />
                  <span className="text-slate-500 text-xs">{rec.source}</span>
                </div>
                <div className="text-left">
                  {rec.amount && <span className="font-medium text-slate-700 ml-2">₪{rec.amount}</span>}
                  <span className="text-slate-400 text-xs">{new Date(rec.aidDate).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}