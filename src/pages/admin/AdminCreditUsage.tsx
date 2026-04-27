import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

type CreditType = 'all' | 'chat_message' | 'build_action' | 'scanner_run' | 'cloud_ai' | 'cloud_runtime';

interface CreditUsageEntry {
  id: string;
  credit_type: Exclude<CreditType, 'all'>;
  amount: number | null;
  spent_at: string;
  actor_user_id: string | null;
  related_table: string | null;
  related_id: string | null;
  run_url: string | null;
  scan_session_id: string | null;
  notes: string | null;
}

const PAGE_SIZE = 25;

const labels: Record<Exclude<CreditType, 'all'>, string> = {
  chat_message: 'Chat message',
  build_action: 'Build action',
  scanner_run: 'Scanner run',
  cloud_ai: 'Cloud AI',
  cloud_runtime: 'Cloud runtime',
};

export default function AdminCreditUsage() {
  const [entries, setEntries] = useState<CreditUsageEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<CreditType>('all');

  useEffect(() => {
    fetchEntries();
  }, [page, typeFilter]);

  const fetchEntries = async () => {
    setLoading(true);
    const offset = page * PAGE_SIZE;

    let query = supabase
      .from('credit_usage_log')
      .select('id, credit_type, amount, spent_at, actor_user_id, related_table, related_id, run_url, scan_session_id, notes', { count: 'exact' });

    if (typeFilter !== 'all') query = query.eq('credit_type', typeFilter);

    const { data, count } = await query
      .order('spent_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) setEntries(data as CreditUsageEntry[]);
    if (count !== null) setTotalCount(count);
    setLoading(false);
  };

  const startEntry = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const endEntry = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <AdminLayout>
      <AdminHeader title="Credit usage" />
      <div className="p-6 md:p-8 overflow-auto space-y-4">
        <div className="rounded-xl border border-[#EBEBEB] bg-white p-4">
          <p className="font-body text-sm text-[#555555]">
            Scanner runs are logged automatically. Chat messages and build actions happen in Lovable outside this app, so add those manually here only if you want a matching internal audit trail.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v as CreditType); setPage(0); }}>
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder="Credit type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="chat_message">Chat messages</SelectItem>
              <SelectItem value="build_action">Build actions</SelectItem>
              <SelectItem value="scanner_run">Scanner runs</SelectItem>
              <SelectItem value="cloud_ai">Cloud AI</SelectItem>
              <SelectItem value="cloud_runtime">Cloud runtime</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Date/time</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Type</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Amount</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Run</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.id} className={`h-14 ${i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                    <td className="px-4 font-body text-sm text-[#0A0A0A] whitespace-nowrap">
                      {new Date(entry.spent_at).toLocaleString()}
                    </td>
                    <td className="px-4">
                      <span className="inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full bg-[#F3E5F5] text-[#6A1B9A]">
                        {labels[entry.credit_type]}
                      </span>
                    </td>
                    <td className="px-4 font-body text-sm text-[#0A0A0A]">
                      {entry.amount ?? 'Unknown'}
                    </td>
                    <td className="px-4 font-body text-sm text-[#555555]">
                      {entry.run_url ? (
                        <Link to={entry.run_url} className="inline-flex items-center gap-1 text-brand-violet hover:underline">
                          View run <ExternalLink size={12} />
                        </Link>
                      ) : entry.scan_session_id ? entry.scan_session_id.slice(0, 8) : '—'}
                    </td>
                    <td className="px-4 font-body text-xs text-[#888888]" title={entry.notes || ''}>
                      {entry.notes ? (entry.notes.length > 80 ? entry.notes.slice(0, 80) + '…' : entry.notes) : '—'}
                    </td>
                  </tr>
                ))}
                {!loading && entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center font-body text-sm text-[#888888]">
                      No credit usage entries logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#EBEBEB]">
              <span className="font-body text-sm text-[#888888]">
                Showing {startEntry}–{endEntry} of {totalCount} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] font-body text-sm text-[#555555] hover:bg-[#F7F7F7] disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={endEntry >= totalCount}
                  className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] font-body text-sm text-[#555555] hover:bg-[#F7F7F7] disabled:opacity-40 flex items-center gap-1"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}