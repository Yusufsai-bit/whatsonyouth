import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Trash2, Plus, Play, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ScanSource {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  total_scans?: number;
  successful_scans?: number;
  failed_scans?: number;
  total_listings_created?: number;
  consecutive_failures?: number;
  last_scan_status?: string | null;
  quality_score?: number;
  health_label?: string;
}

interface ScanResult {
  source: string;
  url: string;
  found: number;
  created: number;
  skipped: number;
  status: string;
  error: string | null;
}

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

const CATEGORIES = ['Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'];

const categoryColors: Record<string, string> = {
  Events: 'bg-[#FFF3E0] text-[#E65100]',
  Jobs: 'bg-[#E3F2FD] text-[#0D47A1]',
  Grants: 'bg-[#E8F5E9] text-[#1B5E20]',
  Programs: 'bg-[#F3E5F5] text-[#6A1B9A]',
  Wellbeing: 'bg-[#FFF8E1] text-[#F57F17]',
};

export default function AdminScanner() {
  const [sources, setSources] = useState<ScanSource[]>([]);
  const [recentLogs, setRecentLogs] = useState<ScanLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanCategory, setScanCategory] = useState<string>('all');
  const [progress, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ found: number; created: number; skipped: number; scanned: number; images_resolved: number; images_from_unsplash: number; images_pending: number; expired_deactivated?: number; paused_low_balance?: boolean } | null>(null);

  // Add source form
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [validating, setValidating] = useState(false);

  // Source health
  const [sourceHealth, setSourceHealth] = useState<Record<string, string>>({});

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSources();
    fetchRecentLogs();
    fetchSourceHealth();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  const fetchSources = async () => {
    const { data } = await supabase.from('admin_scan_source_health' as any).select('*').order('category').order('quality_score', { ascending: false });
    if (data) setSources(data as unknown as ScanSource[]);
    setLoading(false);
  };

  const fetchRecentLogs = async () => {
    const { data } = await supabase.from('scan_log').select('*').neq('source_url', '__session_summary__').order('scanned_at', { ascending: false }).limit(10);
    if (data) setRecentLogs(data as ScanLogEntry[]);
  };

  const fetchSourceHealth = async () => {
    const { data } = await supabase
      .from('scan_log')
      .select('source_url, status')
      .neq('source_url', '__session_summary__')
      .order('scanned_at', { ascending: false })
      .limit(200);

    if (data) {
      const health: Record<string, string> = {};
      data.forEach((log: any) => {
        if (!health[log.source_url]) {
          health[log.source_url] = log.status;
        }
      });
      setSourceHealth(health);
    }
  };

  const toggleSource = async (id: string, isActive: boolean) => {
    await supabase.from('scan_sources').update({ is_active: isActive } as any).eq('id', id);
    await supabase.from('admin_audit_log' as any).insert({
      action: isActive ? 'scan_source_enabled' : 'scan_source_disabled',
      entity_table: 'scan_sources',
      entity_id: id,
      metadata: { is_active: isActive },
    });
    setSources(prev => prev.map(s => s.id === id ? { ...s, is_active: isActive } : s));
  };

  const removeSource = async (id: string) => {
    if (!confirm('Remove this source?')) return;
    await supabase.from('scan_sources').delete().eq('id', id);
    await supabase.from('admin_audit_log' as any).insert({ action: 'scan_source_deleted', entity_table: 'scan_sources', entity_id: id });
    setSources(prev => prev.filter(s => s.id !== id));
    toast.success('Source removed');
  };

  const addSource = async () => {
    if (!newUrl || !newName || !newCategory) {
      toast.error('Fill in all fields');
      return;
    }

    try {
      new URL(newUrl);
    } catch {
      toast.error('Please enter a valid URL starting with https://');
      return;
    }

    if (!newUrl.startsWith('https://')) {
      toast.error('URL must start with https://');
      return;
    }

    setValidating(true);
    toast.info('Checking URL...');

    try {
      const { data: valData, error: valError } = await supabase.functions.invoke(
        'validate-source-url',
        { body: { url: newUrl } }
      );

      if (valError || !valData?.reachable) {
        setValidating(false);
        toast.error(
          `URL check failed: ${valData?.reason || 'This URL appears to be unreachable or blocked. Please verify it loads in your browser.'}`
        );
        return;
      }
    } catch {
      setValidating(false);
      toast.error('Could not validate URL. Please check it loads in your browser.');
      return;
    }

    setValidating(false);

    const { data, error } = await supabase.from('scan_sources').insert({
      url: newUrl,
      name: newName,
      category: newCategory,
    } as any).select();
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'This URL is already a source' : error.message);
      return;
    }
    if (data) setSources(prev => [...prev, data[0] as unknown as ScanSource]);
    if (data?.[0]?.id) {
      await supabase.from('admin_audit_log' as any).insert({
        action: 'scan_source_added',
        entity_table: 'scan_sources',
        entity_id: data[0].id,
        metadata: { url: newUrl, name: newName, category: newCategory },
      });
    }
    setNewUrl('');
    setNewName('');
    setNewCategory('');
    toast.success('Source added and verified ✓');
  };

  const runScanWithSources = async (scanSources: { name: string; url: string; category: string }[], label: string) => {
    setScanning(true);
    setProgress(0);
    setProgressTotal(scanSources.length);
    setSummary(null);

    const BATCH_SIZE = 2; // ~120s per batch — safely under edge function ~150s limit
    const batches: typeof scanSources[] = [];
    for (let i = 0; i < scanSources.length; i += BATCH_SIZE) {
      batches.push(scanSources.slice(i, i + BATCH_SIZE));
    }

    setLogLines([
      `▶ ${label}`,
      `   Split into ${batches.length} batch${batches.length === 1 ? '' : 'es'} of up to ${BATCH_SIZE} sources each.`,
      '',
    ]);

    const totals = {
      scanned: 0,
      found: 0,
      created: 0,
      skipped: 0,
      images_resolved: 0,
      images_from_unsplash: 0,
      images_pending: 0,
      expired_deactivated: 0,
      paused_low_balance: false,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Not authenticated — please log in again');
        setScanning(false);
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-listings`;
      let completed = 0;

      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        setLogLines(prev => [...prev, `── Batch ${b + 1} of ${batches.length} (${batch.length} source${batch.length === 1 ? '' : 's'}) ──`]);

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ sources: batch }),
          });

          const data = await res.json();

          if (!data.success) {
            setLogLines(prev => [...prev, `❌ Batch ${b + 1} failed: ${data.error || 'Unknown error'}`, '']);
            completed += batch.length;
            setProgress(completed);
            continue;
          }

          const lines: string[] = [];
          (data.results as ScanResult[]).forEach((r) => {
            if (r.status === 'success') {
              lines.push(`✅ ${r.source} — ${r.found} found, ${r.created} created, ${r.skipped} skipped`);
            } else {
              lines.push(`❌ ${r.source} — ${r.error}`);
            }
          });

          totals.scanned += data.summary.sources_scanned || 0;
          totals.found += data.summary.listings_found || 0;
          totals.created += data.summary.listings_created || 0;
          totals.skipped += data.summary.listings_skipped || 0;
          totals.images_resolved += data.summary.images_resolved || 0;
          totals.images_from_unsplash += data.summary.images_from_unsplash || 0;
          totals.images_pending += data.summary.images_pending || 0;
          totals.expired_deactivated += data.summary.expired_deactivated || 0;
          totals.paused_low_balance = totals.paused_low_balance || Boolean(data.summary.paused_low_balance);

          completed += batch.length;
          setProgress(completed);
          setLogLines(prev => [...prev, ...lines, `   Running totals: ${totals.created} created, ${totals.skipped} skipped`, '']);
          setSummary({ ...totals });
        } catch (e: any) {
          setLogLines(prev => [...prev, `❌ Batch ${b + 1} error: ${e.message}`, '']);
          completed += batch.length;
          setProgress(completed);
        }
      }

      setLogLines(prev => [...prev, `✔ All batches complete — ${totals.created} new listings created.`]);
      setProgress(scanSources.length);
      fetchRecentLogs();
      fetchSourceHealth();
      totals.paused_low_balance
        ? toast.warning('Scanner paused because AI balance appears low')
        : toast.success(`Scan complete — ${totals.created} new listings created`);
    } catch (e: any) {
      setLogLines(prev => [...prev, `❌ Error: ${e.message}`]);
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const runScan = async () => {
    const activeSources = sources.filter(s => s.is_active && (scanCategory === 'all' || s.category === scanCategory));
    if (activeSources.length === 0) {
      toast.error('No active sources to scan');
      return;
    }
    await runScanWithSources(
      activeSources.map(s => ({ name: s.name, url: s.url, category: s.category })),
      `Starting scan of ${activeSources.length} sources`
    );
  };

  const rescanSource = async (source: ScanSource) => {
    await runScanWithSources(
      [{ name: source.name, url: source.url, category: source.category }],
      `Rescanning ${source.name}`
    );
  };

  return (
    <AdminLayout>
      <AdminHeader title="Scanner" />
      <div className="p-6 md:p-8 space-y-6 max-w-5xl">
        {/* SECTION A — Run Scan */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <div className="flex items-start gap-3 mb-1">
            <Zap size={20} className="text-[#D85A30] mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-[20px] text-[#0A0A0A]">AI listing scanner</h2>
              <p className="font-body text-sm text-[#555555] mt-1">
                Scans Victorian websites and automatically extracts listings for young people using AI.
              </p>
            </div>
          </div>

          <p className="font-body text-sm text-[#555555] mt-3 bg-[#F7F7F7] rounded-lg px-4 py-2.5">
            All scanned listings are published automatically after passing quality checks.
          </p>

          <div className="mt-4">
            <p className="font-body text-sm font-medium text-[#0A0A0A] mb-2">Scan category</p>
            <div className="flex flex-wrap gap-2">
              {['all', 'Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setScanCategory(cat)}
                  className={`font-body text-sm px-4 py-2 rounded-lg border transition-colors duration-100 ${
                    scanCategory === cat
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'bg-white text-[#555555] border-[#EBEBEB] hover:border-[#0A0A0A]'
                  }`}
                >
                  {cat === 'all' ? 'All categories' : cat}
                </button>
              ))}
            </div>
            <p className="font-body text-xs text-[#888888] mt-2">
              {scanCategory === 'all'
                ? `${sources.filter(s => s.is_active).length} active sources`
                : `${sources.filter(s => s.is_active && s.category === scanCategory).length} ${scanCategory} sources`}
            </p>
          </div>

          <button
            onClick={runScan}
            disabled={scanning}
            className="w-full mt-4 py-3.5 rounded-lg bg-[#D85A30] text-white font-heading font-bold text-base disabled:opacity-60 hover:bg-[#C04F28] transition-colors"
          >
            {scanning
              ? `Scanning... (${progress} of ${progressTotal} sources)`
              : scanCategory === 'all'
                ? 'Run full scan'
                : `Scan ${scanCategory} only`}
          </button>

          {(scanning || summary) && (
            <div className="mt-4 space-y-4">
              <Progress
                value={progressTotal > 0 ? (progress / progressTotal) * 100 : 0}
                className="h-2 bg-[#F0EEFF] [&>div]:bg-[#5847E0]"
              />

              {summary && (
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                  {[
                    { label: 'Sources', value: summary.scanned },
                    { label: 'Found', value: summary.found },
                    { label: 'Created', value: summary.created },
                    { label: 'Skipped', value: summary.skipped },
                    { label: 'OG Images', value: summary.images_resolved },
                    { label: 'Unsplash', value: summary.images_from_unsplash },
                    { label: 'Pending', value: summary.images_pending },
                    { label: 'Expired off', value: summary.expired_deactivated || 0 },
                  ].map(s => (
                    <div key={s.label} className="bg-[#F7F7F7] rounded-lg p-3 text-center">
                      <div className="font-heading font-bold text-xl text-[#0A0A0A]">{s.value}</div>
                      <div className="font-body text-xs text-[#888888] mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {summary?.paused_low_balance && (
                <div className="bg-[#FFF8F0] border border-[#F5C68A] rounded-lg px-4 py-3 font-body text-sm text-[#633806]">
                  Automatic scanning has been paused because the AI balance appears low.
                </div>
              )}

              {logLines.length > 0 && (
                <div
                  ref={logRef}
                  className="bg-[#0A0A0A] rounded-lg p-4 h-[240px] overflow-y-auto font-mono text-xs leading-relaxed"
                >
                  {logLines.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.startsWith('✅') ? 'text-green-400' :
                        line.startsWith('❌') ? 'text-red-400' :
                        line.includes('skipped') ? 'text-yellow-400' :
                        'text-[#AAAAAA]'
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION B — Manage Sources */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <h2 className="font-heading font-bold text-[18px] text-[#0A0A0A] mb-4">Manage sources</h2>

          {/* Add source form */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Input
              placeholder="URL"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              className="flex-1 min-w-[180px] text-sm"
            />
            <Input
              placeholder="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-[180px] text-sm"
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-[140px] text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={addSource}
              disabled={validating}
              className="px-4 py-2 rounded-lg bg-[#5847E0] text-white font-body text-sm font-medium hover:bg-[#4838C0] transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {validating ? 'Checking URL...' : <><Plus size={14} /> Add</>}
            </button>
          </div>

          {/* Sources table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left w-12">On</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Name</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">URL</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Category</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Health</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Created</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Last scan</th>
                  <th className="px-3 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => (
                  <tr key={s.id} className={`h-12 ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                    <td className="px-3">
                      <Switch checked={s.is_active} onCheckedChange={v => toggleSource(s.id, v)} />
                    </td>
                    <td className="px-3 font-body text-sm text-[#0A0A0A]">{s.name}</td>
                    <td className="px-3 font-body text-sm text-[#555555]" title={s.url}>
                      {s.url.length > 45 ? s.url.slice(0, 45) + '…' : s.url}
                    </td>
                    <td className="px-3">
                      <span className={`inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[s.category] || 'bg-gray-100 text-gray-600'}`}>
                        {s.category}
                      </span>
                    </td>
                    <td className="px-3">
                      <span className={`inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.health_label === 'strong' ? 'bg-[#E1F5EE] text-[#085041]' :
                        s.health_label === 'poor' || s.health_label === 'weak' ? 'bg-[#FCEBEB] text-[#A32D2D]' :
                        'bg-[#FFF3D0] text-[#633806]'
                      }`}>
                        {s.quality_score ?? 50}/100
                      </span>
                    </td>
                    <td className="px-3 font-body text-sm text-[#0A0A0A]">{s.total_listings_created || 0}</td>
                    <td className="px-3">
                      {(s.last_scan_status || sourceHealth[s.url]) === 'success' ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-[#1D9E75]" title="Last scan succeeded" />
                      ) : ['error', 'paused_low_balance'].includes(s.last_scan_status || sourceHealth[s.url]) ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-[#E24B4A]" title="Last scan failed — 3 failures will auto-disable this source" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-[#DDDDDD]" title="Not yet scanned" />
                      )}
                    </td>
                    <td className="px-3 flex items-center gap-1">
                      <button
                        onClick={() => rescanSource(s)}
                        disabled={scanning}
                        className="text-[#CCCCCC] hover:text-[#5847E0] transition-colors"
                        title="Rescan this source only"
                      >
                        <Play size={12} />
                      </button>
                      <button onClick={() => removeSource(s.id)} className="text-[#CCCCCC] hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION C — Scan History */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <h2 className="font-heading font-bold text-[18px] text-[#0A0A0A] mb-4">Recent scans</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Date</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Source</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Found</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Created</th>
                  <th className="px-3 py-2.5 font-body font-medium text-[13px] text-[#888888] text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log, i) => (
                  <tr key={log.id} className={`h-11 ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                    <td className="px-3 font-body text-sm text-[#0A0A0A] whitespace-nowrap">
                      {new Date(log.scanned_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 font-body text-sm text-[#555555]" title={log.source_url}>
                      {log.source_url.length > 40 ? log.source_url.slice(0, 40) + '…' : log.source_url}
                    </td>
                    <td className="px-3 font-body text-sm text-[#0A0A0A]">{log.listings_found}</td>
                    <td className="px-3 font-body text-sm text-[#0A0A0A]">{log.listings_created}</td>
                    <td className="px-3">
                      <span className={`inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full ${
                        log.status === 'success' ? 'bg-[#E1F5EE] text-[#085041]' : 'bg-[#FCEBEB] text-[#A32D2D]'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center font-body text-sm text-[#888888]">
                      No scans yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Link to="/admin/scan-log" className="block mt-3 font-body text-sm text-[#5847E0] hover:underline">
            View full history →
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
