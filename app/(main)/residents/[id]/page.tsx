'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '../../../../components/ui/PageHeader';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import Badge from '../../../../components/ui/Badge';
import ResidentBadges from '../../../../components/ui/ResidentBadges';
import AlertMessage from '../../../../components/ui/AlertMessage';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import {
  GENDER_LABELS, MARITAL_STATUS_LABELS,
  RELATION_LABELS, AID_TYPE_LABELS, AID_TYPE_COLORS
} from '../../../../lib/constants';

export default function ResidentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/residents/${id}/summary`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [id]);

  async function handleDeactivate() {
    setConfirmOpen(false);
    setDeleting(true);
    await fetch(`/api/residents/${id}`, { method: 'DELETE' });
    router.push('/residents');
  }

  if (loading) return <LoadingSpinner />;
  if (!data || data.error) return <AlertMessage type="error" message="لم يتم العثور على المقيم" />;

  const fullName = `${data.firstName} ${data.fatherName} ${data.grandfatherName} ${data.familyName}`;

  return (
    <div>
      <ConfirmDialog
        open={confirmOpen}
        title="تعطيل المقيم"
        message={`هل تريد تعطيل المقيم "${data.firstName} ${data.familyName}"؟ يمكن التراجع لاحقاً عن طريق التعديل.`}
        confirmLabel="تعطيل"
        danger
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmOpen(false)}
      />

      <PageHeader
        title={fullName}
        subtitle={`رقم الهوية: ${data.nationalId}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/residents/${id}/edit`}
              className="border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              ✏️ تعديل
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
              className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {deleting ? 'جاري...' : '🗑️ تعطيل'}
            </button>
          </div>
        }
      />

      {error && <AlertMessage type="error" message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-700 mb-4 pb-2 border-b">البيانات الشخصية</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">الجنس:</span> <span className="font-medium mr-1">{GENDER_LABELS[data.gender]}</span></div>
              <div><span className="text-slate-500">العمر:</span> <span className="font-medium mr-1">{data.age} سنة</span></div>
              <div><span className="text-slate-500">تاريخ الميلاد:</span> <span className="font-medium mr-1">{new Date(data.dateOfBirth).toLocaleDateString('ar-EG')}</span></div>
              <div><span className="text-slate-500">الحالة الاجتماعية:</span> <span className="font-medium mr-1">{MARITAL_STATUS_LABELS[data.maritalStatus]}</span></div>
              <div><span className="text-slate-500">هاتف 1:</span> <span className="font-medium font-mono mr-1">{data.phoneNumber1}</span></div>
              <div><span className="text-slate-500">هاتف 2:</span> <span className="font-medium font-mono mr-1">{data.phoneNumber2 ?? '—'}</span></div>
              <div><span className="text-slate-500">الخيمة:</span> <span className="font-medium mr-1">{data.tentNumber ?? data.headOfHousehold?.tentNumber ?? '—'}</span></div>
              <div><span className="text-slate-500">الصلة:</span> <span className="font-medium mr-1">{RELATION_LABELS[data.relationToHead]}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-700 mb-4 pb-2 border-b">الحالة الصحية</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              <ResidentBadges resident={data} />
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {data.hasChronicDisease && (
                <div><span className="text-slate-500">المرض المزمن:</span> <span className="font-medium mr-1">{data.chronicDiseaseDescription || 'غير محدد'}</span></div>
              )}
              {data.hasDisability && (
                <div><span className="text-slate-500">نوع الإعاقة:</span> <span className="font-medium mr-1">{data.disabilityType || 'غير محدد'}</span></div>
              )}
              {!data.hasChronicDisease && !data.hasDisability && !data.isPregnant && !data.isBreastfeeding && (
                <p className="text-slate-400">لا توجد حالات صحية خاصة</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="font-semibold text-slate-700">سجل المساعدات</h2>
              <Link href={`/aid/new?headId=${data.headOfHouseholdId ?? data.id}`}
                className="text-sm text-blue-600 hover:underline font-medium">
                + إضافة مساعدة
              </Link>
            </div>
            {!data.aidRecords?.length ? (
              <p className="text-slate-400 text-sm">لا توجد مساعدات مسجلة</p>
            ) : (
              <div className="space-y-2">
                {data.aidRecords.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge label={AID_TYPE_LABELS[a.aidType]} color={AID_TYPE_COLORS[a.aidType]} />
                      <span className="text-sm text-slate-600">{a.source}</span>
                      {a.notes && <span className="text-xs text-slate-400">{a.notes}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {a.amount && <span className="font-medium text-slate-700">₪ {a.amount}</span>}
                      <span className="text-slate-400">{new Date(a.aidDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {data.headOfHousehold && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-700 mb-3 pb-2 border-b">رب الأسرة</h2>
              <Link href={`/residents/${data.headOfHouseholdId}`}
                className="text-blue-600 hover:underline text-sm font-medium">
                {data.headOfHousehold.firstName} {data.headOfHousehold.fatherName} {data.headOfHousehold.familyName}
              </Link>
              <p className="text-slate-400 text-xs mt-1 font-mono">{data.headOfHousehold.nationalId}</p>
            </div>
          )}

          {data.familyMembers?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-700 mb-3 pb-2 border-b">
                أفراد الأسرة ({data.familyMembers.length})
              </h2>
              <div className="space-y-2">
                {data.familyMembers.map((m: any) => (
                  <Link key={m.id} href={`/residents/${m.id}`}
                    className="flex items-center justify-between py-1.5 hover:bg-slate-50 rounded px-1 transition-colors">
                    <span className="text-sm text-slate-700">{m.firstName} {m.familyName}</span>
                    <Badge label={RELATION_LABELS[m.relationToHead]} color="gray" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-700 mb-3 pb-2 border-b">الحالة</h2>
            <Badge label={data.isActive ? 'نشط' : 'غير نشط'} color={data.isActive ? 'green' : 'gray'} />
            <p className="text-xs text-slate-400 mt-2">
              تاريخ التسجيل: {new Date(data.createdAt).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}