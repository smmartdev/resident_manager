'use client';

import { useState, useRef } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import AlertMessage from '../../../components/ui/AlertMessage';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleBackup() {
    setDownloading(true);
    setError('');
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'فشل في إنشاء النسخة الاحتياطية');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('تم تحميل النسخة الاحتياطية بنجاح');
    } catch (e) {
      setError('فشل في الاتصال بالخادم');
    } finally {
      setDownloading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileInfo(null);
    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.version || !json.tables) {
          setError('الملف المحدد ليس نسخة احتياطية صالحة');
          setSelectedFile(null);
          return;
        }
        setFileInfo(json);
      } catch {
        setError('تعذر قراءة الملف. تأكد أنه ملف JSON صحيح');
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);
  }

  async function handleRestore() {
    if (!selectedFile || !fileInfo) return;
    setConfirmOpen(false);
    setRestoring(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileInfo),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'فشل في استرجاع النسخة الاحتياطية');
        return;
      }
      setSuccess(
        `✅ تم الاسترجاع بنجاح — ${json.restored.residents} مقيم، ${json.restored.aid_records} سجل مساعدة`
      );
      setSelectedFile(null);
      setFileInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setError('فشل في الاتصال بالخادم');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div>
      <ConfirmDialog
        open={confirmOpen}
        title="تأكيد الاسترجاع"
        message={`سيتم حذف جميع البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية المؤرخة ${fileInfo?.createdAt?.split('T')[0] ?? ''}. هذا الإجراء لا يمكن التراجع عنه.`}
        confirmLabel="نعم، استرجع البيانات"
        danger
        onConfirm={handleRestore}
        onCancel={() => setConfirmOpen(false)}
      />

      <PageHeader
        title="النسخ الاحتياطي والاسترجاع"
        subtitle="حفظ بيانات النظام واسترجاعها عند الحاجة"
      />

      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
      {success && <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Backup */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">💾</span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">نسخ احتياطي</h2>
              <p className="text-sm text-slate-500">تحميل جميع البيانات كملف JSON</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm text-slate-600 space-y-1">
            <p>✅ يشمل جميع بيانات المقيمين</p>
            <p>✅ يشمل جميع سجلات المساعدات</p>
            <p>✅ يحفظ تاريخ ووقت النسخة</p>
            <p>✅ صالح للاسترجاع في أي وقت</p>
          </div>

          <button
            onClick={handleBackup}
            disabled={downloading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري التحضير...
              </>
            ) : (
              <>
                <span>📥</span>
                تحميل النسخة الاحتياطية
              </>
            )}
          </button>
        </div>

        {/* Restore */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🔄</span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">استرجاع البيانات</h2>
              <p className="text-sm text-slate-500">استعادة بيانات من نسخة احتياطية سابقة</p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 text-sm text-orange-800">
            ⚠️ تحذير: سيتم حذف جميع البيانات الحالية واستبدالها ببيانات الملف المحدد.
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              اختر ملف النسخة الاحتياطية
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:ml-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm"
            />
          </div>

          {fileInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm text-green-800 space-y-1">
              <p className="font-semibold">✅ ملف صالح</p>
              <p>📅 تاريخ النسخة: {fileInfo.createdAt?.split('T')[0]}</p>
              <p>👥 المقيمون: {fileInfo.counts?.residents ?? fileInfo.tables?.residents?.length}</p>
              <p>🤝 المساعدات: {fileInfo.counts?.aid_records ?? fileInfo.tables?.aid_records?.length}</p>
            </div>
          )}

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!selectedFile || !fileInfo || restoring}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {restoring ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الاسترجاع...
              </>
            ) : (
              <>
                <span>🔄</span>
                استرجاع البيانات
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4">📋 تعليمات النسخ الاحتياطي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-700 mb-2">للنسخ الاحتياطي اليدوي عبر MariaDB:</p>
            <div className="bg-slate-900 text-green-400 rounded-lg p-3 font-mono text-xs">
              mysqldump -u root -p resident_manager_db {'>'} backup.sql
            </div>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-2">لاسترجاع نسخة SQL:</p>
            <div className="bg-slate-900 text-green-400 rounded-lg p-3 font-mono text-xs">
              mysql -u root -p resident_manager_db {'<'} backup.sql
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          يُنصح بأخذ نسخة احتياطية يومياً وحفظها في مكان آمن خارج الجهاز.
        </p>
      </div>
    </div>
  );
}