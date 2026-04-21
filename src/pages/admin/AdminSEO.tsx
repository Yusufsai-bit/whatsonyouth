import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { SEO_MANIFEST, type SeoManifestEntry, type RouteAuditResult } from '@/lib/seo-audit';
import { Play, AlertTriangle, CheckCircle2, XCircle, ExternalLink, LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BrokenLink {
  id: string;
  title: string;
  category: string;
  link: string;
  reason: string;
}

/**
 * Loads a same-origin route in a hidden iframe and reads its <head> after
 * react-helmet-async has updated it. Resolves with the audit for that route.
 */
function auditRouteInIframe(entry: SeoManifestEntry): Promise<RouteAuditResult> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1024px';
    iframe.style.height = '768px';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = entry.route;

    let settled = false;
    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    const finish = (result: RouteAuditResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const inspect = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) {
          finish({
            route: entry.route,
            label: entry.label,
            shouldIndex: entry.shouldIndex,
            status: 'fail',
            issues: [
              {
                route: entry.route,
                label: entry.label,
                severity: 'error',
                message: 'Could not access iframe document (cross-origin?)',
              },
            ],
          });
          return;
        }

        // Wait an extra tick so react-helmet-async commits head changes.
        setTimeout(() => {
          try {
            const title = doc.title?.trim() || '';
            const description =
              doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
            const canonical =
              doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
            const robots =
              doc
                .querySelector('meta[name="robots"]')
                ?.getAttribute('content')
                ?.trim()
                .toLowerCase() || '';

            const issues: RouteAuditResult['issues'] = [];

            if (!title)
              issues.push({ route: entry.route, label: entry.label, severity: 'error', message: 'Missing <title>' });
            else if (title.length < 10)
              issues.push({ route: entry.route, label: entry.label, severity: 'warning', message: `Title is very short (${title.length} chars)` });
            else if (title.length > 70)
              issues.push({ route: entry.route, label: entry.label, severity: 'warning', message: `Title is too long (${title.length} chars, recommend ≤70)` });

            if (!description)
              issues.push({ route: entry.route, label: entry.label, severity: 'error', message: 'Missing meta description' });
            else if (description.length < 50)
              issues.push({ route: entry.route, label: entry.label, severity: 'warning', message: `Description is very short (${description.length} chars)` });
            else if (description.length > 170)
              issues.push({ route: entry.route, label: entry.label, severity: 'warning', message: `Description is too long (${description.length} chars, recommend ≤170)` });

            const isNoindex = robots.includes('noindex');
            if (entry.shouldIndex) {
              if (isNoindex)
                issues.push({
                  route: entry.route,
                  label: entry.label,
                  severity: 'error',
                  message: `Page is publicly indexable but robots meta is "${robots}" — remove noindex`,
                });
              if (!canonical)
                issues.push({
                  route: entry.route,
                  label: entry.label,
                  severity: 'error',
                  message: 'Missing canonical link on indexable page',
                });
            } else {
              if (!isNoindex)
                issues.push({
                  route: entry.route,
                  label: entry.label,
                  severity: 'error',
                  message: `Private route should be noindex but robots meta is "${robots || '(missing)'}"`,
                });
            }

            finish({
              route: entry.route,
              label: entry.label,
              shouldIndex: entry.shouldIndex,
              status: issues.some((i) => i.severity === 'error') ? 'fail' : 'ok',
              title,
              description,
              canonical,
              robots,
              issues,
            });
          } catch (err) {
            finish({
              route: entry.route,
              label: entry.label,
              shouldIndex: entry.shouldIndex,
              status: 'fail',
              issues: [
                {
                  route: entry.route,
                  label: entry.label,
                  severity: 'error',
                  message: `Error reading head: ${(err as Error).message}`,
                },
              ],
            });
          }
        }, 600);
      } catch (err) {
        finish({
          route: entry.route,
          label: entry.label,
          shouldIndex: entry.shouldIndex,
          status: 'fail',
          issues: [
            {
              route: entry.route,
              label: entry.label,
              severity: 'error',
              message: `Iframe load error: ${(err as Error).message}`,
            },
          ],
        });
      }
    };

    iframe.addEventListener('load', inspect);
    // 12s hard timeout per page
    setTimeout(() => {
      finish({
        route: entry.route,
        label: entry.label,
        shouldIndex: entry.shouldIndex,
        status: 'fail',
        issues: [
          {
            route: entry.route,
            label: entry.label,
            severity: 'error',
            message: 'Audit timed out (page took longer than 12s to load)',
          },
        ],
      });
    }, 12000);

    document.body.appendChild(iframe);
  });
}

