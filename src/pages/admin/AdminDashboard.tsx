import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { toast } from 'sonner';

interface Stats {
  total: number;
  active: number;
  featured: number;
  thisWeek: number;
}

interface RecentListing {
  id: string;
  title: string;
  category: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, featured: 0, thisWeek: 0 });
  const [recent, setRecent] = useState<RecentListing[]>([]);

  const fetchData = async () => {
    const { data: all } = await supabase.from('listings').select('id, is_active, is_featured, created_at');
    if (all) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStats({
        total: all.length,
        active: all.filter(l => l.is_active).length,
        featured: all.filter(l => l.is_featured).length,
        thisWeek: all.filter(l => new Date(l.created_at) >= weekAgo).length,
      });
    }
    const { data: recentData } = await supabase
      .from('listings')
      .select('id, title, category, source, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (recentData) setRecent(recentData);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('listings').update({ is_active: !current }).eq('id', id);
    toast(current ? 'Listing marked as inactive' : 'Listing marked as active');
    fetchData();
  };

  const statCards = [
    { label: 'Total listings', value: stats.total },
    { label: 'Active listings', value: stats.active },
    { label: 'Featured', value: stats.featured },
    { label: 'This week', value: stats.thisWeek },
  ];

  return (
    <AdminLayout>
      <AdminHeader title="Dashboard" />
      <div className="p-6 md:p-8 overflow-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white border border-brand-card-border rounded-xl p-5">
              <p className="font-body text-sm text-brand-text-secondary">{card.label}</p>
              <p className="font-heading font-bold text-[28px] text-brand-text-primary mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-brand-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-card-border">
            <h2 className="font-heading font-bold text-base text-brand-text-primary">Recent listings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brand-section-alt">
                  <th className="text-left px-5 py-3 font-body font-medium text-[13px] text-brand-text-secondary">Title</th>
                  <th className="text-left px-5 py-3 font-body font-medium text-[13px] text-brand-text-secondary hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 font-body font-medium text-[13px] text-brand-text-secondary hidden md:table-cell">Source</th>
                  <th className="text-left px-5 py-3 font-body font-medium text-[13px] text-brand-text-secondary">Status</th>
                  <th className="text-left px-5 py-3 font-body font-medium text-[13px] text-brand-text-secondary hidden md:table-cell">Date added</th>
                  <th className="text-left px-5 py-3 font-body font-medium text-[13px] text-brand-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((listing, i) => (
                  <tr key={listing.id} className={i % 2 === 1 ? 'bg-brand-card-hover' : 'bg-white'}>
                    <td className="px-5 py-3 font-body text-sm text-brand-text-primary">{listing.title}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="inline-block bg-brand-violet-surface text-brand-violet font-body text-xs font-medium px-2 py-0.5 rounded-full">{listing.category}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <SourceBadge source={listing.source} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge active={listing.is_active} />
                    </td>
                    <td className="px-5 py-3 font-body text-sm text-brand-text-muted hidden md:table-cell">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/listings/${listing.id}/edit`} className="font-body text-xs text-brand-violet hover:underline">Edit</Link>
                        <button onClick={() => toggleActive(listing.id, listing.is_active)} className="font-body text-xs text-brand-text-muted hover:text-brand-text-primary">
                          {listing.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center font-body text-sm text-brand-text-muted">No listings yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-block bg-[#E1F5EE] text-[#085041] font-body text-xs font-medium px-2 py-0.5 rounded-full">Active</span>
  ) : (
    <span className="inline-block bg-brand-section-alt text-brand-text-muted font-body text-xs font-medium px-2 py-0.5 rounded-full">Inactive</span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    user: 'bg-[#EBE9FF] text-[#3C3489]',
    admin: 'bg-[#FFF3D0] text-[#633806]',
    ai_scan: 'bg-[#E6F1FB] text-[#0C447C]',
  };
  return (
    <span className={`inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full ${styles[source] || styles.user}`}>
      {source === 'ai_scan' ? 'AI scan' : source}
    </span>
  );
}
