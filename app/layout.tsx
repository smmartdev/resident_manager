import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'نظام إدارة المخيم',
  description: 'نظام إدارة مخيم اللاجئين',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50" suppressHydrationWarning>{children}</body>
    </html>
  );
}