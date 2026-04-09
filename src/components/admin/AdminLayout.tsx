import AdminGuard from '@/components/admin/AdminGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex flex-col bg-brand-section-alt min-h-screen">
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
