'use client';

import { useEffect, useState } from 'react';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [residents, elderly, chronic, pregnant, breastfeeding, u2, u5, noAid] =
          await Promise.all([
            fetch('/api/residents?pageSize=1').then(r => r.json()),
            fetch('/api/reports/elderly').then(r => r.json()),
            fetch('/api/reports/chronic').then(r => r.json()),
            fetch('/api/reports/pregnant').then(r => r.json()),
            fetch('/api/reports/breastfeeding').then(r => r.json()),
            fetch('/api/reports/children-under-2').then(r => r.json()),
            fetch('/api/reports/children-under-5').then(r => r.json()),
            fetch('/api/reports/no-aid?days=30').then(r => r.json()),
          ]);

        setStats({
          totalResidents: residents.total ?? 0,
          elderly: elderly.total ?? 0,
          chronic: chronic.total ?? 0,
          pregnant: pregnant.total ?? 0,
          breastfeeding: breastfeeding.total ?? 0,
          childrenU2: u2.total ?? 0,
          childrenU5: u5.total ?? 0,
          noAid: noAid.total ?? 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        subtitle="نظرة عامة على أوضاع المخيم"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="إجمالي المقيمين" value={stats.totalResidents} icon="👥" color="blue" />
        <StatCard label="كبار السن (+60)" value={stats.elderly} icon="🧓" color="purple" />
        <StatCard label="أمراض مزمنة" value={stats.chronic} icon="🏥" color="red" />
        <StatCard label="حوامل" value={stats.pregnant} icon="🤰" color="orange" />
        <StatCard label="مرضعات" value={stats.breastfeeding} icon="👶" color="green" />
        <StatCard label="أطفال دون سنتين" value={stats.childrenU2} icon="🍼" color="blue" />
        <StatCard label="أطفال دون 5 سنوات" value={stats.childrenU5} icon="🧒" color="green" />
        <StatCard label="أسر بدون مساعدة (30 يوم)" value={stats.noAid} icon="⚠️" color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/residents/new"
          className="flex items-center gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
          <span className="text-3xl">➕</span>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-blue-600">إضافة مقيم جديد</p>
            <p className="text-sm text-slate-500">تسجيل مقيم أو أسرة جديدة</p>
          </div>
        </Link>

        <Link href="/aid/new"
          className="flex items-center gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all group">
          <span className="text-3xl">🤝</span>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-green-600">تسجيل مساعدة</p>
            <p className="text-sm text-slate-500">توزيع مساعدة على أسرة</p>
          </div>
        </Link>

        <Link href="/reports"
          className="flex items-center gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group">
          <span className="text-3xl">📊</span>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-purple-600">عرض التقارير</p>
            <p className="text-sm text-slate-500">تقارير حالة المخيم</p>
          </div>
        </Link>
      </div>
    </div>
  );
}