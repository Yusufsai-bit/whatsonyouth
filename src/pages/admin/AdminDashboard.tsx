import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';

interface Stats {
  total: number;
  active: number;
  featured: number;
  thisWeek: number;
}

interface LastScan {
  scanned_at: string;
  listings_created: number;
  status: string;
}

interface RecentListing {
  id: string;
  title: string;
  category: string;
  source: string;
  created_at: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, featured: 0, thisWeek: 0 });
  const [recent, setRecent] = useState<RecentListing[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);

  function getNextScanDate(): string {
    const now = new Date();
    const days = [1, 4]; // Monday & Thursday UTC = Tuesday & Friday AEST
    const candidates: Date[] = [];
    for (let offset = 0; offset <= 7; offset++) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setUTCHours(21, 0, 0, 0); // 9pm UTC = 7am AEST
      if (days.includes(d.getUTCDay()) && d > now) {
        candidates.push(d);
      }
    }
    if (candidates.length === 0) return 'Unknown';
    const next = candidates[0];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayNames[next.getDay()]} ${next.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} 7:00 AM AEST`;
  }

  const fetchData = async () => {
    const { data: all } = await supabase.from('listings').select('id, is_active, is_featured, created_at, category');
    if (all) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekCount = all.filter(l => new Date(l.created_at) >= weekAgo).length;
      setStats({
        total: all.length,
        active: all.filter(l => l.is_active).length,
        featured: all.filter(l => l.is_featured).length,
        thisWeek: weekCount,
      });

      const catMap: Record<string, number> = {};
      all.filter(l => l.is_active).forEach(l => {
        catMap[l.category] = (catMap[l.category] || 0) + 1;
      });
      setCategories(
        Object.entries(catMap)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
      );
    }
    const { data: recentData } = await supabase
      .from('listings')
      .select('id, title, category, source, created_at')
      .order('created_at', { ascending: false })
      .limit(8);
    if (recentData) setRecent(recentData);

    // Fetch last auto-scan
    const { data: scanData } = await supabase
      .from('scan_log')
      .select('scanned_at, listings_created, status')
      .order('scanned_at', { ascending: false })
      .limit(1);
    if (scanData && scanData.length > 0) setLastScan(scanData[0]);
  };

  useEffect(() => { fetchData(); }, []);

  const statCards = [
    { label: 'Total listings', value: stats.total, trend: `+${stats.thisWeek} this week` },
    { label: 'Active listings', value: stats.active, trend: '' },
    { label: 'Featured', value: stats.featured, trend: '' },
    { label: 'New this week', value: stats.thisWeek, trend: '' },
  ];

  const maxCatCount = Math.max(...categories.map(c => c.count), 1);

  return (
    <AdminLayout>
      <AdminHeader title="Overview" />
      <div className="p-6 md:p-8 overflow-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white border border-[#EBEBEB] rounded-xl p-5">
              <p className="font-body text-[13px] text-[#888888]">{card.label}</p>
              <p className="font-heading font-bold text-[36px] text-[#0A0A0A] mt-1 leading-tight">{card.value}</p>
              {card.trend && (
                <p className="font-body text-xs text-[#1D9E75] mt-1">{card.trend}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent listings */}
          <div className="bg-white border border-[#EBEBEB] rounded-xl">
            <div className="px-5 py-4 border-b border-[#EBEBEB] flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-[#0A0A0A]">Recent listings</h2>
              <Link to="/admin/listings" className="font-body text-[13px] text-[#5847E0] hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-[#F0F0F0]">
              {recent.map((listing) => (
                <div key={listing.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-[#0A0A0A] truncate">{listing.title.length > 40 ? listing.title.slice(0, 40) + '…' : listing.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-block bg-[#F0EEFF] text-[#5847E0] font-body text-xs font-medium px-2 py-0.5 rounded-full">{listing.category}</span>
                    <SourceBadge source={listing.source} />
                    <span className="font-body text-xs text-[#888888] whitespace-nowrap">{timeAgo(listing.created_at)}</span>
                  </div>
                </div>
              ))}
              {recent.length === 0 && (
                <p className="px-5 py-8 text-center font-body text-sm text-[#888888]">No listings yet.</p>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-white border border-[#EBEBEB] rounded-xl">
            <div className="px-5 py-4 border-b border-[#EBEBEB]">
              <h2 className="font-heading font-bold text-base text-[#0A0A0A]">Category breakdown</h2>
            </div>
            <div className="p-5 space-y-4">
              {categories.map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="font-body text-sm text-[#0A0A0A] w-24 flex-shrink-0">{cat.category}</span>
                  <div className="flex-1 h-6 bg-[#F0EEFF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5847E0] rounded-full transition-all"
                      style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                    />
                  </div>
                  <span className="font-body text-sm text-[#888888] w-8 text-right flex-shrink-0">{cat.count}</span>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-center font-body text-sm text-[#888888]">No active listings.</p>
              )}
            </div>
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
    <span className="inline-block bg-[#F7F7F7] text-[#888888] font-body text-xs font-medium px-2 py-0.5 rounded-full">Inactive</span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    user: 'bg-[#EBE9FF] text-[#3C3489]',
    admin: 'bg-[#FFF3D0] text-[#633806]',
  };
  const labels: Record<string, string> = {
    user: 'User',
    admin: 'Admin',
  };
  return (
    <span className={`inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full ${styles[source] || styles.user}`}>
      {labels[source] || source}
    </span>
  );
}
