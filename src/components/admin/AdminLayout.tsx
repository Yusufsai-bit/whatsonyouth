import AdminGuard from '@/components/admin/AdminGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex flex-col bg-[#F7F7F7] min-h-screen">
          <div className="sticky top-0 z-30 border-b border-border bg-background px-4 py-3 md:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-heading text-sm font-bold text-primary transition-colors hover:text-accent"
            >
              <Home size={16} />
              Return to home page
            </Link>
          </div>
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
