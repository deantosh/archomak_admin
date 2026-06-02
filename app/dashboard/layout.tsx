import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <DashboardHeader />
      <main className="pt-16 lg:pl-64 pb-6">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
