import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
      <span className="text-7xl mb-6">🔍</span>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">الصفحة غير موجودة</h1>
      <p className="text-slate-500 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
      <Link href="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
        العودة للرئيسية
      </Link>
    </div>
  );
}