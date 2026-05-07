interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

const iconBg = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  orange: 'bg-orange-100',
  red: 'bg-red-100',
  purple: 'bg-purple-100',
};

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-6 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${iconBg[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}