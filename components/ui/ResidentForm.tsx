'use client';

import { useState, useEffect } from 'react';
import AlertMessage from './AlertMessage';
import { GENDER_LABELS, MARITAL_STATUS_LABELS, RELATION_LABELS } from '../../lib/constants';

interface ResidentFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<{ error?: string }>;
  submitLabel: string;
  isHead?: boolean;
}

export default function ResidentForm({ initialData, onSubmit, submitLabel, isHead }: ResidentFormProps) {
  const [form, setForm] = useState({
    nationalId: '',
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    familyName: '',
    gender: '',
    // dateOfBirth: '',
    maritalStatus: '',
    phoneNumber1: '',
    phoneNumber2: '',
    relationToHead: 'head',
    headOfHouseholdId: '',
    tentNumber: '',
    hasChronicDisease: false,
    chronicDiseaseDescription: '',
    hasDisability: false,
    disabilityType: '',
    isPregnant: false,
    isBreastfeeding: false,
    ...initialData,
    dateOfBirth: initialData?.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split('T')[0]
      : '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [heads, setHeads] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/residents?headOnly=true&pageSize=200')
      .then(r => r.json())
      .then(d => setHeads(d.data ?? []));
  }, []);

  function set(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload: any = { ...form };
    if (payload.relationToHead === 'head') {
      payload.headOfHouseholdId = null;
      payload.tentNumber = payload.tentNumber || null;
    } else {
      payload.headOfHouseholdId = parseInt(payload.headOfHouseholdId);
      payload.tentNumber = null;
    }
    if (!payload.phoneNumber2) payload.phoneNumber2 = null;
    if (!payload.chronicDiseaseDescription) payload.chronicDiseaseDescription = null;
    if (!payload.disabilityType) payload.disabilityType = null;

    const result = await onSubmit(payload);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  const isFormHead = form.relationToHead === 'head';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">البيانات الشخصية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الأول <span className="text-red-500">*</span></label>
            <input required value={form.firstName} onChange={e => set('firstName', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم الأب <span className="text-red-500">*</span></label>
            <input required value={form.fatherName} onChange={e => set('fatherName', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم الجد <span className="text-red-500">*</span></label>
            <input required value={form.grandfatherName} onChange={e => set('grandfatherName', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم العائلة <span className="text-red-500">*</span></label>
            <input required value={form.familyName} onChange={e => set('familyName', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهوية <span className="text-red-500">*</span></label>
            <input required value={form.nationalId} onChange={e => set('nationalId', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الميلاد <span className="text-red-500">*</span></label>
            <input required type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الجنس <span className="text-red-500">*</span></label>
            <select required value={form.gender} onChange={e => set('gender', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">اختر</option>
              {Object.entries(GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الحالة الاجتماعية <span className="text-red-500">*</span></label>
            <select required value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">اختر</option>
              {Object.entries(MARITAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">هاتف 1 <span className="text-red-500">*</span></label>
            <input required value={form.phoneNumber1} onChange={e => set('phoneNumber1', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">هاتف 2</label>
            <input value={form.phoneNumber2 ?? ''} onChange={e => set('phoneNumber2', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Family */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">بيانات الأسرة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الصلة برب الأسرة <span className="text-red-500">*</span></label>
            <select required value={form.relationToHead} onChange={e => set('relationToHead', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(RELATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {!isFormHead && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رب الأسرة <span className="text-red-500">*</span></label>
              <select required value={form.headOfHouseholdId} onChange={e => set('headOfHouseholdId', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر رب الأسرة</option>
                {heads.map((h: any) => (
                  <option key={h.id} value={h.id}>
                    {h.firstName} {h.fatherName} {h.familyName} — {h.nationalId}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isFormHead && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم الخيمة</label>
              <input value={form.tentNumber ?? ''} onChange={e => set('tentNumber', e.target.value)}
                placeholder="مثال: A-101"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* Health */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">الحالة الصحية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="chronicDisease" checked={form.hasChronicDisease}
              onChange={e => set('hasChronicDisease', e.target.checked)} className="w-4 h-4 rounded" />
            <label htmlFor="chronicDisease" className="text-sm font-medium text-slate-700">يعاني من مرض مزمن</label>
          </div>
          {form.hasChronicDisease && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">وصف المرض</label>
              <input value={form.chronicDiseaseDescription ?? ''} onChange={e => set('chronicDiseaseDescription', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="disability" checked={form.hasDisability}
              onChange={e => set('hasDisability', e.target.checked)} className="w-4 h-4 rounded" />
            <label htmlFor="disability" className="text-sm font-medium text-slate-700">لديه إعاقة</label>
          </div>
          {form.hasDisability && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نوع الإعاقة</label>
              <input value={form.disabilityType ?? ''} onChange={e => set('disabilityType', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          {form.gender === 'female' && (
            <>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="pregnant" checked={form.isPregnant}
                  onChange={e => set('isPregnant', e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor="pregnant" className="text-sm font-medium text-slate-700">حامل</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="breastfeeding" checked={form.isBreastfeeding}
                  onChange={e => set('isBreastfeeding', e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor="breastfeeding" className="text-sm font-medium text-slate-700">مرضع</label>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => window.history.back()}
          className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
          إلغاء
        </button>
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
          {loading ? 'جاري الحفظ...' : submitLabel}
        </button>
      </div>
    </form>
  );
}