'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PageHeader from '../../../../components/ui/PageHeader';
import AlertMessage from '../../../../components/ui/AlertMessage';
import { GENDER_LABELS, MARITAL_STATUS_LABELS, RELATION_LABELS } from '../../../../lib/constants';

const emptyMember = () => ({
  nationalId: '',
  firstName: '',
  fatherName: '',
  grandfatherName: '',
  familyName: '',
  gender: '',
  dateOfBirth: '',
  maritalStatus: '',
  phoneNumber1: '',
  phoneNumber2: '',
  relationToHead: '',
  hasChronicDisease: false,
  chronicDiseaseDescription: '',
  hasDisability: false,
  disabilityType: '',
  isPregnant: false,
  isBreastfeeding: false,
});

const emptyHead = () => ({
  nationalId: '',
  firstName: '',
  fatherName: '',
  grandfatherName: '',
  familyName: '',
  gender: '',
  dateOfBirth: '',
  maritalStatus: '',
  phoneNumber1: '',
  phoneNumber2: '',
  tentNumber: '',
  hasChronicDisease: false,
  chronicDiseaseDescription: '',
  hasDisability: false,
  disabilityType: '',
  isPregnant: false,
  isBreastfeeding: false,
});

// Relations where fatherName/grandfatherName/familyName are auto-filled from head
const CHILD_RELATIONS = ['son', 'daughter'];

// Relations where phone numbers are shown (not auto-inherited silently)
// For all relations we hide phone and inherit from head silently
type ResidentType = 'head' | 'member';

