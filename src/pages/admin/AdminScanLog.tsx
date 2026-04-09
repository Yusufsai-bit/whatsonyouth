import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';

interface ScanLogEntry {
  id: string;
  scanned_at: string;
  source_url: string;
  listings_found: number;
  listings_created: number;
  listings_skipped: number;
  status: string;
  error_message: string | null;
}

export default function AdminScanLog() {
  const [logs, setLogs] = useState<ScanLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('scan_log')
        .select('*')
        .order('scanned_at', { ascending: false });
      if (data) setLogs(data as ScanLogEntry[]);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <AdminLayout>
      <AdminHeader title="Scan log" />
      <div className="p-6 md:p-8 overflow-auto">
        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Date/time</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Source URL</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Found</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Created</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Skipped</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Status</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={`h-14 ${i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                    <td className="px-4 font-body text-sm text-[#0A0A0A] whitespace-nowrap">
                      {new Date(log.scanned_at).toLocaleString()}
                    </td>
                    <td className="px-4 font-body text-sm text-[#0A0A0A]" title={log.source_url}>
                      {log.source_url.length > 50 ? log.source_url.slice(0, 50) + '…' : log.source_url}
                    </td>
                    <td className="px-4 font-body text-sm text-[#0A0A0A]">{log.listings_found}</td>
                    <td className="px-4 font-body text-sm text-[#0A0A0A]">{log.listings_created}</td>
                    <td className="px-4 font-body text-sm text-[#0A0A0A]">{log.listings_skipped}</td>
                    <td className="px-4">
                      <span className={`inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full ${
                        log.status === 'success'
                          ? 'bg-[#E1F5EE] text-[#085041]'
                          : 'bg-[#FCEBEB] text-[#A32D2D]'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 font-body text-xs text-[#888888]" title={log.error_message || ''}>
                      {log.status === 'error' && log.error_message
                        ? (log.error_message.length > 60 ? log.error_message.slice(0, 60) + '…' : log.error_message)
                        : '—'}
                    </td>
                  </tr>
                ))}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center font-body text-sm text-[#888888]">
                      No scans run yet. Use the scanning tool to start populating listings automatically.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
