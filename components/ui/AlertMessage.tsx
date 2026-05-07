interface AlertMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

const styles = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-orange-50 border-orange-300 text-orange-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
};

const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export default function AlertMessage({ type, message, onClose }: AlertMessageProps) {
  return (
    <div className={`flex items-center gap-3 border rounded-lg px-4 py-3 mb-4 ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-lg leading-none opacity-60 hover:opacity-100">×</button>
      )}
    </div>
  );
}