'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '../../../../../components/ui/PageHeader';
import ResidentForm from '../../../../../components/ui/ResidentForm';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import AlertMessage from '../../../../../components/ui/AlertMessage';

export default function EditResidentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/residents/${id}`)
      .then(r => r.json())
      .then(d => { setResident(d); setLoading(false); });
  }, [id]);

  async function handleSubmit(data: any) {
    const res = await fetch(`/api/residents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || 'حدث خطأ غير متوقع' };
    setSuccess('تم تحديث البيانات بنجاح');
    setTimeout(() => router.push(`/residents/${id}`), 1200);
    return {};
  }

  if (loading) return <LoadingSpinner />;
  if (!resident) return <AlertMessage type="error" message="لم يتم العثور على المقيم" />;

  return (
    <div>
      <PageHeader
        title={`تعديل: ${resident.firstName} ${resident.familyName}`}
        subtitle={`رقم الهوية: ${resident.nationalId}`}
      />
      {success && <AlertMessage type="success" message={success} />}
      <ResidentForm initialData={resident} onSubmit={handleSubmit} submitLabel="حفظ التعديلات" />
    </div>
  );
}