export default function AdminSEO() {
  const [metaResults, setMetaResults] = useState<RouteAuditResult[]>([]);
  const [metaRunning, setMetaRunning] = useState(false);
  const [metaProgress, setMetaProgress] = useState({ done: 0, total: 0 });

  const [linkRunning, setLinkRunning] = useState(false);
  const [linkProgress, setLinkProgress] = useState({ done: 0, total: 0 });
  const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>([]);
  const [linksChecked, setLinksChecked] = useState(0);
  const cancelLinkRef = useRef(false);

  // Auto-run a quick audit of the current document on mount so the admin sees
  // something useful immediately for the /admin/seo route itself.
  useEffect(() => {
    return () => {
      cancelLinkRef.current = true;
    };
  }, []);

  const runMetaAudit = async () => {
    setMetaRunning(true);
    setMetaResults([]);
    setMetaProgress({ done: 0, total: SEO_MANIFEST.length });
    const results: RouteAuditResult[] = [];
    for (let i = 0; i < SEO_MANIFEST.length; i++) {
      const r = await auditRouteInIframe(SEO_MANIFEST[i]);
      results.push(r);
      setMetaResults([...results]);
      setMetaProgress({ done: i + 1, total: SEO_MANIFEST.length });
    }
    setMetaRunning(false);
  };

  const runLinkAudit = async () => {
    setLinkRunning(true);
    setBrokenLinks([]);
    setLinksChecked(0);
    cancelLinkRef.current = false;

    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, category, link')
      .eq('is_active', true);

    if (error || !listings) {
      setLinkRunning(false);
      return;
    }

    setLinkProgress({ done: 0, total: listings.length });
    const broken: BrokenLink[] = [];
    const CONCURRENCY = 6;
    let cursor = 0;
    let done = 0;

    const worker = async () => {
      while (cursor < listings.length && !cancelLinkRef.current) {
        const idx = cursor++;
        const l = listings[idx];
        try {
          const { data, error: fnError } = await supabase.functions.invoke('validate-source-url', {
            body: { url: l.link },
          });
          if (fnError) {
            broken.push({
              id: l.id,
              title: l.title,
              category: l.category,
              link: l.link,
              reason: `Function error: ${fnError.message}`,
            });
          } else if (data && data.reachable === false) {
            broken.push({
              id: l.id,
              title: l.title,
              category: l.category,
              link: l.link,
              reason: data.reason || 'Unreachable',
            });
          }
        } catch (err) {
          broken.push({
            id: l.id,
            title: l.title,
            category: l.category,
            link: l.link,
            reason: `Network error: ${(err as Error).message}`,
          });
        }
        done++;
        setLinkProgress({ done, total: listings.length });
        setBrokenLinks([...broken]);
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setLinksChecked(done);
    setLinkRunning(false);
  };

  const cancelLinkAudit = () => {
    cancelLinkRef.current = true;
  };

  const errorCount = metaResults.reduce(
    (n, r) => n + r.issues.filter((i) => i.severity === 'error').length,
    0,
  );
  const warningCount = metaResults.reduce(
    (n, r) => n + r.issues.filter((i) => i.severity === 'warning').length,
    0,
  );

  return (
    <AdminLayout>
      <AdminHeader title="SEO diagnostics" showAddButton={false} />

      <div className="p-6 md:p-8 space-y-8 max-w-6xl">
        {/* Meta audit */}
        <section className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0A0A0A]">Page meta audit</h2>
              <p className="font-body text-sm text-[#666] mt-1">
                Loads each public route in a hidden frame and checks{' '}
                <code className="text-[12px] bg-[#F7F7F7] px-1 rounded">title</code>,{' '}
                <code className="text-[12px] bg-[#F7F7F7] px-1 rounded">description</code>,{' '}
                <code className="text-[12px] bg-[#F7F7F7] px-1 rounded">canonical</code>, and{' '}
                <code className="text-[12px] bg-[#F7F7F7] px-1 rounded">robots</code> rules.
              </p>
            </div>
            <button
              onClick={runMetaAudit}
              disabled={metaRunning}
              className="bg-[#5847E0] text-white font-heading font-bold text-sm rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              <Play size={14} />
              {metaRunning ? `Running… ${metaProgress.done}/${metaProgress.total}` : 'Run meta audit'}
            </button>
          </div>

          {metaResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-4 mb-3 font-body text-sm">
                <span className="flex items-center gap-1.5 text-[#C62828]">
                  <XCircle size={16} /> {errorCount} error{errorCount === 1 ? '' : 's'}
                </span>
                <span className="flex items-center gap-1.5 text-[#E65100]">
                  <AlertTriangle size={16} /> {warningCount} warning{warningCount === 1 ? '' : 's'}
                </span>
                <span className="flex items-center gap-1.5 text-[#1B5E20]">
                  <CheckCircle2 size={16} /> {metaResults.filter((r) => r.status === 'ok').length}{' '}
                  passing
                </span>
              </div>

              <div className="border border-[#EBEBEB] rounded-lg divide-y divide-[#EBEBEB]">
                {metaResults.map((r) => (
                  <details key={r.route} className="group">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-[#FAFAFA]">
                      <div className="flex items-center gap-2 min-w-0">
                        {r.status === 'ok' ? (
                          <CheckCircle2 size={16} className="text-[#1B5E20] flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-[#C62828] flex-shrink-0" />
                        )}
                        <span className="font-body font-medium text-sm text-[#0A0A0A] truncate">
                          {r.label}
                        </span>
                        <code className="font-body text-xs text-[#666] truncate">{r.route}</code>
                        {!r.shouldIndex && (
                          <span className="font-body text-[10px] bg-[#F3E5F5] text-[#6A1B9A] rounded-full px-2 py-0.5 flex-shrink-0">
                            noindex
                          </span>
                        )}
                      </div>
                      <span className="font-body text-xs text-[#888] flex-shrink-0">
                        {r.issues.length === 0 ? 'OK' : `${r.issues.length} issue${r.issues.length === 1 ? '' : 's'}`}
                      </span>
                    </summary>
                    <div className="px-4 pb-4 space-y-3 bg-[#FAFAFA]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-body text-xs text-[#444] pt-3">
                        <div><strong className="text-[#0A0A0A]">Title:</strong> {r.title || <em className="text-[#999]">(missing)</em>}</div>
                        <div><strong className="text-[#0A0A0A]">Robots:</strong> {r.robots || <em className="text-[#999]">(missing)</em>}</div>
                        <div className="md:col-span-2"><strong className="text-[#0A0A0A]">Description:</strong> {r.description || <em className="text-[#999]">(missing)</em>}</div>
                        <div className="md:col-span-2"><strong className="text-[#0A0A0A]">Canonical:</strong> {r.canonical || <em className="text-[#999]">(missing)</em>}</div>
                      </div>
                      {r.issues.length > 0 && (
                        <ul className="space-y-1.5">
                          {r.issues.map((i, idx) => (
                            <li
                              key={idx}
                              className={`flex items-start gap-2 font-body text-sm ${
                                i.severity === 'error' ? 'text-[#C62828]' : 'text-[#E65100]'
                              }`}
                            >
                              {i.severity === 'error' ? (
                                <XCircle size={14} className="flex-shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                              )}
                              <span>{i.message}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Broken-link audit */}
        <section className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0A0A0A]">Broken outbound links</h2>
              <p className="font-body text-sm text-[#666] mt-1">
                Probes every active listing's external URL. Listings that return non-200 or have
                no readable content appear below.
              </p>
            </div>
            {linkRunning ? (
              <button
                onClick={cancelLinkAudit}
                className="bg-[#0A0A0A] text-white font-heading font-bold text-sm rounded-lg px-4 py-2"
              >
                Cancel ({linkProgress.done}/{linkProgress.total})
              </button>
            ) : (
              <button
                onClick={runLinkAudit}
                className="bg-[#5847E0] text-white font-heading font-bold text-sm rounded-lg px-4 py-2 flex items-center gap-2"
              >
                <LinkIcon size={14} />
                Run link audit
              </button>
            )}
          </div>

          {(linkRunning || linksChecked > 0) && (
            <div className="font-body text-sm text-[#666] mb-3">
              {linkRunning
                ? `Checking ${linkProgress.done} of ${linkProgress.total}…`
                : `Checked ${linksChecked} listing${linksChecked === 1 ? '' : 's'} — found ${brokenLinks.length} broken.`}
            </div>
          )}

          {brokenLinks.length > 0 && (
            <div className="border border-[#EBEBEB] rounded-lg divide-y divide-[#EBEBEB]">
              {brokenLinks.map((b) => (
                <div key={b.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-body text-[10px] bg-[#FFF3E0] text-[#E65100] rounded-full px-2 py-0.5 flex-shrink-0">
                        {b.category}
                      </span>
                      <Link
                        to={`/admin/listings/${b.id}/edit`}
                        className="font-body font-medium text-sm text-[#0A0A0A] hover:underline truncate"
                      >
                        {b.title}
                      </Link>
                    </div>
                    <a
                      href={b.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-xs text-[#5847E0] hover:underline flex items-center gap-1 truncate"
                    >
                      {b.link} <ExternalLink size={11} className="flex-shrink-0" />
                    </a>
                    <p className="font-body text-xs text-[#C62828] mt-1">{b.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!linkRunning && linksChecked > 0 && brokenLinks.length === 0 && (
            <div className="font-body text-sm text-[#1B5E20] flex items-center gap-2">
              <CheckCircle2 size={16} /> All outbound listing links are reachable.
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
