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

interface OpsStats {
  expiredActive: number;
  needsReview: number;
  duplicateGroups: number;
  weakSources: number;
}

interface RecentListing {
  id: string;
  title: string;
  category: string;
  source: string;
  created_at: string;
}

interface ReportStats {
  open: number;
  reviewing: number;
  resolved: number;
}

interface RecentAudit {
  id: string;
  action: string;
  entity_table: string;
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
  const [ops, setOps] = useState<OpsStats>({ expiredActive: 0, needsReview: 0, duplicateGroups: 0, weakSources: 0 });
  const [reports, setReports] = useState<ReportStats>({ open: 0, reviewing: 0, resolved: 0 });
  const [audit, setAudit] = useState<RecentAudit[]>([]);

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

    const [{ data: qualityData }, { data: sourceHealth }, { data: reportData }, { data: auditData }] = await Promise.all([
      supabase.from('admin_listing_quality' as any).select('quality_label, duplicate_fingerprint'),
      supabase.from('admin_scan_source_health' as any).select('health_label'),
      supabase.from('listing_reports' as any).select('status'),
      supabase.from('admin_audit_log' as any).select('id, action, entity_table, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const duplicateFingerprints = new Set<string>();
    (qualityData || []).forEach((row: any) => {
      if (row.quality_label === 'possible_duplicate' && row.duplicate_fingerprint) duplicateFingerprints.add(row.duplicate_fingerprint);
    });
    setOps({
      expiredActive: (qualityData || []).filter((row: any) => row.quality_label === 'expired_active').length,
      needsReview: (qualityData || []).filter((row: any) => row.quality_label === 'needs_review').length,
      duplicateGroups: duplicateFingerprints.size,
      weakSources: (sourceHealth || []).filter((row: any) => row.health_label === 'weak' || row.health_label === 'poor').length,
    });

    setReports({
      open: (reportData || []).filter((row: any) => row.status === 'open').length,
      reviewing: (reportData || []).filter((row: any) => row.status === 'reviewing').length,
      resolved: (reportData || []).filter((row: any) => row.status === 'resolved' || row.status === 'dismissed').length,
    });
    setAudit((auditData as unknown as RecentAudit[]) || []);
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Expired still active', value: ops.expiredActive, to: '/admin/listings' },
            { label: 'Needs review', value: ops.needsReview, to: '/admin/listings' },
            { label: 'Duplicate groups', value: ops.duplicateGroups, to: '/admin/listings' },
            { label: 'Weak sources', value: ops.weakSources, to: '/admin/scanner' },
          ].map((card) => (
            <Link key={card.label} to={card.to} className="bg-white border border-[#EBEBEB] rounded-xl p-5 hover:border-[#5847E0] transition-colors">
              <p className="font-body text-[13px] text-[#888888]">{card.label}</p>
              <p className={`font-heading font-bold text-[32px] mt-1 leading-tight ${card.value > 0 ? 'text-[#D85A30]' : 'text-[#1D9E75]'}`}>{card.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Link to="/admin/audit-log" className="bg-[#0A0A0A] text-white rounded-xl p-5 hover:bg-[#1A1A1A] transition-colors">
            <p className="font-body text-[13px] text-[#AAAAAA]">Open reports</p>
            <p className="font-heading font-bold text-[36px] mt-1 leading-tight">{reports.open}</p>
            <p className="font-body text-xs text-[#CCCCCC] mt-1">{reports.reviewing} under review · {reports.resolved} closed</p>
          </Link>
          <Link to="/admin/scanner" className="bg-white border border-[#EBEBEB] rounded-xl p-5 hover:border-[#5847E0] transition-colors">
            <p className="font-body text-[13px] text-[#888888]">Scanner health</p>
            <p className={`font-heading font-bold text-[36px] mt-1 leading-tight ${ops.weakSources > 0 ? 'text-[#D85A30]' : 'text-[#1D9E75]'}`}>{ops.weakSources}</p>
            <p className="font-body text-xs text-[#888888] mt-1">weak or poor sources</p>
          </Link>
          <Link to="/admin/listings" className="bg-white border border-[#EBEBEB] rounded-xl p-5 hover:border-[#5847E0] transition-colors">
            <p className="font-body text-[13px] text-[#888888]">Listing quality queue</p>
            <p className={`font-heading font-bold text-[36px] mt-1 leading-tight ${ops.needsReview + ops.expiredActive > 0 ? 'text-[#D85A30]' : 'text-[#1D9E75]'}`}>{ops.needsReview + ops.expiredActive}</p>
            <p className="font-body text-xs text-[#888888] mt-1">review or expiry issues</p>
          </Link>
        </div>

        {/* Last auto-scan card */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5 mb-8">
          <p className="font-body text-[13px] text-[#888888]">Last auto-scan</p>
          {lastScan ? (
            <>
              <p className="font-heading font-bold text-lg text-[#0A0A0A] mt-1">
                {new Date(lastScan.scanned_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="font-body text-sm text-[#0A0A0A] mt-1">
                {lastScan.listings_created} listing{lastScan.listings_created !== 1 ? 's' : ''} created
                <span className={`ml-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${lastScan.status === 'success' ? 'bg-[#E1F5EE] text-[#085041]' : 'bg-[#FFF3D0] text-[#633806]'}`}>
                  {lastScan.status}
                </span>
              </p>
            </>
          ) : (
            <p className="font-body text-sm text-[#888888] mt-1">No scans yet</p>
          )}
          <p className="font-body text-xs text-[#888888] mt-2">Next scan: {getNextScanDate()}</p>
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

          <div className="bg-white border border-[#EBEBEB] rounded-xl">
            <div className="px-5 py-4 border-b border-[#EBEBEB] flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-[#0A0A0A]">Recent admin activity</h2>
              <Link to="/admin/audit-log" className="font-body text-[13px] text-[#5847E0] hover:underline">View log</Link>
            </div>
            <div className="divide-y divide-[#F0F0F0]">
              {audit.map((entry) => (
                <div key={entry.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm text-[#0A0A0A] truncate">{entry.action.replace(/_/g, ' ')}</p>
                    <p className="font-body text-xs text-[#888888] mt-0.5">{entry.entity_table}</p>
                  </div>
                  <span className="font-body text-xs text-[#888888] whitespace-nowrap">{timeAgo(entry.created_at)}</span>
                </div>
              ))}
              {audit.length === 0 && (
                <p className="px-5 py-8 text-center font-body text-sm text-[#888888]">No admin activity yet.</p>
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
