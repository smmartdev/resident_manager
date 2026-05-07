'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../../../../components/ui/PageHeader';
import AlertMessage from '../../../../components/ui/AlertMessage';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import Badge from '../../../../components/ui/Badge';
import { AID_TYPE_LABELS } from '../../../../lib/constants';

type FilterType = 'all' | 'childrenU2' | 'childrenU5' | 'pregnant' | 'chronic' | 'noAid30';

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'الكل', icon: '👥' },
  { key: 'childrenU2', label: 'أطفال دون سنتين', icon: '🍼' },
  { key: 'childrenU5', label: 'أطفال دون 5 سنوات', icon: '🧒' },
  { key: 'pregnant', label: 'حوامل', icon: '🤰' },
  { key: 'chronic', label: 'أمراض مزمنة', icon: '🏥' },
  { key: 'noAid30', label: 'بدون مساعدة 30 يوم', icon: '⚠️' },
];

export default function NewAidPage() {
  const router = useRouter();

  const [allHeads, setAllHeads] = useState<any[]>([]);
  const [displayed, setDisplayed] = useState<any[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(true);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const [aidType, setAidType] = useState('');
  const [amount, setAmount] = useState('');
  const [aidDate, setAidDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Duplicate warning state
  const [duplicateWarnings, setDuplicateWarnings] = useState<{ id: number; name: string; lastDate: string }[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingHeads(true);
      try {
        const [headsRes, noAidRes, u2Res, u5Res, pregRes, chronRes] = await Promise.all([
          fetch('/api/residents?headOnly=true&pageSize=1000&isActive=true').then(r => r.json()),
          fetch('/api/reports/no-aid?days=30').then(r => r.json()),
          fetch('/api/reports/children-under-2').then(r => r.json()),
          fetch('/api/reports/children-under-5').then(r => r.json()),
          fetch('/api/reports/pregnant').then(r => r.json()),
          fetch('/api/reports/chronic').then(r => r.json()),
        ]);

        const heads = headsRes.data ?? [];
        const noAidIds = new Set((noAidRes.data ?? []).map((r: any) => r.id));
        const u2HeadIds = new Set((u2Res.data ?? []).map((r: any) => r.headOfHouseholdId ?? r.id));
        const u5HeadIds = new Set((u5Res.data ?? []).map((r: any) => r.headOfHouseholdId ?? r.id));
        const pregHeadIds = new Set((pregRes.data ?? []).map((r: any) => r.headOfHouseholdId ?? r.id));
        const chronHeadIds = new Set((chronRes.data ?? []).map((r: any) => r.headOfHouseholdId ?? r.id));

        const enriched = heads.map((h: any) => ({
          ...h,
          flagNoAid30: noAidIds.has(h.id),
          flagChildrenU2: u2HeadIds.has(h.id),
          flagChildrenU5: u5HeadIds.has(h.id),
          flagPregnant: pregHeadIds.has(h.id),
          flagChronic: chronHeadIds.has(h.id) || h.hasChronicDisease,
        }));

        setAllHeads(enriched);
        setDisplayed(enriched);
      } finally {
        setLoadingHeads(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    let result = [...allHeads];
    if (activeFilter === 'childrenU2') result = result.filter(h => h.flagChildrenU2);
    else if (activeFilter === 'childrenU5') result = result.filter(h => h.flagChildrenU5);
    else if (activeFilter === 'pregnant') result = result.filter(h => h.flagPregnant);
    else if (activeFilter === 'chronic') result = result.filter(h => h.flagChronic);
    else if (activeFilter === 'noAid30') result = result.filter(h => h.flagNoAid30);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(h =>
        `${h.firstName} ${h.fatherName} ${h.familyName} ${h.nationalId} ${h.tentNumber ?? ''}`
          .toLowerCase().includes(q)
      );
    }
    setDisplayed(result);
  }, [activeFilter, search, allHeads]);

  function toggleOne(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const ids = displayed.map(h => h.id);
    const allSel = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      allSel ? ids.forEach(id => next.delete(id)) : ids.forEach(id => next.add(id));
      return next;
    });
  }

  const allDisplayedSelected =
    displayed.length > 0 && displayed.every(h => selected.has(h.id));

  // Check for duplicates before showing confirm
  async function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (selected.size === 0) { setError('يرجى تحديد أسرة واحدة على الأقل'); return; }
    if (!aidType || !aidDate || !source) { setError('يرجى تعبئة نوع المساعدة والتاريخ والمصدر'); return; }

    // Check duplicates: query recent aid for selected heads
    const thirtyDaysAgo = new Date(aidDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    const warnings: { id: number; name: string; lastDate: string }[] = [];

    for (const headId of Array.from(selected)) {
      const res = await fetch(`/api/aid?headId=${headId}&aidType=${aidType}&fromDate=${fromDate}&toDate=${aidDate}`);
      const json = await res.json();
      if ((json.data ?? []).length > 0) {
        const head = allHeads.find(h => h.id === headId);
        const lastRecord = json.data[0];
        warnings.push({
          id: headId,
          name: head ? `${head.firstName} ${head.fatherName} ${head.familyName}` : `#${headId}`,
          lastDate: new Date(lastRecord.aidDate).toLocaleDateString('ar-EG'),
        });
      }
    }

    if (warnings.length > 0) {
      setDuplicateWarnings(warnings);
      setShowWarningModal(true);
    } else {
      await doSave();
    }
  }

  async function doSave() {
    setShowWarningModal(false);
    setSaving(true);
    setSavedCount(0);

    const payload = {
      aidType,
      aidDate,
      source,
      amount: amount ? parseFloat(amount) : null,
      notes: notes || null,
    };

    let count = 0;
    const errors: string[] = [];

    for (const headId of Array.from(selected)) {
      const res = await fetch('/api/aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, headOfHouseholdId: headId }),
      });
      const json = await res.json();
      if (res.ok) {
        count++;
        setSavedCount(count);
      } else {
        const head = allHeads.find(h => h.id === headId);
        const name = head ? `${head.firstName} ${head.familyName}` : `#${headId}`;
        errors.push(`${name}: ${json.error}`);
      }
    }

    setSaving(false);

    if (errors.length > 0) {
      setError(`تم الحفظ لـ ${count} أسرة. فشل لـ ${errors.length}:\n${errors.join('\n')}`);
    } else {
      setSuccess(`✅ تم تسجيل المساعدة بنجاح لـ ${count} أسرة`);
      setSelected(new Set());
      setTimeout(() => router.push('/aid'), 1800);
    }
  }

  return (
    <div>
      <PageHeader title="تسجيل مساعدة جماعية" subtitle="اختر الأسر المستفيدة وسجّل المساعدة دفعة واحدة" />

      {/* Duplicate Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-bold text-slate-800">تنبيه: مساعدات مكررة</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              الأسر التالية استلمت مساعدة من نفس النوع خلال آخر 30 يوماً:
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-5 max-h-48 overflow-y-auto">
              {duplicateWarnings.map(w => (
                <div key={w.id} className="flex items-center justify-between py-1.5 border-b border-orange-100 last:border-0 text-sm">
                  <span className="font-medium text-orange-800">{w.name}</span>
                  <span className="text-orange-600 text-xs">آخر مساعدة: {w.lastDate}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-sm mb-6">
              هل تريد المتابعة وتسجيل المساعدة لجميع الأسر المحددة ({selected.size} أسرة) رغم ذلك؟
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-5 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                مراجعة التحديد
              </button>
              <button
                onClick={doSave}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                متابعة الحفظ رغم التكرار
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
      {success && <AlertMessage type="success" message={success} />}

      <form onSubmit={handleSubmitClick} className="space-y-6">
        {/* Aid Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">تفاصيل المساعدة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                نوع المساعدة <span className="text-red-500">*</span>
              </label>
              <select value={aidType} onChange={e => setAidType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر النوع</option>
                {Object.entries(AID_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ (اختياري)</label>
              <input type="number" step="0.01" min="0" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                التاريخ <span className="text-red-500">*</span>
              </label>
              <input type="date" value={aidDate} onChange={e => setAidDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                المصدر <span className="text-red-500">*</span>
              </label>
              <input value={source} onChange={e => setSource(e.target.value)}
                placeholder="UNRWA، WFP..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTERS.map(f => (
              <button key={f.key} type="button" onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  activeFilter === f.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                }`}>
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم، رقم هوية، أو رقم الخيمة..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Households List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={allDisplayedSelected} onChange={toggleAll} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-slate-700">تحديد الكل ({displayed.length})</span>
            </div>
            {selected.size > 0 && (
              <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                {selected.size} أسرة محددة
              </span>
            )}
          </div>

          {loadingHeads ? (
            <LoadingSpinner />
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-sm">لا توجد أسر مطابقة</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {displayed.map(head => (
                <div key={head.id} onClick={() => toggleOne(head.id)}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${
                    selected.has(head.id)
                      ? 'bg-blue-50 border-r-4 border-blue-500'
                      : 'hover:bg-slate-50'
                  }`}>
                  <input type="checkbox" checked={selected.has(head.id)}
                    onChange={() => toggleOne(head.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800">
                        {head.firstName} {head.fatherName} {head.familyName}
                      </span>
                      <span className="text-slate-400 font-mono text-xs">{head.nationalId}</span>
                      {head.tentNumber && <Badge label={`خيمة ${head.tentNumber}`} color="blue" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {head.flagNoAid30 && <Badge label="بدون مساعدة 30 يوم" color="orange" />}
                      {head.flagChildrenU2 && <Badge label="أطفال دون سنتين" color="blue" />}
                      {head.flagChildrenU5 && !head.flagChildrenU2 && <Badge label="أطفال دون 5 سنوات" color="blue" />}
                      {head.flagPregnant && <Badge label="حامل" color="orange" />}
                      {head.flagChronic && <Badge label="مرض مزمن" color="red" />}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 shrink-0 font-mono">{head.phoneNumber1}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm">
            {selected.size > 0 ? (
              <span className="font-medium text-blue-700">
                سيتم تسجيل المساعدة لـ <strong>{selected.size}</strong> أسرة
              </span>
            ) : (
              <span className="text-slate-400">لم يتم تحديد أي أسرة بعد</span>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => window.history.back()}
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              إلغاء
            </button>
            <button type="submit" disabled={saving || selected.size === 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors min-w-36">
              {saving
                ? `جاري الحفظ... (${savedCount}/${selected.size})`
                : `تسجيل للـ ${selected.size || '—'} أسرة`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}