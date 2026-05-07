'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '../../../../components/ui/PageHeader';
import ResidentForm from '../../../../components/ui/ResidentForm';
import AlertMessage from '../../../../components/ui/AlertMessage';
import { useState } from 'react';

export default function NewResidentPage() {
  const router = useRouter();
  const [success, setSuccess] = useState('');

  async function handleSubmit(data: any) {
    const res = await fetch('/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || 'حدث خطأ غير متوقع' };
    setSuccess('تم إضافة المقيم بنجاح');
    setTimeout(() => router.push(`/residents/${json.id}`), 1200);
    return {};
  }

  return (
    <div>
      <PageHeader title="إضافة مقيم جديد" subtitle="تسجيل مقيم أو فرد عائلة جديد" />
      {success && <AlertMessage type="success" message={success} />}
      <ResidentForm onSubmit={handleSubmit} submitLabel="إضافة المقيم" />
    </div>
  );
}