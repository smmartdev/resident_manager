'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
      <span className="text-7xl mb-6">⚠️</span>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">حدث خطأ غير متوقع</h1>
      <p className="text-slate-500 mb-8 max-w-md">{error.message || 'يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.'}</p>
      <button onClick={reset}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
        إعادة المحاولة
      </button>
    </div>
  );
}