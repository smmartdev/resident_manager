import Sidebar from '../../components/layout/Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-auto pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  );
}