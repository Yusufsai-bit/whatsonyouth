import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ITEMS_PER_PAGE = 12;

const categoryConfig: Record<string, {
  label: string;
  heading: string;
  subtext: string;
  placeholderColor: string;
}> = {
  Events: {
    label: 'Events',
    heading: 'Events in Victoria',
    subtext: "Discover what's happening across Victoria",
    placeholderColor: '#2D1B69',
  },
  Jobs: {
    label: 'Jobs',
    heading: 'Jobs and internships',
    subtext: 'Find work, internships, and career opportunities',
    placeholderColor: '#1A2A4A',
  },
  Grants: {
    label: 'Grants',
    heading: 'Grants and funding',
    subtext: 'Funding opportunities for young Victorians',
    placeholderColor: '#1A3A2A',
  },
  Programs: {
    label: 'Programs',
    heading: 'Programs and courses',
    subtext: 'Courses, programs, and development opportunities',
    placeholderColor: '#2D1B4A',
  },
  Wellbeing: {
    label: 'Wellbeing',
    heading: 'Wellbeing and support',
    subtext: 'Support services and wellbeing resources',
    placeholderColor: '#2A1A3A',
  },
};

const locations = [
  'All Victoria', 'Melbourne', 'Ballarat', 'Bendigo', 'Geelong',
  'Gippsland', 'Shepparton', 'Mildura', 'Wodonga', 'Warrnambool',
  'Frankston', 'Online', 'Regional Victoria',
];

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

export default function CategoryListingPage({ category }: { category: string }) {
  const config = categoryConfig[category];
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Victoria');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    setSearch('');
    setLocationFilter('All Victoria');
    setSort('newest');
    setVisibleCount(ITEMS_PER_PAGE);
    setLoading(true);

    supabase
      .from('listings')
      .select('id, title, organisation, location, description, link, image_url, source, created_at, expiry_date, category')
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings((data as Listing[]) || []);
        setLoading(false);
      });
  }, [category]);

  const filtered = useMemo(() => {
    let result = listings;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.organisation.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      );
    }

    if (locationFilter !== 'All Victoria') {
      result = result.filter(l =>
        l.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (sort === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort === 'az') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    // newest is default order from DB

    return result;
  }, [listings, search, locationFilter, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const hasFilters = search.trim() !== '' || locationFilter !== 'All Victoria';

  function getDateDisplay(listing: Listing) {
    if (category === 'Events' && listing.expiry_date) return formatDate(listing.expiry_date);
    if (category === 'Jobs') return `Posted ${daysAgo(listing.created_at)}`;
    if (category === 'Grants' && listing.expiry_date) return `Closes ${formatDate(listing.expiry_date)}`;
    if (listing.expiry_date) return formatDate(listing.expiry_date);
    return null;
  }

  return (
    <>
      <Navbar />

      {/* Page header */}
      <section className="bg-brand-section-alt px-6 py-8 md:px-16 md:py-12">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <span className="inline-block bg-brand-violet-surface text-brand-violet font-body font-medium text-xs rounded-full px-3 py-1 mb-3">
              {config.label}
            </span>
            <h1 className="text-[32px] md:text-[40px] leading-[1.15] tracking-[-0.02em] text-brand-text-primary">
              {config.heading}
            </h1>
            <p className="font-body text-base text-brand-text-secondary mt-2">{config.subtext}</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="font-heading font-bold text-[32px] text-brand-text-primary">
              {loading ? '–' : listings.length}
              <span className="font-body font-normal text-base text-brand-text-secondary ml-2">
                opportunities
              </span>
            </p>
            <p className="font-body text-[13px] text-brand-text-muted mt-0.5">updated regularly</p>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-brand-card-border px-6 py-4 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-[360px] min-w-[180px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder={`Search ${config.label.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-brand-input-border rounded-lg py-2.5 pl-10 pr-3.5 font-body text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet"
            />
          </div>

          {/* Location filter */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="appearance-none border border-brand-input-border rounded-lg py-2.5 pl-3.5 pr-9 font-body text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white"
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="appearance-none border border-brand-input-border rounded-lg py-2.5 pl-3.5 pr-9 font-body text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">A–Z</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
          </div>

          {/* Count */}
          <p className="font-body text-[13px] text-brand-text-muted ml-auto hidden sm:block">
            Showing {visible.length} of {filtered.length} listings
          </p>
        </div>
      </div>

      {/* Listings grid */}
      <section className="bg-white px-6 py-10 md:px-16 md:py-10">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-brand-section-alt rounded-xl h-[320px] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search size={48} className="text-brand-disabled mb-4" />
              <h2 className="font-heading font-bold text-[20px] text-brand-text-primary mb-2">No listings found</h2>
              <p className="font-body text-[15px] text-brand-text-muted text-center max-w-md">
                {hasFilters
                  ? 'Try adjusting your search or filters to find what you\u2019re looking for.'
                  : `No ${config.label.toLowerCase()} listings yet — check back soon or submit one yourself.`}
              </p>
              {!hasFilters && (
                <Link
                  to="/submit"
                  className="mt-6 bg-brand-coral text-white font-heading font-bold text-sm rounded-lg px-6 py-3 transition-colors hover:bg-brand-coral-light"
                >
                  Submit a listing
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map(listing => {
                  const dateDisplay = getDateDisplay(listing);
                  return (
                    <div
                      key={listing.id}
                      onClick={() => navigate(`/listings/${listing.id}`)}
                      className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer"
                    >
                      {/* Image area */}
                      <div className="w-full h-40 relative" style={{ backgroundColor: config.placeholderColor }}>
                        {listing.image_url && (
                          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-2.5 left-2.5 bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">
                          {listing.category}
                        </span>
                      </div>

                      {/* Body */}
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
