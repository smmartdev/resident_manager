'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: '🏠' },
  { href: '/residents', label: 'المقيمون', icon: '👥' },
  { href: '/residents/new', label: 'إضافة مقيم', icon: '➕' },
  { href: '/aid', label: 'المساعدات', icon: '🤝' },
  { href: '/aid/new', label: 'تسجيل مساعدة', icon: '📋' },
  { href: '/reports', label: 'التقارير', icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
            pathname === item.href
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          )}
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 right-0 left-0 z-40 bg-slate-800 text-white flex items-center justify-between px-4 py-3 shadow-md">
        <h1 className="font-bold text-base">نظام إدارة المخيم</h1>
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl leading-none focus:outline-none"
          aria-label="القائمة"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={clsx(
        'lg:hidden fixed top-0 right-0 z-40 h-full w-64 bg-slate-800 text-white flex flex-col transform transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="p-6 border-b border-slate-700 mt-12">
          <h1 className="text-lg font-bold">نظام إدارة المخيم</h1>
          <p className="text-slate-400 text-xs mt-1">إدارة المقيمين والمساعدات</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-slate-800 text-white flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white leading-tight">نظام إدارة المخيم</h1>
          <p className="text-slate-400 text-sm mt-1">إدارة المقيمين والمساعدات</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs text-center">v1.0</p>
        </div>
      </aside>
    </>
  );
}