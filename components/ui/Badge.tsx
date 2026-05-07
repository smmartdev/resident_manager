interface BadgeProps {
  label: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'gray' | 'purple';
}

const colorMap = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
};

export default function Badge({ label, color }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color]}`}>
      {label}
    </span>
  );
}