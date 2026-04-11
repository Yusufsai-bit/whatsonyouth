import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import SkeletonCard from '@/components/SkeletonCard';
import { getListingImage } from '@/lib/listing-image';

const ITEMS_PER_PAGE = 12;

const categoryOptions = ['All', 'Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'];

const categoryColors: Record<string, string> = {
  Events: '#2D1B69',
  Jobs: '#1A2A4A',
  Grants: '#1A3A2A',
  Programs: '#2D1B4A',
  Wellbeing: '#2A1A3A',
};

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

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQ = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || 'All';

  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [sort, setSort] = useState<'newest' | 'az'>('newest');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch all active listings once
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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedCategory, setSearchParams]);

  // Reset visible count on filter change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [debouncedQuery, selectedCategory, sort]);

  const filtered = useMemo(() => {
    let result = listings;

    if (selectedCategory !== 'All') {
      result = result.filter(l => l.category === selectedCategory);
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

    if (sort === 'az') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [listings, debouncedQuery, selectedCategory, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <>
      <SEO
        title="Search Opportunities \u2014 What's On Youth"
        description="Search across events, jobs, grants, programs, and wellbeing support for young Victorians."
        ogUrl="https://www.whatsonyouth.org.au/search"
        canonical="https://www.whatsonyouth.org.au/search"
      />
      <Navbar />

      {/* Search hero */}
      <section className="bg-brand-dark px-6 py-10 md:px-16 md:py-14">
        <div className="max-w-[680px] mx-auto text-center">
          <h1 className="font-heading font-bold text-[36px] md:text-[44px] text-white leading-[1.15] mb-2">
            Find your opportunity
          </h1>
          <p className="font-body text-base text-brand-footer-link mb-8">
            Search across events, jobs, grants, programs, and wellbeing support — all in one place.
          </p>

          {/* Search input */}
          <div className="relative w-full max-w-[680px] mx-auto">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for opportunities..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-white rounded-xl py-4 pl-[52px] pr-5 font-body text-base text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-violet"
            />
          </div>

          {/* Category pills */}
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

      {/* Results */}
      <section className="bg-white px-6 py-8 md:px-16 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Results header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <p className="font-body text-sm text-brand-text-secondary">
              {debouncedQuery.trim()
                ? `Showing ${filtered.length} results for \u2018${debouncedQuery}\u2019`
                : `${filtered.length} opportunities available`}
            </p>
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as any)}
                className="appearance-none border border-brand-input-border rounded-lg py-2.5 pl-3.5 pr-9 font-body text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white"
              >
                <option value="newest">Newest first</option>
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
                  const color = categoryColors[listing.category] || '#2D1B69';
                  return (
                    <div
                      key={listing.id}
                      onClick={() => navigate(`/listings/${listing.id}`)}
                      className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div className="w-full h-40 relative" style={{ backgroundColor: color }}>
                        {listing.image_url && (
                          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-2.5 left-2.5 bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">
                          {listing.category}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="font-body text-xs text-brand-text-muted uppercase tracking-[0.04em] mb-1.5">
                          {listing.organisation}
                        </p>
                        <h3 className="font-heading font-bold text-[16px] text-brand-text-primary leading-[1.3] mb-2 line-clamp-2">
                          {listing.title}
                        </h3>
                        <div className="flex items-center gap-1.5 font-body text-[13px] text-brand-text-secondary mb-1">
                          <MapPin size={13} className="flex-shrink-0" />
                          <span>{listing.location}</span>
                        </div>
                        {dateDisplay && (
                          <div className="flex items-center gap-1.5 font-body text-xs text-brand-text-muted mb-3">
                            <Calendar size={12} className="flex-shrink-0" />
                            <span>{dateDisplay}</span>
                          </div>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          {listing.source === 'user' && (
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
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
