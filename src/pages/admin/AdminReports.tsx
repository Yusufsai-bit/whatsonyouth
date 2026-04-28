import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { supabase } from '@/integrations/supabase/client';

type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

interface ReportRow {
  id: string;
  listing_id: string;
  reason_category: string;
  reason: string;
  status: ReportStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  listings?: {
    title: string;
    organisation: string;
    category: string;
    is_active: boolean;
  } | null;
}

const statusOptions: ReportStatus[] = ['open', 'reviewing', 'resolved', 'dismissed'];

export default function AdminReports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('open');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('listing_reports' as any)
      .select('id, listing_id, reason_category, reason, status, admin_notes, reviewed_at, created_at, listings(title, organisation, category, is_active)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) toast.error('Could not load reports');
    const rows = ((data as unknown as ReportRow[]) || []);
    setReports(rows);
    setNotes(Object.fromEntries(rows.map(report => [report.id, report.admin_notes || ''])));
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return reports;
    return reports.filter(report => report.status === statusFilter);
  }, [reports, statusFilter]);

  const counts = useMemo(() => ({
    open: reports.filter(report => report.status === 'open').length,
    reviewing: reports.filter(report => report.status === 'reviewing').length,
    resolved: reports.filter(report => report.status === 'resolved').length,
    dismissed: reports.filter(report => report.status === 'dismissed').length,
  }), [reports]);

  const updateReport = async (report: ReportRow, status: ReportStatus) => {
    const adminNotes = (notes[report.id] || '').slice(0, 1000);
    const { data: sessionData } = await supabase.auth.getSession();
    const reviewerId = sessionData.session?.user.id || null;

    const { error } = await supabase
      .from('listing_reports' as any)
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_at: ['resolved', 'dismissed'].includes(status) ? new Date().toISOString() : null,
        reviewed_by: ['resolved', 'dismissed'].includes(status) ? reviewerId : null,
      })
      .eq('id', report.id);

    if (error) {
      toast.error('Could not update report');
      return;
    }

    await supabase.from('admin_audit_log' as any).insert({
      action: `listing_report_${status}`,
      entity_table: 'listing_reports',
      entity_id: report.id,
      metadata: { listing_id: report.listing_id, reason_category: report.reason_category },
    });

    setReports(prev => prev.map(item => item.id === report.id ? { ...item, status, admin_notes: adminNotes || null } : item));
    toast.success('Report updated');
  };

  return (
    <AdminLayout>
      <AdminHeader title="Reports" />
      <div className="p-6 md:p-8 overflow-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-left bg-white border rounded-xl p-5 transition-colors ${statusFilter === status ? 'border-[#5847E0]' : 'border-[#EBEBEB] hover:border-[#5847E0]'}`}
            >
              <p className="font-body text-[13px] text-[#888888] capitalize">{status}</p>
              <p className={`font-heading font-bold text-[32px] mt-1 leading-tight ${counts[status] > 0 && ['open', 'reviewing'].includes(status) ? 'text-[#D85A30]' : 'text-[#0A0A0A]'}`}>
                {counts[status]}
              </p>
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EBEBEB] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-[#0A0A0A]">Listing reports</h2>
              <p className="font-body text-sm text-[#555555] mt-1">Review broken links, expired opportunities, incorrect details, and safety reports.</p>
            </div>
            <button
              onClick={() => setStatusFilter(statusFilter === 'all' ? 'open' : 'all')}
              className="font-body text-sm text-[#5847E0] hover:underline min-h-[44px]"
            >
              {statusFilter === 'all' ? 'Show open only' : 'Show all reports'}
            </button>
          </div>

          <div className="divide-y divide-[#F0F0F0]">
            {loading ? (
              <p className="px-5 py-10 text-center font-body text-sm text-[#888888]">Loading reports…</p>
            ) : filteredReports.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <Flag size={32} className="mx-auto text-[#DDDDDD] mb-3" />
                <p className="font-heading font-bold text-[18px] text-[#0A0A0A]">No reports in this queue</p>
              </div>
            ) : filteredReports.map(report => (
              <div key={report.id} className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-[#F0EEFF] text-[#5847E0] font-body text-xs font-medium px-2 py-0.5 rounded-full">{report.reason_category.replace(/_/g, ' ')}</span>
                    <span className="bg-[#F7F7F7] text-[#555555] font-body text-xs font-medium px-2 py-0.5 rounded-full capitalize">{report.status}</span>
                    <span className="font-body text-xs text-[#888888]">{new Date(report.created_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <h3 className="font-heading font-bold text-[16px] text-[#0A0A0A] leading-snug">
                    {report.listings?.title || 'Listing unavailable'}
                  </h3>
                  <p className="font-body text-sm text-[#555555] mt-1">
                    {report.listings?.organisation || 'Unknown organisation'} · {report.listings?.category || 'Unknown category'}
                  </p>
                  <p className="font-body text-sm text-[#0A0A0A] mt-4 leading-[1.6] whitespace-pre-line">{report.reason}</p>
                  <Link to={`/listings/${report.listing_id}`} target="_blank" className="inline-flex items-center gap-1.5 mt-4 font-body text-sm text-[#5847E0] hover:underline min-h-[44px]">
                    Open listing <ExternalLink size={13} />
                  </Link>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={notes[report.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [report.id]: e.target.value.slice(0, 1000) }))}
                    placeholder="Admin notes"
                    rows={4}
                    className="w-full border border-[#DDDDDD] rounded-lg p-3 font-body text-sm text-[#0A0A0A] focus:outline-none focus:border-[#5847E0] resize-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateReport(report, 'reviewing')} className="border border-[#EBEBEB] rounded-lg px-3 py-2 font-body text-sm text-[#0A0A0A] hover:bg-[#F7F7F7] min-h-[44px]">Reviewing</button>
                    <button onClick={() => updateReport(report, 'resolved')} className="bg-[#E1F5EE] text-[#085041] rounded-lg px-3 py-2 font-body text-sm font-medium min-h-[44px]">Resolve</button>
                    <button onClick={() => updateReport(report, 'dismissed')} className="border border-[#EBEBEB] rounded-lg px-3 py-2 font-body text-sm text-[#0A0A0A] hover:bg-[#F7F7F7] min-h-[44px]">Dismiss</button>
                    <button onClick={() => updateReport(report, 'open')} className="border border-[#EBEBEB] rounded-lg px-3 py-2 font-body text-sm text-[#0A0A0A] hover:bg-[#F7F7F7] min-h-[44px]">Reopen</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}