import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, ChevronDown, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import SkeletonCard from '@/components/SkeletonCard';
import ListingCardImage from '@/components/ListingCardImage';
import useSavedListings from '@/hooks/useSavedListings';

const ITEMS_PER_PAGE = 12;

const categoryOptions = ['All', 'Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'];
const locationOptions = ['All Victoria', 'Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Gippsland', 'Shepparton', 'Online', 'Regional Victoria'];

const categoryRoutes: Record<string, string> = {
  Events: '/events',
  Jobs: '/jobs',
  Grants: '/grants',
  Programs: '/programs',
  Wellbeing: '/wellbeing',
};

interface Listing {
  id: string;
  title: string;
  organisation: string;
  location: string;
  description: string;
  link: string;
  image_url: string | null;
  source: string;
  created_at: string;
  expiry_date: string | null;
  category: string;
}

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getDateDisplay(listing: Listing) {
  if (listing.category === 'Events' && listing.expiry_date) return formatDate(listing.expiry_date);
  if (listing.category === 'Jobs') return `Posted ${daysAgo(listing.created_at)}`;
  if (listing.category === 'Grants' && listing.expiry_date) return `Closes ${formatDate(listing.expiry_date)}`;
  if (listing.expiry_date) return formatDate(listing.expiry_date);
  return null;
}

