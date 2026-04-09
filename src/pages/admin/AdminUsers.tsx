import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminUsers() {
  return (
    <AdminLayout>
      <AdminHeader title="Users" showAddButton={false} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading font-bold text-lg text-brand-text-primary">Coming soon</h2>
          <p className="font-body text-sm text-brand-text-muted mt-2">User management is under development.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
