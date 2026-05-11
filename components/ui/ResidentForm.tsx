'use client';

import { useState, useEffect } from 'react';
import AlertMessage from './AlertMessage';
import { GENDER_LABELS, MARITAL_STATUS_LABELS, RELATION_LABELS } from '../../lib/constants';

interface ResidentFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<{ error?: string }>;
  submitLabel: string;
}

export default function ResidentForm({ initialData, onSubmit, submitLabel }: ResidentFormProps) {
  const isEditMode = !!initialData;

  const [residentType, setResidentType] = useState<'head' | 'member'>(
    initialData ? (initialData.relationToHead === 'head' ? 'head' : 'member') : 'head'
  );

  const [form, setForm] = useState({
    nationalId: '',
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    familyName: '',
    gender: '',
    maritalStatus: '',
    phoneNumber1: '',
    phoneNumber2: '',
    relationToHead: 'head',
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
    headOfHouseholdId: initialData?.headOfHouseholdId
      ? String(initialData.headOfHouseholdId)
      : '',
  });

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [heads, setHeads] = useState<any[]>([]);
  const [headSearch, setHeadSearch] = useState('');
  const [filteredHeads, setFilteredHeads] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/residents?headOnly=true&pageSize=500&isActive=true')
      .then(r => r.json())
      .then(d => {
        setHeads(d.data ?? []);
        setFilteredHeads(d.data ?? []);
      });
  }, []);

  useEffect(() => {
    if (!headSearch.trim()) {
      setFilteredHeads(heads);
    } else {
      const q = headSearch.toLowerCase();
      setFilteredHeads(
        heads.filter((h: any) =>
          `${h.firstName} ${h.fatherName} ${h.familyName} ${h.nationalId}`
            .toLowerCase().includes(q)
        )
      );
    }
  }, [headSearch, heads]);

  function set(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  }

  // When head is selected, import phone and tent
  function handleHeadSelect(headId: string) {
    set('headOfHouseholdId', headId);
    if (headId) {
      const head = heads.find((h: any) => String(h.id) === headId);
      if (head) {
        set('phoneNumber1', head.phoneNumber1 ?? '');
        set('phoneNumber2', head.phoneNumber2 ?? '');
        set('tentNumber', head.tentNumber ?? '');
      }
    }
  }

  function validateField(field: string, value: string): string {
    if (field === 'nationalId') {
      if (!value) return 'رقم الهوية مطلوب';
      if (value.length !== 9) return 'رقم الهوية يجب أن يكون 9 خانات بالضبط';
    }
    if (field === 'phoneNumber1') {
      if (!value) return 'رقم الهاتف مطلوب';
      if (value.length !== 10) return 'رقم الهاتف يجب أن يكون 10 خانات بالضبط';
    }
    if (field === 'phoneNumber2' && value) {
      if (value.length !== 10) return 'رقم الهاتف يجب أن يكون 10 خانات بالضبط';
    }
    return '';
  }

  function handleBlur(field: string, value: string) {
    const err = validateField(field, value);
    if (err) setFieldErrors(prev => ({ ...prev, [field]: err }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate
    const errors: Record<string, string> = {};
    const idErr = validateField('nationalId', form.nationalId);
    if (idErr) errors.nationalId = idErr;
    const phone1Err = validateField('phoneNumber1', form.phoneNumber1);
    if (phone1Err) errors.phoneNumber1 = phone1Err;
    if (form.phoneNumber2) {
      const phone2Err = validateField('phoneNumber2', form.phoneNumber2);
      if (phone2Err) errors.phoneNumber2 = phone2Err;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    const payload: any = { ...form };

    if (residentType === 'head') {
      payload.headOfHouseholdId = null;
      payload.relationToHead = 'head';
    } else {
      payload.headOfHouseholdId = parseInt(payload.headOfHouseholdId);
      // tentNumber inherited from head, don't store separately
      payload.tentNumber = null;
    }

    if (!payload.phoneNumber2) payload.phoneNumber2 = null;
    if (!payload.chronicDiseaseDescription) payload.chronicDiseaseDescription = null;
    if (!payload.disabilityType) payload.disabilityType = null;

    const result = await onSubmit(payload);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  const selectedHead = heads.find((h: any) => String(h.id) === String(form.headOfHouseholdId));
  const isHead = residentType === 'head';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      {/* Step 1: Resident Type */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">نوع التسجيل</h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <button
            type="button"
            onClick={() => { setResidentType('head'); set('relationToHead', 'head'); set('headOfHouseholdId', ''); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              isHead
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <span className="text-3xl">👤</span>
            <span className="font-medium text-sm">رب أسرة</span>
          </button>
          <button
            type="button"
            onClick={() => { setResidentType('member'); set('relationToHead', ''); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              !isHead
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <span className="text-3xl">👨‍👩‍👧</span>
            <span className="font-medium text-sm">فرد في أسرة</span>
          </button>
        </div>
      </div>

      {/* Step 2: If member — select head first */}
      {!isHead && (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">
            اختيار رب الأسرة <span className="text-red-500">*</span>
          </h2>

          <div className="mb-3">
            <input
              type="text"
              value={headSearch}
              onChange={e => setHeadSearch(e.target.value)}
              placeholder="بحث باسم رب الأسرة أو رقم هويته..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            required={!isHead}
            value={form.headOfHouseholdId}
            onChange={e => handleHeadSelect(e.target.value)}
            size={5}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          >
            <option value="">اختر رب الأسرة</option>
            {filteredHeads.map((h: any) => (
              <option key={h.id} value={h.id}>
                {h.firstName} {h.fatherName} {h.familyName} — {h.nationalId} — خيمة: {h.tentNumber ?? '—'}
              </option>
            ))}
          </select>

          {selectedHead && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 flex flex-wrap gap-4">
              <span>✅ <strong>{selectedHead.firstName} {selectedHead.fatherName} {selectedHead.familyName}</strong></span>
              {selectedHead.tentNumber && <span>🏕️ خيمة: {selectedHead.tentNumber}</span>}
              <span>📞 {selectedHead.phoneNumber1}</span>
            </div>
          )}

          {/* Relation to head */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              الصلة برب الأسرة <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.relationToHead}
              onChange={e => set('relationToHead', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر الصلة</option>
              {Object.entries(RELATION_LABELS)
                .filter(([k]) => k !== 'head')
                .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Step 3: Personal Info */}
      {(isHead || form.headOfHouseholdId) && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">البيانات الشخصية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  الاسم الأول <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.firstName}
                  onChange={e => set('firstName', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  اسم الأب <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.fatherName}
                  onChange={e => set('fatherName', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  اسم الجد <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.grandfatherName}
                  onChange={e => set('grandfatherName', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  اسم العائلة <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.familyName}
                  onChange={e => set('familyName', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  رقم الهوية <span className="text-red-500">*</span>
                  <span className="text-slate-400 text-xs mr-1">(9 خانات)</span>
                </label>
                <input
                  required
                  value={form.nationalId}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 9);
                    set('nationalId', v);
                  }}
                  onBlur={e => handleBlur('nationalId', e.target.value)}
                  maxLength={9}
                  inputMode="numeric"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                    fieldErrors.nationalId ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.nationalId && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.nationalId}</p>
                )}
                <p className="text-slate-400 text-xs mt-1">{form.nationalId.length}/9</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  تاريخ الميلاد <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => set('dateOfBirth', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  الجنس <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.gender}
                  onChange={e => set('gender', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر</option>
                  {Object.entries(GENDER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  الحالة الاجتماعية <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.maritalStatus}
                  onChange={e => set('maritalStatus', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر</option>
                  {Object.entries(MARITAL_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  هاتف 1 <span className="text-red-500">*</span>
                  <span className="text-slate-400 text-xs mr-1">(10 خانات)</span>
                </label>
                <input
                  required
                  value={form.phoneNumber1}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                    set('phoneNumber1', v);
                  }}
                  onBlur={e => handleBlur('phoneNumber1', e.target.value)}
                  maxLength={10}
                  inputMode="numeric"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                    fieldErrors.phoneNumber1 ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.phoneNumber1 && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber1}</p>
                )}
                <p className="text-slate-400 text-xs mt-1">{form.phoneNumber1.length}/10</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  هاتف 2
                  <span className="text-slate-400 text-xs mr-1">(10 خانات)</span>
                </label>
                <input
                  value={form.phoneNumber2 ?? ''}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                    set('phoneNumber2', v);
                  }}
                  onBlur={e => { if (e.target.value) handleBlur('phoneNumber2', e.target.value); }}
                  maxLength={10}
                  inputMode="numeric"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                    fieldErrors.phoneNumber2 ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.phoneNumber2 && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber2}</p>
                )}
                {form.phoneNumber2 && (
                  <p className="text-slate-400 text-xs mt-1">{form.phoneNumber2.length}/10</p>
                )}
              </div>

              {isHead && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الخيمة</label>
                  <input
                    value={form.tentNumber ?? ''}
                    onChange={e => set('tentNumber', e.target.value)}
                    placeholder="مثال: A-101"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Health */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">الحالة الصحية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chronicDisease"
                  checked={form.hasChronicDisease}
                  onChange={e => set('hasChronicDisease', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="chronicDisease" className="text-sm font-medium text-slate-700">
                  يعاني من مرض مزمن
                </label>
              </div>

              {form.hasChronicDisease && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">وصف المرض</label>
                  <input
                    value={form.chronicDiseaseDescription ?? ''}
                    onChange={e => set('chronicDiseaseDescription', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="disability"
                  checked={form.hasDisability}
                  onChange={e => set('hasDisability', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="disability" className="text-sm font-medium text-slate-700">
                  لديه إعاقة
                </label>
              </div>

              {form.hasDisability && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع الإعاقة</label>
                  <input
                    value={form.disabilityType ?? ''}
                    onChange={e => set('disabilityType', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {form.gender === 'female' && (
                <>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="pregnant"
                      checked={form.isPregnant}
                      onChange={e => set('isPregnant', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="pregnant" className="text-sm font-medium text-slate-700">حامل</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="breastfeeding"
                      checked={form.isBreastfeeding}
                      onChange={e => set('isBreastfeeding', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="breastfeeding" className="text-sm font-medium text-slate-700">مرضع</label>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'جاري الحفظ...' : submitLabel}
            </button>
          </div>
        </>
      )}

      {/* Prompt to select head first */}
      {!isHead && !form.headOfHouseholdId && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <span className="text-5xl mb-3">👆</span>
          <p className="text-base font-medium">اختر رب الأسرة أولاً لإكمال البيانات</p>
        </div>
      )}
    </form>
  );
}