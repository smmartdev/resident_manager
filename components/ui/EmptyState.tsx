interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export default function EmptyState({
  message = 'لا توجد بيانات',
  icon = '📭',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <span className="text-5xl">{icon}</span>
      <p className="text-base font-medium">{message}</p>
    </div>
  );
}