export default function NewResidentPage() {
  const router = useRouter();

  const [residentType, setResidentType] = useState<ResidentType>('head');
  const [selectedHeadId, setSelectedHeadId] = useState('');
  const [headSearch, setHeadSearch] = useState('');
  const [heads, setHeads] = useState<any[]>([]);
  const [headsLoaded, setHeadsLoaded] = useState(false);

  const [headForm, setHeadForm] = useState(emptyHead());
  const [members, setMembers] = useState([emptyMember()]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadHeads() {
    if (headsLoaded) return;
    const res = await fetch('/api/residents?headOnly=true&pageSize=500&isActive=true');
    const json = await res.json();
    setHeads(json.data ?? []);
    setHeadsLoaded(true);
  }

  const filteredHeads = headSearch.trim()
    ? heads.filter((h: any) =>
        `${h.firstName} ${h.fatherName} ${h.familyName} ${h.nationalId}`
          .toLowerCase().includes(headSearch.toLowerCase())
      )
    : heads;

  const selectedHead = heads.find((h: any) => String(h.id) === selectedHeadId);

  function handleHeadSelect(id: string) {
    setSelectedHeadId(id);
    const head = heads.find((h: any) => String(h.id) === id);
    if (head) {
      // Re-apply auto-fill for existing members based on their current relation
      setMembers(prev => prev.map(m => applyAutoFill(m, m.relationToHead, head)));
    }
  }

  // Auto-fill logic based on relation and selected head
  function applyAutoFill(member: any, relation: string, head: any) {
    const updated = { ...member, relationToHead: relation };
    if (CHILD_RELATIONS.includes(relation) && head) {
      updated.fatherName = head.firstName;
      updated.grandfatherName = head.fatherName;
      updated.familyName = head.familyName;
    }
    if (relation === 'son') {
      updated.gender = 'male';
      updated.maritalStatus = 'single';
    }
    if (relation === 'daughter') {
      updated.gender = 'female';
      updated.maritalStatus = 'single';
    }
    return updated;
  }

  function setHead(field: string, value: any) {
    setHeadForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, head: { ...prev.head, [field]: '' } }));
  }

  function setMember(index: number, field: string, value: any) {
    setMembers(prev => {
      const next = [...prev];
      if (field === 'relationToHead') {
        next[index] = applyAutoFill(next[index], value, selectedHead);
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
    setFieldErrors(prev => ({
      ...prev,
      [`member_${index}`]: { ...prev[`member_${index}`], [field]: '' },
    }));
  }

  function addMember() {
    setMembers(prev => [...prev, emptyMember()]);
  }

  function removeMember(index: number) {
    setMembers(prev => prev.filter((_, i) => i !== index));
  }

  function validatePhone(value: string, required = true): string {
    if (!value && required) return 'رقم الهاتف مطلوب';
    if (value && value.length !== 10) return 'يجب أن يكون 10 خانات';
    return '';
  }

  function validateNationalId(value: string): string {
    if (!value) return 'رقم الهوية مطلوب';
    if (value.length !== 9) return 'يجب أن يكون 9 خانات';
    return '';
  }

  function validateForm(): boolean {
    const errors: Record<string, Record<string, string>> = {};
    let valid = true;

    if (residentType === 'head') {
      const headErrs: Record<string, string> = {};
      const idErr = validateNationalId(headForm.nationalId);
      if (idErr) { headErrs.nationalId = idErr; valid = false; }
      const p1Err = validatePhone(headForm.phoneNumber1);
      if (p1Err) { headErrs.phoneNumber1 = p1Err; valid = false; }
      if (headForm.phoneNumber2) {
        const p2Err = validatePhone(headForm.phoneNumber2, false);
        if (p2Err) { headErrs.phoneNumber2 = p2Err; valid = false; }
      }
      if (Object.keys(headErrs).length) errors.head = headErrs;
    } else {
      members.forEach((m, i) => {
        const mErrs: Record<string, string> = {};
        const idErr = validateNationalId(m.nationalId);
        if (idErr) { mErrs.nationalId = idErr; valid = false; }
        if (!m.relationToHead) { mErrs.relationToHead = 'الصلة مطلوبة'; valid = false; }
        if (Object.keys(mErrs).length) errors[`member_${i}`] = mErrs;
      });
    }

    setFieldErrors(errors);
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (residentType === 'member' && !selectedHeadId) {
      setError('يرجى اختيار رب الأسرة أولاً');
      return;
    }

    if (!validateForm()) {
      setError('يوجد أخطاء في البيانات، يرجى المراجعة');
      return;
    }

    setSaving(true);

    try {
      if (residentType === 'head') {
        const payload = {
          ...headForm,
          relationToHead: 'head',
          headOfHouseholdId: null,
          phoneNumber2: headForm.phoneNumber2 || null,
          tentNumber: headForm.tentNumber || null,
          chronicDiseaseDescription: headForm.chronicDiseaseDescription || null,
          disabilityType: headForm.disabilityType || null,
        };
        const res = await fetch('/api/residents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'حدث خطأ'); setSaving(false); return; }
        setSuccess('تم إضافة رب الأسرة بنجاح');
        setTimeout(() => router.push(`/residents/${json.id}`), 1200);

      } else {
        const results: { name: string; success: boolean; error?: string }[] = [];

        for (const m of members) {
          const payload = {
            ...m,
            headOfHouseholdId: parseInt(selectedHeadId),
            tentNumber: null,
            // Always inherit phone from head silently
            phoneNumber1: selectedHead?.phoneNumber1 || m.phoneNumber1 || '',
            phoneNumber2: selectedHead?.phoneNumber2 || null,
            chronicDiseaseDescription: m.chronicDiseaseDescription || null,
            disabilityType: m.disabilityType || null,
          };
          const res = await fetch('/api/residents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          results.push({
            name: `${m.firstName} ${m.familyName}`,
            success: res.ok,
            error: res.ok ? undefined : json.error,
          });
        }

        const failed = results.filter(r => !r.success);
        const succeeded = results.filter(r => r.success);

        if (failed.length === 0) {
          setSuccess(`✅ تم إضافة ${succeeded.length} فرد بنجاح`);
          setTimeout(() => router.push(`/residents/${selectedHeadId}`), 1400);
        } else {
          const errMsg = failed.map(f => `${f.name}: ${f.error}`).join('\n');
          setError(`تم حفظ ${succeeded.length} وفشل ${failed.length}:\n${errMsg}`);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const fe = (key: string, field: string) => fieldErrors[key]?.[field] || '';

  return (
    <div>
      <PageHeader title="إضافة مقيم جديد" subtitle="تسجيل مقيم أو أفراد أسرة" />

      {success && <AlertMessage type="success" message={success} />}
      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Type selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">نوع التسجيل</h2>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <button type="button"
              onClick={() => setResidentType('head')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                residentType === 'head'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}>
              <span className="text-3xl">👤</span>
              <span className="font-medium text-sm">رب أسرة</span>
            </button>
            <button type="button"
              onClick={() => { setResidentType('member'); loadHeads(); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                residentType === 'member'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}>
              <span className="text-3xl">👨‍👩‍👧</span>
              <span className="font-medium text-sm">فرد في أسرة</span>
            </button>
          </div>
        </div>

        {/* HEAD form */}
        {residentType === 'head' && (
          <HeadForm
            data={headForm}
            onChange={setHead}
            errors={fieldErrors.head ?? {}}
          />
        )}

        {/* MEMBER mode */}
        {residentType === 'member' && (
          <>
            {/* Head selector */}
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">
                اختيار رب الأسرة <span className="text-red-500">*</span>
              </h2>
              <input
                type="text"
                value={headSearch}
                onChange={e => setHeadSearch(e.target.value)}
                placeholder="بحث باسم رب الأسرة أو رقم هويته..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={selectedHeadId}
                onChange={e => handleHeadSelect(e.target.value)}
                size={4}
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
            </div>

            {/* Members */}
            {selectedHeadId && (
              <>
                {members.map((m, i) => (
                  <MemberForm
                    key={i}
                    index={i}
                    data={m}
                    onChange={(f, v) => setMember(i, f, v)}
                    errors={fieldErrors[`member_${i}`] ?? {}}
                    onRemove={members.length > 1 ? () => removeMember(i) : undefined}
                    selectedHead={selectedHead}
                  />
                ))}

                <button
                  type="button"
                  onClick={addMember}
                  className="w-full py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <span className="text-xl">＋</span>
                  إضافة فرد آخر
                </button>
              </>
            )}

            {!selectedHeadId && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="text-5xl mb-3">👆</span>
                <p className="text-base font-medium">اختر رب الأسرة أولاً لإكمال البيانات</p>
              </div>
            )}
          </>
        )}

        {/* Submit */}
        {(residentType === 'head' || selectedHeadId) && (
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => window.history.back()}
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              إلغاء
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors min-w-32">
              {saving
                ? 'جاري الحفظ...'
                : residentType === 'head'
                  ? 'إضافة رب الأسرة'
                  : `حفظ ${members.length} ${members.length === 1 ? 'فرد' : 'أفراد'}`}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// ─── Head Form ───────────────────────────────────────────────────────────────

function HeadForm({ data, onChange, errors }: {
  data: any;
  onChange: (f: string, v: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b">بيانات رب الأسرة</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <Field label="الاسم الأول" required>
          <input required value={data.firstName} onChange={e => onChange('firstName', e.target.value)} className="input" />
        </Field>
        <Field label="اسم الأب" required>
          <input required value={data.fatherName} onChange={e => onChange('fatherName', e.target.value)} className="input" />
        </Field>
        <Field label="اسم الجد" required>
          <input required value={data.grandfatherName} onChange={e => onChange('grandfatherName', e.target.value)} className="input" />
        </Field>
        <Field label="اسم العائلة" required>
          <input required value={data.familyName} onChange={e => onChange('familyName', e.target.value)} className="input" />
        </Field>

        <Field label="رقم الهوية" required hint="9 خانات" error={errors.nationalId}>
          <input required value={data.nationalId}
            onChange={e => onChange('nationalId', e.target.value.replace(/\D/g, '').slice(0, 9))}
            maxLength={9} inputMode="numeric"
            className={`input font-mono ${errors.nationalId ? 'border-red-400 bg-red-50' : ''}`} />
          <span className="text-xs text-slate-400">{data.nationalId.length}/9</span>
        </Field>

        <Field label="تاريخ الميلاد" required>
          <input required type="date" value={data.dateOfBirth} onChange={e => onChange('dateOfBirth', e.target.value)} className="input" />
        </Field>

        <Field label="الجنس" required>
          <select required value={data.gender} onChange={e => onChange('gender', e.target.value)} className="input">
            <option value="">اختر</option>
            {Object.entries(GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>

        <Field label="الحالة الاجتماعية" required>
          <select required value={data.maritalStatus} onChange={e => onChange('maritalStatus', e.target.value)} className="input">
            <option value="">اختر</option>
            {Object.entries(MARITAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>

        <Field label="هاتف 1" required hint="10 خانات" error={errors.phoneNumber1}>
          <input required value={data.phoneNumber1}
            onChange={e => onChange('phoneNumber1', e.target.value.replace(/\D/g, '').slice(0, 10))}
            maxLength={10} inputMode="numeric"
            className={`input font-mono ${errors.phoneNumber1 ? 'border-red-400 bg-red-50' : ''}`} />
          <span className="text-xs text-slate-400">{data.phoneNumber1.length}/10</span>
        </Field>

        <Field label="هاتف 2" hint="10 خانات" error={errors.phoneNumber2}>
          <input value={data.phoneNumber2 ?? ''}
            onChange={e => onChange('phoneNumber2', e.target.value.replace(/\D/g, '').slice(0, 10))}
            maxLength={10} inputMode="numeric"
            className={`input font-mono ${errors.phoneNumber2 ? 'border-red-400 bg-red-50' : ''}`} />
          {data.phoneNumber2 && <span className="text-xs text-slate-400">{data.phoneNumber2.length}/10</span>}
        </Field>

        <Field label="رقم الخيمة">
          <input value={data.tentNumber ?? ''} onChange={e => onChange('tentNumber', e.target.value)}
            placeholder="مثال: A-101" className="input" />
        </Field>
      </div>

      <HealthSection data={data} onChange={onChange} />
    </div>
  );
}

// ─── Member Form ─────────────────────────────────────────────────────────────

function MemberForm({ index, data, onChange, errors, onRemove, selectedHead }: {
  index: number;
  data: any;
  onChange: (f: string, v: any) => void;
  errors: Record<string, string>;
  onRemove?: () => void;
  selectedHead?: any;
}) {
  const isChild = CHILD_RELATIONS.includes(data.relationToHead);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h2 className="text-base font-semibold text-slate-700">الفرد {index + 1}</h2>
        {onRemove && (
          <button type="button" onClick={onRemove}
            className="text-red-400 hover:text-red-600 text-sm px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">
            ✕ حذف
          </button>
        )}
      </div>

      {/* Relation first */}
      <div className="mb-4">
        <Field label="الصلة برب الأسرة" required error={errors.relationToHead}>
          <select
            required
            value={data.relationToHead}
            onChange={e => onChange('relationToHead', e.target.value)}
            className={`input ${errors.relationToHead ? 'border-red-400 bg-red-50' : ''}`}
          >
            <option value="">اختر الصلة أولاً</option>
            {Object.entries(RELATION_LABELS)
              .filter(([k]) => k !== 'head')
              .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </div>

      {/* Show fields only after relation is selected */}
      {data.relationToHead && (
        <>
          {isChild && selectedHead && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex flex-wrap gap-3">
              <span>✅ تم تعبئة اسم الأب والجد والعائلة تلقائياً من بيانات رب الأسرة</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <Field label="الاسم الأول" required>
              <input required value={data.firstName}
                onChange={e => onChange('firstName', e.target.value)} className="input" />
            </Field>

            <Field label="اسم الأب" required>
              <input
                required
                value={data.fatherName}
                onChange={e => onChange('fatherName', e.target.value)}
                className="input"
              />
            </Field>

            <Field label="اسم الجد" required>
              <input
                required
                value={data.grandfatherName}
                onChange={e => onChange('grandfatherName', e.target.value)}
                className="input"
              />
            </Field>

            <Field label="اسم العائلة" required>
              <input
                required
                value={data.familyName}
                onChange={e => onChange('familyName', e.target.value)}
                className="input"
              />
            </Field>

            <Field label="رقم الهوية" required hint="9 خانات" error={errors.nationalId}>
              <input
                required
                value={data.nationalId}
                onChange={e => onChange('nationalId', e.target.value.replace(/\D/g, '').slice(0, 9))}
                maxLength={9}
                inputMode="numeric"
                className={`input font-mono ${errors.nationalId ? 'border-red-400 bg-red-50' : ''}`}
              />
              <span className="text-xs text-slate-400">{data.nationalId.length}/9</span>
            </Field>

            <Field label="تاريخ الميلاد" required>
              <input required type="date" value={data.dateOfBirth}
                onChange={e => onChange('dateOfBirth', e.target.value)} className="input" />
            </Field>

            <Field label="الجنس" required>
              <select required value={data.gender}
                onChange={e => onChange('gender', e.target.value)} className="input">
                <option value="">اختر</option>
                {Object.entries(GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>

            <Field label="الحالة الاجتماعية" required>
              <select required value={data.maritalStatus}
                onChange={e => onChange('maritalStatus', e.target.value)} className="input">
                <option value="">اختر</option>
                {Object.entries(MARITAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>

          </div>

          {/* Phone info note */}
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 flex items-center gap-2">
            <span>📞</span>
            <span>سيتم حفظ رقم هاتف رب الأسرة تلقائياً: <strong className="text-slate-700">{selectedHead?.phoneNumber1}</strong></span>
          </div>

          <HealthSection data={data} onChange={onChange} />
        </>
      )}
    </div>
  );
}

// ─── Health Section ───────────────────────────────────────────────────────────

function HealthSection({ data, onChange }: { data: any; onChange: (f: string, v: any) => void }) {
  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-sm font-medium text-slate-600 mb-3">الحالة الصحية</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={data.hasChronicDisease}
            onChange={e => onChange('hasChronicDisease', e.target.checked)} className="w-4 h-4 rounded" />
          يعاني من مرض مزمن
        </label>

        {data.hasChronicDisease && (
          <Field label="وصف المرض">
            <input value={data.chronicDiseaseDescription ?? ''}
              onChange={e => onChange('chronicDiseaseDescription', e.target.value)} className="input" />
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={data.hasDisability}
            onChange={e => onChange('hasDisability', e.target.checked)} className="w-4 h-4 rounded" />
          لديه إعاقة
        </label>

        {data.hasDisability && (
          <Field label="نوع الإعاقة">
            <input value={data.disabilityType ?? ''}
              onChange={e => onChange('disabilityType', e.target.value)} className="input" />
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={data.isMartyr ?? false}
            onChange={e => onChange('isMartyr', e.target.checked)} className="w-4 h-4 rounded accent-red-600" />
          <span className="text-red-700 font-medium">شهيد</span>
        </label>

        {data.gender === 'female' && (
          <>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={data.isPregnant}
                onChange={e => onChange('isPregnant', e.target.checked)} className="w-4 h-4 rounded" />
              حامل
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={data.isBreastfeeding}
                onChange={e => onChange('isBreastfeeding', e.target.checked)} className="w-4 h-4 rounded" />
              مرضع
            </label>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, hint, error, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
        {hint && <span className="text-slate-400 text-xs mr-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Constant used in component (defined above)