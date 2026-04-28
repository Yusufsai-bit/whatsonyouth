import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { supabase } from '@/integrations/supabase/client';

interface AuditEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_table: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('admin_audit_log' as any)
      .select('id, actor_user_id, action, entity_table, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEntries((data as unknown as AuditEntry[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <AdminLayout>
      <AdminHeader title="Audit log" />
      <div className="p-6 md:p-8 overflow-auto">
        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EBEBEB]">
            <h2 className="font-heading font-bold text-base text-[#0A0A0A]">Recent admin actions</h2>
            <p className="font-body text-sm text-[#555555] mt-1">Tracks sensitive listing and scanner changes.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Time</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Action</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Entity</th>
                  <th className="px-4 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center font-body text-sm text-[#888888]">Loading…</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center font-body text-sm text-[#888888]">No audit entries yet.</td></tr>
                ) : entries.map((entry, i) => (
                  <tr key={entry.id} className={`border-t border-[#F0F0F0] ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                    <td className="px-4 py-3 font-body text-sm text-[#0A0A0A] whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-[#F0EEFF] text-[#5847E0] font-body text-xs font-medium px-2 py-0.5 rounded-full">{entry.action}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#555555]">{entry.entity_table}{entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}` : ''}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#555555] max-w-[420px] truncate" title={JSON.stringify(entry.metadata)}>{JSON.stringify(entry.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
