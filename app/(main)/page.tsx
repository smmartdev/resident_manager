'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import ReportModal from '../../components/ui/ReportModal';

type ModalKey =
  | 'elderly' | 'chronic' | 'pregnant' | 'breastfeeding'
  | 'childrenU2' | 'childrenU5' | 'noAid' | null;

const REPORT_ENDPOINTS: Record<string, string> = {
  elderly: '/api/reports/elderly',
  chronic: '/api/reports/chronic',
  pregnant: '/api/reports/pregnant',
  breastfeeding: '/api/reports/breastfeeding',
  childrenU2: '/api/reports/children-under-2',
  childrenU5: '/api/reports/children-under-5',
  noAid: '/api/reports/no-aid?days=30',
};

const REPORT_TITLES: Record<string, string> = {
  elderly: 'كبار السن (+60)',
  chronic: 'أمراض مزمنة',
  pregnant: 'الحوامل',
  breastfeeding: 'المرضعات',
  childrenU2: 'أطفال دون سنتين',
  childrenU5: 'أطفال دون 5 سنوات',
  noAid: 'أسر بدون مساعدة (30 يوم)',
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  onClick?: () => void;
  clickable?: boolean;
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

const iconBgMap = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  orange: 'bg-orange-100',
  red: 'bg-red-100',
  purple: 'bg-purple-100',
};

function StatCard({ label, value, icon, color, onClick, clickable }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-6 ${colorMap[color]} ${
        clickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {clickable && (
            <p className="text-xs opacity-60 mt-1">اضغط لعرض الكشف</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${iconBgMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [residents, heads, elderly, chronic, pregnant, breastfeeding, u2, u5, noAid] =
          await Promise.all([
            fetch('/api/residents?pageSize=1').then(r => r.json()),
            fetch('/api/residents?pageSize=1&headOnly=true').then(r => r.json()),
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
          totalFamilies: heads.total ?? 0,
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

  async function openModal(key: ModalKey) {
    if (!key) return;
    setActiveModal(key);
    setModalLoading(true);
    setModalData([]);
    try {
      const res = await fetch(REPORT_ENDPOINTS[key]);
      const json = await res.json();
      setModalData(json.data ?? []);
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setActiveModal(null);
    setModalData([]);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <ReportModal
        open={activeModal !== null}
        title={activeModal ? REPORT_TITLES[activeModal] : ''}
        data={modalData}
        loading={modalLoading}
        onClose={closeModal}
      />

      <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على أوضاع المخيم" />

      {/* Non-clickable summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatCard
          label="إجمالي المقيمين"
          value={stats.totalResidents}
          icon="👥"
          color="blue"
        />
        <StatCard
          label="إجمالي الأسر"
          value={stats.totalFamilies}
          icon="🏠"
          color="green"
        />
      </div>

      {/* Clickable report cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="كبار السن (+60)"
          value={stats.elderly}
          icon="🧓"
          color="purple"
          clickable
          onClick={() => openModal('elderly')}
        />
        <StatCard
          label="أمراض مزمنة"
          value={stats.chronic}
          icon="🏥"
          color="red"
          clickable
          onClick={() => openModal('chronic')}
        />
        <StatCard
          label="حوامل"
          value={stats.pregnant}
          icon="🤰"
          color="orange"
          clickable
          onClick={() => openModal('pregnant')}
        />
        <StatCard
          label="مرضعات"
          value={stats.breastfeeding}
          icon="👶"
          color="green"
          clickable
          onClick={() => openModal('breastfeeding')}
        />
        <StatCard
          label="أطفال دون سنتين"
          value={stats.childrenU2}
          icon="🍼"
          color="blue"
          clickable
          onClick={() => openModal('childrenU2')}
        />
        <StatCard
          label="أطفال دون 5 سنوات"
          value={stats.childrenU5}
          icon="🧒"
          color="blue"
          clickable
          onClick={() => openModal('childrenU5')}
        />
        <StatCard
          label="أسر بدون مساعدة (30 يوم)"
          value={stats.noAid}
          icon="⚠️"
          color="orange"
          clickable
          onClick={() => openModal('noAid')}
        />
      </div>

      {/* Quick actions */}
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