function getUrgencyLabel(listing: Listing) {
  if (!listing.expiry_date || listing.category === 'Wellbeing') return null;
  const days = Math.ceil((new Date(listing.expiry_date).getTime() - Date.now()) / 86400000);
  if (days < 0) return null;
  if (days <= 7) return 'Closing soon';
  if (days <= 30) return 'Closes this month';
  return null;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isSaved, toggleSave } = useSavedListings();

  const initialQ = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || 'All';
  const initialLocation = searchParams.get('location') || '';
  const initialDate = searchParams.get('date') || 'any';

  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [sort, setSort] = useState<'newest' | 'closing' | 'az'>('newest');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    supabase
      .from('listings')
      .select('id, title, organisation, location, description, link, image_url, source, created_at, expiry_date, category')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings((data as Listing[]) || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedLocation) params.location = selectedLocation;
    if (dateFilter !== 'any') params.date = dateFilter;
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedCategory, selectedLocation, dateFilter, setSearchParams]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [debouncedQuery, selectedCategory, selectedLocation, dateFilter, sort]);

  const filtered = useMemo(() => {
    let result = listings;
    if (selectedCategory !== 'All') {
      result = result.filter(l => l.category === selectedCategory);
    }
    if (selectedLocation) {
      const loc = selectedLocation.toLowerCase();
      result = result.filter(l => l.location.toLowerCase().includes(loc));
    }
    if (dateFilter !== 'any') {
      const now = Date.now();
      const limitDays = dateFilter === 'week' ? 7 : dateFilter === 'month' ? 30 : 90;
      result = result.filter(l => {
        if (!l.expiry_date) return dateFilter === 'ongoing';
        const diffDays = Math.ceil((new Date(l.expiry_date).getTime() - now) / 86400000);
        return diffDays >= 0 && diffDays <= limitDays;
      });
    }
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.organisation.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      );
    }
    if (sort === 'closing') {
      result = [...result].sort((a, b) => {
        const aTime = a.expiry_date ? new Date(a.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.expiry_date ? new Date(b.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
    } else if (sort === 'az') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [listings, debouncedQuery, selectedCategory, selectedLocation, dateFilter, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const relatedBrowseLinks = selectedCategory !== 'All'
    ? Object.entries(categoryRoutes).filter(([cat]) => cat !== selectedCategory).slice(0, 3)
    : Object.entries(categoryRoutes).slice(0, 4);

  // Build a normalized canonical URL for /search to prevent duplicate
  // indexing across param order, casing, or filter combinations.
  // Rules:
  //  - Empty/All filters    → canonical to /search
  //  - Only a category      → canonical to that category's dedicated page (/events, /jobs, …)
  //  - Otherwise            → /search?<allow-listed params, sorted, lowercased>
  // Note: `q` (free-text) is intentionally excluded from the canonical so
  // arbitrary text queries collapse to the same canonical surface.
  const canonicalUrl = useMemo(() => {
    const base = 'https://www.whatsonyouth.org.au';
    const cat = selectedCategory !== 'All' ? selectedCategory : '';
    const loc = selectedLocation.trim();
    if (cat && !loc && categoryRoutes[cat]) {
      return `${base}${categoryRoutes[cat]}`;
    }
    const allowed: Array<[string, string]> = [];
    if (cat) allowed.push(['category', cat.toLowerCase()]);
    if (loc) allowed.push(['location', loc.toLowerCase()]);
    allowed.sort(([a], [b]) => a.localeCompare(b));
    const qs = allowed.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return qs ? `${base}/search?${qs}` : `${base}/search`;
  }, [selectedCategory, selectedLocation]);

  // Dynamic title / description / H1 driven by the active category + location filters.
  // This gives Google a clear, distinct page context for filter combinations like
  // "Jobs in Geelong" or "Grants in Melbourne" without indexing arbitrary `q` text.
  const { pageTitle, metaDescription, h1, h1Subtext } = useMemo(() => {
    const cat = selectedCategory !== 'All' ? selectedCategory : '';
    const loc = selectedLocation.trim();
    const catLower = cat ? cat.toLowerCase() : 'opportunities';

    if (cat && loc) {
      return {
        pageTitle: `${cat} in ${loc} for Young People — What's On Youth`,
        metaDescription: `Browse free ${catLower} in ${loc} for young Victorians aged 15–25. Updated regularly on What's On Youth.`,
        h1: `${cat} in ${loc}`,
        h1Subtext: `Free ${catLower} for young people in ${loc}.`,
      };
    }
    if (cat) {
      return {
        pageTitle: `${cat} for Young People in Victoria — What's On Youth`,
        metaDescription: `Browse free ${catLower} for young Victorians aged 15–25 across Melbourne, Geelong, Ballarat, Bendigo and regional Victoria.`,
        h1: `${cat} for young Victorians`,
        h1Subtext: `Free ${catLower} across Victoria, all in one place.`,
      };
    }
    if (loc) {
      return {
        pageTitle: `Youth Opportunities in ${loc} — What's On Youth`,
        metaDescription: `Free events, jobs, grants, programs and wellbeing support for young people aged 15–25 in ${loc}.`,
        h1: `Opportunities in ${loc}`,
        h1Subtext: `Events, jobs, grants and support for young people in ${loc}.`,
      };
    }
    return {
      pageTitle: "Search Events, Jobs, Grants & Youth Opportunities in Victoria — What's On Youth",
      metaDescription: "Search thousands of free events, entry-level jobs, grants, youth programs and wellbeing resources across Victoria. Find opportunities in Melbourne, Geelong, Ballarat, Bendigo and regional Victoria for young people aged 15–25.",
      h1: 'Find your opportunity',
      h1Subtext: 'Search across events, jobs, grants, programs, and wellbeing support — all in one place.',
    };
  }, [selectedCategory, selectedLocation]);

  return (
    <>
      <SEO
        title={pageTitle}
        description={metaDescription}
        ogUrl={canonicalUrl}
        canonical={canonicalUrl}
      />
      <Navbar />

      <section className="bg-brand-dark px-6 py-10 md:px-16 md:py-14">
        <div className="max-w-[680px] mx-auto text-center">
          <h1 className="font-heading font-bold text-[36px] md:text-[44px] text-white leading-[1.15] mb-2">
            {h1}
          </h1>
          <p className="font-body text-base text-brand-footer-link mb-8">
            {h1Subtext}
          </p>

          <div className="relative w-full max-w-[680px] mx-auto">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <label htmlFor="main-search" className="sr-only">Search opportunities</label>
            <input
              ref={inputRef}
              id="main-search"
              type="text"
              placeholder="Search for opportunities..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-white rounded-xl py-4 pl-[52px] pr-5 font-body text-[16px] md:text-base text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-violet"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categoryOptions.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`font-body font-medium text-[13px] rounded-full px-3 py-1.5 md:px-4 border transition-colors duration-100 min-h-[44px] ${
                  selectedCategory === cat
                    ? 'bg-brand-violet border-brand-violet text-white'
                    : 'bg-transparent border-[#333333] text-brand-footer-link hover:border-brand-footer-link'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-8 md:px-16 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p className="font-body text-sm text-brand-text-secondary">
              {debouncedQuery.trim()
                ? `Showing ${filtered.length} results for '${debouncedQuery}'`
                : `${filtered.length} opportunities available`}
            </p>
          </div>

          <div className="sticky top-0 z-10 bg-white border border-brand-card-border rounded-xl p-3 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <label className="sr-only" htmlFor="location-filter">Location</label>
              <select
                id="location-filter"
                value={selectedLocation || 'All Victoria'}
                onChange={e => setSelectedLocation(e.target.value === 'All Victoria' ? '' : e.target.value)}
                className="w-full appearance-none border border-brand-input-border rounded-lg py-2.5 pl-3.5 pr-9 font-body text-[16px] md:text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white min-h-[44px]"
              >
                {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="date-filter">Date</label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full appearance-none border border-brand-input-border rounded-lg py-2.5 pl-3.5 pr-9 font-body text-[16px] md:text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white min-h-[44px]"
              >
                <option value="any">Any date</option>
                <option value="week">Closing this week</option>
                <option value="month">Closing this month</option>
                <option value="quarter">Next 90 days</option>
                <option value="ongoing">Ongoing only</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as any)}
                className="w-full sm:w-auto appearance-none border border-brand-input-border rounded-lg py-2.5 pl-3.5 pr-9 font-body text-[16px] md:text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white min-h-[44px]"
              >
                <option value="newest">Newest first</option>
                <option value="closing">Closing soon</option>
                <option value="az">A–Z</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search size={48} className="text-brand-disabled mb-4" />
              <h2 className="font-heading font-bold text-[20px] text-brand-text-primary mb-2">No results found</h2>
              <p className="font-body text-[15px] text-brand-text-muted text-center max-w-md mb-6">
                Try different keywords or browse by category below.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(categoryRoutes).map(([cat, route]) => (
                  <Link
                    key={cat}
                    to={route}
                    className="font-body font-medium text-[13px] rounded-full px-5 py-2 border border-brand-card-border text-brand-text-secondary hover:border-brand-violet hover:text-brand-violet transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map(listing => {
                  const dateDisplay = getDateDisplay(listing);
                  const urgencyLabel = getUrgencyLabel(listing);
                  return (
                    <div
                      key={listing.id}
                      role="article"
                      className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:opacity-90"
                    >
                      <Link to={`/listings/${listing.id}`} className="block">
                        <div className="w-full h-40 relative">
                          <ListingCardImage
                            listingId={listing.id}
                            imageUrl={listing.image_url}
                            title={listing.title}
                            category={listing.category}
                            link={listing.link}
                            className="w-full h-40"
                          />
                          <span className="absolute bottom-2.5 left-2.5 bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">
                            {listing.category}
                          </span>
                          {urgencyLabel && (
                            <span className="absolute top-2.5 left-2.5 bg-brand-coral text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">
                              {urgencyLabel}
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave({ id: listing.id, title: listing.title, category: listing.category, organisation: listing.organisation, location: listing.location }); }}
                            className="absolute top-2.5 right-2.5 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                            aria-label={isSaved(listing.id) ? 'Unsave listing' : 'Save listing'}
                          >
                            <Heart size={18} className={isSaved(listing.id) ? 'fill-red-400 text-red-400' : 'text-white/60'} />
                          </button>
                        </div>
                      </Link>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="font-body text-xs text-brand-text-muted uppercase tracking-[0.04em] mb-1.5">
                          {listing.organisation}
                        </p>
                        <Link to={`/listings/${listing.id}`}>
                          <h3 className="font-heading font-bold text-[16px] text-brand-text-primary leading-[1.3] mb-2 line-clamp-2">
                            {listing.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1.5 font-body text-[13px] text-brand-text-secondary mb-1">
                          <MapPin size={13} className="flex-shrink-0" />
                          <span>{listing.location}</span>
                        </div>
                        {dateDisplay && (
                          <div className="flex items-center gap-1.5 font-body text-xs text-brand-text-muted mb-1">
                            <Calendar size={12} className="flex-shrink-0" />
                            <span>{dateDisplay}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="bg-brand-section-alt text-brand-text-muted font-body text-[10px] rounded-full px-2 py-0.5">{listing.location}</span>
                          {listing.expiry_date ? (
                            <span className="bg-brand-violet-surface text-brand-violet font-body text-[10px] rounded-full px-2 py-0.5">Has deadline</span>
                          ) : (
                            <span className="bg-brand-section-alt text-brand-text-muted font-body text-[10px] rounded-full px-2 py-0.5">Ongoing</span>
                          )}
                        </div>
                        {listing.description && (
                          <p className="font-body text-[13px] text-brand-text-muted line-clamp-2 mb-3">
                            {listing.description.replace(/^\[Link needs review\]\s*/i, '')}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          {listing.source !== 'user' ? (
                            <span className="bg-[#E6F1FB] text-[#0C447C] font-body text-[10px] rounded-full px-2 py-0.5 truncate max-w-[60%]">
                              By {listing.organisation}
                            </span>
                          ) : (
                            <span className="bg-brand-section-alt text-brand-text-muted font-body text-[10px] rounded-full px-2 py-0.5">
                              Submitted by community
                            </span>
                          )}
                          <span className="font-body font-medium text-[13px] text-brand-violet ml-auto">
                            View details →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setVisibleCount(c => c + ITEMS_PER_PAGE)}
                    className="bg-white border border-brand-card-border text-brand-text-primary font-body font-medium text-[15px] rounded-lg px-8 py-3 hover:bg-brand-section-alt transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}

              <div className="mt-12 border-t border-brand-card-border pt-8">
                <p className="font-heading font-bold text-[18px] text-brand-text-primary mb-3">Keep exploring</p>
                <div className="flex flex-wrap gap-2">
                  {relatedBrowseLinks.map(([cat, route]) => (
                    <Link
                      key={cat}
                      to={route}
                      className="font-body font-medium text-[13px] rounded-full px-4 py-2 border border-brand-card-border text-brand-text-secondary hover:border-brand-violet hover:text-brand-violet transition-colors min-h-[44px] flex items-center"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
