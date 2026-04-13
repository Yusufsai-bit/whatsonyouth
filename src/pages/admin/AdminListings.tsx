import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { StatusBadge, SourceBadge } from '@/pages/admin/AdminDashboard';
import { Pencil, Trash2, Star, AlertCircle, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface Listing {
  id: string;
  title: string;
  organisation: string;
  category: string;
  source: string;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
  created_at: string;
  expiry_date: string | null;
}

const ITEMS_PER_PAGE = 25;

export default function AdminListings() {
  const [searchParams] = useSearchParams();
  const userFilter = searchParams.get('user_id') || '';
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveProgress, setResolveProgress] = useState({ current: 0, total: 0, ogCount: 0, unsplashCount: 0, pendingCount: 0 });
  const fetchListings = async () => {
    let query = supabase
      .from('listings')
      .select('id, title, organisation, category, source, is_active, is_featured, image_url, created_at, expiry_date')
      .order('created_at', { ascending: false });
    if (userFilter) query = query.eq('user_id', userFilter);
    const { data } = await query;
    if (data) setListings(data as Listing[]);
  };

  useEffect(() => { fetchListings(); }, [userFilter]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return listings.filter(l => {
      if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.organisation.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && l.category !== categoryFilter) return false;
      if (statusFilter === 'active' && !l.is_active) return false;
      if (statusFilter === 'inactive' && l.is_active) return false;
      if (sourceFilter && l.source !== sourceFilter) return false;
      if (expiryFilter === 'expired' && (!l.expiry_date || l.expiry_date >= today)) return false;
      if (expiryFilter === 'active' && l.expiry_date && l.expiry_date < today) return false;
      if (expiryFilter === 'expiring') {
        if (!l.expiry_date) return false;
        const d = new Date(l.expiry_date);
        const week = new Date();
        week.setDate(week.getDate() + 7);
        if (d < new Date() || d > week) return false;
      }
      return true;
    });
  }, [listings, search, categoryFilter, statusFilter, sourceFilter, expiryFilter]);

  const pendingDrafts = useMemo(() => 
    listings.filter(l => 
      !l.is_active && 
      (l.source === 'admin' || l.source === 'ai_scan')
    ), 
    [listings]
  );

  const showDrafts = () => {
    setStatusFilter('inactive');
    setSourceFilter('');
    setCategoryFilter('');
    setSearch('');
    setExpiryFilter('');
    setPage(1);
  };

  const activateAllDrafts = async () => {
    const ids = pendingDrafts.map(l => l.id);
    for (const id of ids) {
      await supabase.from('listings').update({ is_active: true }).eq('id', id);
    }
    toast.success(`${ids.length} draft listings published`);
    fetchListings();
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('listings').update({ is_active: !current }).eq('id', id);
    toast(current ? 'Listing deactivated' : 'Listing activated');
    fetchListings();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('listings').update({ is_featured: !current }).eq('id', id);
    toast(current ? 'Removed from featured' : 'Added to featured');
    fetchListings();
  };

  const deleteListing = async () => {
    if (!deleteId) return;
    await supabase.from('listings').delete().eq('id', deleteId);
    toast('Listing deleted');
    setDeleteId(null);
    setSelected(prev => { const n = new Set(prev); n.delete(deleteId); return n; });
    fetchListings();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(l => l.id)));
  };

  const bulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const ids = Array.from(selected);
    if (action === 'delete') {
      for (const id of ids) await supabase.from('listings').delete().eq('id', id);
      toast('Selected listings deleted');
    } else {
      const val = action === 'activate';
      for (const id of ids) await supabase.from('listings').update({ is_active: val }).eq('id', id);
      toast(val ? 'Selected listings activated' : 'Selected listings deactivated');
    }
    setSelected(new Set());
    fetchListings();
  };

  const clearFilters = () => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); setSourceFilter(''); setExpiryFilter(''); setPage(1); };

  const resolveImages = async () => {
    const { data: missing } = await supabase
      .from('listings')
      .select('id, title, category, link')
      .or('image_url.is.null,image_url.eq.')
      .eq('is_active', true);
    if (!missing || missing.length === 0) {
      toast.info('All listings already have images');
      return;
    }
    if (!confirm(`${missing.length} listings need images. Resolve now?`)) return;
    setResolving(true);
    setResolveProgress({ current: 0, total: missing.length, ogCount: 0, unsplashCount: 0, pendingCount: 0 });
    let og = 0, unsplash = 0, pending = 0;
    for (let i = 0; i < missing.length; i++) {
      const l = missing[i];
      try {
        const { data } = await supabase.functions.invoke('resolve-listing-image', {
          body: { listing_id: l.id, listing_url: l.link, listing_title: l.title, category: l.category },
        });
        if (data?.source === 'og') og++;
        else if (data?.source === 'unsplash') unsplash++;
        else pending++;
      } catch {
        pending++;
      }
      setResolveProgress({ current: i + 1, total: missing.length, ogCount: og, unsplashCount: unsplash, pendingCount: pending });
      if (i < missing.length - 1) await new Promise(r => setTimeout(r, 600));
    }
    setResolving(false);
    toast.success(`Done — ${og + unsplash} images resolved, ${og} from og:image, ${unsplash} from Unsplash, ${pending} still pending`);
    fetchListings();
  };

  const inputClass = "border border-[#DDDDDD] rounded-lg px-3.5 py-2.5 font-body text-sm text-[#0A0A0A] focus:outline-none focus:border-[#5847E0] bg-white";

  const today = new Date().toISOString().split('T')[0];

  return (
    <AdminLayout>
      <AdminHeader title="Listings" />
      <div className="p-6 md:p-8 overflow-auto">
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input type="text" placeholder="Search title or organisation..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={`${inputClass} w-[260px]`} />
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">All categories</option>
            {['Events','Jobs','Grants','Programs','Wellbeing'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">All sources</option>
            <option value="user">User submitted</option>
            <option value="admin">Admin added</option>
            <option value="ai_scan">AI Scanner</option>
          </select>
          <select value={expiryFilter} onChange={e => { setExpiryFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">All expiry</option>
            <option value="expired">Expired</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring soon</option>
          </select>
          <button onClick={clearFilters} className="font-body text-[13px] text-[#5847E0] hover:underline">Clear filters</button>
        </div>

        {pendingDrafts.length > 0 && (
          <div className="bg-[#FFF8F0] border border-[#F5C68A] rounded-xl px-5 py-4 mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-[#D85A30] shrink-0" />
              <div>
                <p className="font-heading font-bold text-[15px] text-[#0A0A0A]">
                  {pendingDrafts.length} draft listing{pendingDrafts.length !== 1 ? 's' : ''} pending review
                </p>
                <p className="font-body text-[13px] text-[#555555]">
                  Scanned listings waiting to be reviewed and published.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={showDrafts}
                className="font-heading font-bold text-[13px] border-2 border-[#0A0A0A] text-[#0A0A0A] px-4 py-2 rounded-lg hover:bg-[#F7F7F7]"
              >
                Review drafts
              </button>
              <button
                onClick={activateAllDrafts}
                className="font-heading font-bold text-[13px] bg-[#D85A30] text-white px-4 py-2 rounded-lg hover:bg-[#C04E28]"
              >
                Publish all
              </button>
            </div>
          </div>
        )}


        {/* Batch image resolve */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl px-5 py-4 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ImageIcon size={20} className="text-[#5847E0] shrink-0" />
            <div>
              <p className="font-heading font-bold text-[15px] text-[#0A0A0A]">Resolve missing images</p>
              <p className="font-body text-[13px] text-[#555555]">
                Find and fix listings without images using og:image and Unsplash.
              </p>
            </div>
          </div>
          <button
            onClick={resolveImages}
            disabled={resolving}
            className="font-heading font-bold text-[13px] bg-[#5847E0] text-white px-4 py-2 rounded-lg hover:bg-[#4838C0] disabled:opacity-60"
          >
            {resolving ? `Resolving ${resolveProgress.current} of ${resolveProgress.total}...` : 'Resolve missing images'}
          </button>
        </div>
        {resolving && (
          <div className="mb-4">
            <Progress value={resolveProgress.total > 0 ? (resolveProgress.current / resolveProgress.total) * 100 : 0} className="h-2 bg-[#F0EEFF] [&>div]:bg-[#5847E0]" />
          </div>
        )}

        {selected.size > 0 && (
          <div className="bg-[#0A0A0A] text-white rounded-xl px-5 py-3 mb-4 flex items-center gap-4 flex-wrap">
            <span className="font-body text-sm">{selected.size} selected</span>
            <button onClick={() => bulkAction('activate')} className="font-body text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">Activate</button>
            <button onClick={() => bulkAction('activate')} className="font-body text-sm bg-[#1D9E75]/20 hover:bg-[#1D9E75]/30 text-[#4ADE80] px-3 py-1.5 rounded-lg">Publish selected</button>
            <button onClick={() => bulkAction('deactivate')} className="font-body text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">Deactivate</button>
            <button onClick={() => bulkAction('delete')} className="font-body text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg">Delete selected</button>
          </div>
        )}

        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7F7]">
                  <th className="px-4 py-3 w-10"><input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} className="accent-[#5847E0]" /></th>
                  <th className="px-3 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden md:table-cell">Image</th>
                  <th className="px-3 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Title</th>
                  <th className="px-3 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden lg:table-cell">Category</th>
                  <th className="px-3 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden md:table-cell">Source</th>
                  <th className="px-3 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Status</th>
                  <th className="px-3 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden md:table-cell">Featured</th>
                  <th className="px-3 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden lg:table-cell">Expires</th>
                  <th className="px-3 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((l, i) => (
                  <tr key={l.id} className={`h-14 ${i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                    <td className="px-4"><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)} className="accent-[#5847E0]" /></td>
                    <td className="px-3 hidden md:table-cell">
                      {l.image_url ? (
                        <img src={l.image_url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#F7F7F7]" />
                      )}
                    </td>
                    <td className="px-3">
                      <p className="font-body text-sm font-medium text-[#0A0A0A] truncate max-w-[200px]">{l.title}</p>
                      <p className="font-body text-xs text-[#888888] truncate max-w-[200px]">{l.organisation}</p>
                    </td>
                    <td className="px-3 hidden lg:table-cell">
                      <span className="inline-block bg-[#F0EEFF] text-[#5847E0] font-body text-xs font-medium px-2 py-0.5 rounded-full">{l.category}</span>
                    </td>
                    <td className="px-3 hidden md:table-cell"><SourceBadge source={l.source} /></td>
                    <td className="px-3">
                      <button onClick={() => toggleActive(l.id, l.is_active)} title={l.is_active ? 'Click to deactivate' : 'Click to activate'}>
                        <StatusBadge active={l.is_active} />
                      </button>
                    </td>
                    <td className="px-3 hidden md:table-cell">
                      <button onClick={() => toggleFeatured(l.id, l.is_featured)} title={l.is_featured ? 'Remove from featured' : 'Add to featured'}>
                        <Star size={18} className={l.is_featured ? 'fill-[#EF9F27] text-[#EF9F27]' : 'text-[#888888]'} />
                      </button>
                    </td>
                    <td className="px-3 hidden lg:table-cell">
                      {l.expiry_date ? (
                        <span className={`font-body text-xs ${l.expiry_date < today ? 'text-[#E24B4A]' : 'text-[#888888]'}`}>
                          {new Date(l.expiry_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="font-body text-xs text-[#888888]">No expiry</span>
                      )}
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        {!l.is_active && (
                          <button
                            onClick={() => toggleActive(l.id, false)}
                            className="font-body text-xs bg-[#1D9E75] text-white px-2.5 py-1 rounded-lg hover:bg-[#178a65] whitespace-nowrap"
                            title="Publish this listing"
                          >
                            Publish
                          </button>
                        )}
                        <Link to={`/admin/listings/${l.id}/edit`} className="text-[#888888] hover:text-[#5847E0]"><Pencil size={15} /></Link>
                        <button onClick={() => setDeleteId(l.id)} className="text-[#888888] hover:text-[#D85A30]"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={9} className="px-5 py-8 text-center font-body text-sm text-[#888888]">No listings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 py-4 border-t border-[#EBEBEB]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`font-body text-sm px-3 py-1 rounded-md ${p === page ? 'bg-[#5847E0] text-white' : 'text-[#888888] hover:bg-[#F7F7F7]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-[400px] w-full mx-4">
            <h2 className="font-heading font-bold text-xl text-[#0A0A0A]">Delete this listing?</h2>
            <p className="font-body text-[15px] text-[#555555] mt-3">This cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="flex-1 border-2 border-[#0A0A0A] text-[#0A0A0A] font-heading font-bold text-sm rounded-lg py-2.5">Cancel</button>
              <button onClick={deleteListing} className="flex-1 bg-[#E24B4A] text-white font-heading font-bold text-sm rounded-lg py-2.5">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
