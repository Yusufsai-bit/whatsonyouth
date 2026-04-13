import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';

interface ScanLogEntry {
  id: string;
  scanned_at: string;
  source_url: string;
  listings_found: number;
  listings_created: number;
  listings_skipped: number;
  status: string;
  error_message: string | null;
  scan_session_id: string | null;
}

const PAGE_SIZE = 25;

export default function AdminScanLog() {
  const [logs, setLogs] = useState<ScanLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSessions, setShowSessions] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [sessionDetails, setSessionDetails] = useState<Record<string, ScanLogEntry[]>>({});

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, searchQuery, showSessions]);

  const fetchLogs = async () => {
    setLoading(true);
    const offset = page * PAGE_SIZE;

    let query = supabase
      .from('scan_log')
      .select('*', { count: 'exact' });

    if (showSessions) {
      query = query.eq('source_url', '__session_summary__');
    } else {
      query = query.neq('source_url', '__session_summary__');
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery && !showSessions) {
      query = query.ilike('source_url', `%${searchQuery}%`);
    }

    const { data, count } = await query
      .order('scanned_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) setLogs(data as ScanLogEntry[]);
    if (count !== null) setTotalCount(count);
    setLoading(false);
  };

  const toggleSession = async (sessionId: string) => {
    const next = new Set(expandedSessions);
    if (next.has(sessionId)) {
      next.delete(sessionId);
      setExpandedSessions(next);
      return;
    }

    if (!sessionDetails[sessionId]) {
      const { data } = await supabase
        .from('scan_log')
        .select('*')
        .eq('scan_session_id', sessionId)
        .neq('source_url', '__session_summary__')
        .order('scanned_at', { ascending: true });
      if (data) {
        setSessionDetails(prev => ({ ...prev, [sessionId]: data as ScanLogEntry[] }));
      }
    }

    next.add(sessionId);
    setExpandedSessions(next);
  };

  const startEntry = page * PAGE_SIZE + 1;
  const endEntry = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <AdminLayout>
      <AdminHeader title="Scan log" />
      <div className="p-6 md:p-8 overflow-auto space-y-4">
        {/* Filter bar */}
        <div className="flex gap-3 flex-wrap items-center">
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[130px] text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>

          {!showSessions && (
            <Input
              placeholder="Search source URL..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
              className="w-[220px] text-sm"
            />
          )}

          <button
            onClick={() => { setShowSessions(!showSessions); setPage(0); }}
            className="px-3 py-2 rounded-lg border border-[#EBEBEB] font-body text-sm text-[#555555] hover:bg-[#F7F7F7] transition-colors"
          >
            {showSessions ? 'Show individual sources' : 'Show session summaries'}
          </button>
        </div>

        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  {showSessions && <th className="px-4 py-3 w-10"></th>}
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Date/time</th>
                  {showSessions ? (
                    <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Session</th>
                  ) : (
                    <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Source URL</th>
                  )}
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Found</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Created</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Skipped</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Status</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const isExpanded = log.scan_session_id ? expandedSessions.has(log.scan_session_id) : false;
                  const details = log.scan_session_id ? sessionDetails[log.scan_session_id] || [] : [];
                  const errorCount = details.filter(d => d.status === 'error').length;

                  return (
                    <>
                      <tr key={log.id} className={`h-14 ${i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                        {showSessions && (
                          <td className="px-4">
                            {log.scan_session_id && (
                              <button onClick={() => toggleSession(log.scan_session_id!)} className="text-[#888888] hover:text-[#0A0A0A]">
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                          </td>
                        )}
                        <td className="px-4 font-body text-sm text-[#0A0A0A] whitespace-nowrap">
                          {new Date(log.scanned_at).toLocaleString()}
                        </td>
                        {showSessions ? (
                          <td className="px-4 font-body text-sm text-[#555555] font-mono">
                            {log.scan_session_id?.slice(0, 8) || '—'}
                            {errorCount > 0 && (
                              <span className="ml-2 inline-block font-body text-xs font-medium px-1.5 py-0.5 rounded-full bg-[#FCEBEB] text-[#A32D2D]">
                                {errorCount} error{errorCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                        ) : (
                          <td className="px-4 font-body text-sm text-[#0A0A0A]" title={log.source_url}>
                            {log.source_url.length > 50 ? log.source_url.slice(0, 50) + '…' : log.source_url}
                          </td>
                        )}
                        <td className="px-4 font-body text-sm text-[#0A0A0A]">{log.listings_found}</td>
                        <td className="px-4 font-body text-sm text-[#0A0A0A]">{log.listings_created}</td>
                        <td className="px-4 font-body text-sm text-[#0A0A0A]">{log.listings_skipped}</td>
                        <td className="px-4">
                          <span className={`inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full ${
                            log.status === 'success'
                              ? 'bg-[#E1F5EE] text-[#085041]'
                              : log.status === 'partial'
                              ? 'bg-[#FFF8E1] text-[#F57F17]'
                              : 'bg-[#FCEBEB] text-[#A32D2D]'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 font-body text-xs text-[#888888]" title={log.error_message || ''}>
                          {log.error_message
                            ? (log.error_message.length > 60 ? log.error_message.slice(0, 60) + '…' : log.error_message)
                            : '—'}
                        </td>
                      </tr>
                      {/* Expanded session detail rows */}
                      {showSessions && isExpanded && details.map((d) => (
                        <tr key={d.id} className="bg-[#F7F7F7] h-11">
                          <td className="px-4"></td>
                          <td className="px-4 font-body text-xs text-[#888888] whitespace-nowrap pl-8">
                            {new Date(d.scanned_at).toLocaleTimeString()}
                          </td>
                          <td className="px-4 font-body text-xs text-[#555555]" title={d.source_url}>
                            {d.source_url.length > 45 ? d.source_url.slice(0, 45) + '…' : d.source_url}
                          </td>
                          <td className="px-4 font-body text-xs text-[#0A0A0A]">{d.listings_found}</td>
                          <td className="px-4 font-body text-xs text-[#0A0A0A]">{d.listings_created}</td>
                          <td className="px-4 font-body text-xs text-[#0A0A0A]">{d.listings_skipped}</td>
                          <td className="px-4">
                            <span className={`inline-block font-body text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              d.status === 'success' ? 'bg-[#E1F5EE] text-[#085041]' : 'bg-[#FCEBEB] text-[#A32D2D]'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="px-4 font-body text-[10px] text-[#888888]">
                            {d.error_message ? (d.error_message.length > 40 ? d.error_message.slice(0, 40) + '…' : d.error_message) : '—'}
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={showSessions ? 8 : 7} className="px-5 py-12 text-center font-body text-sm text-[#888888]">
                      No scans run yet. Use the scanning tool to start populating listings automatically.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
