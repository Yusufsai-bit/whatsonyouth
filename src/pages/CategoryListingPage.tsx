import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, ChevronDown, Heart, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import SkeletonCard from '@/components/SkeletonCard';
import ListingCardImage from '@/components/ListingCardImage';
import useSavedListings from '@/hooks/useSavedListings';

const categoryColors: Record<string, string> = {
  Events: '#2D1B69',
  Jobs: '#1A2A4A',
  Grants: '#1A3A2A',
  Programs: '#2D1B4A',
  Wellbeing: '#2A1A3A',
};

const locations = [
  'All Victoria', 'Melbourne CBD', 'Inner Melbourne', 'Northern Melbourne',
  'Western Melbourne', 'Eastern Melbourne', 'South-East Melbourne', 'Geelong',
  'Ballarat', 'Bendigo', 'Gippsland', 'Shepparton', 'Mildura', 'Warrnambool',
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

const ITEMS_PER_PAGE = 12;

const categoryConfig: Record<string, {
  label: string;
  heading: string;
  subtext: string;
  placeholderColor: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
}> = {
  Events: {
    label: 'Events',
    heading: 'Free Events for Young People in Victoria',
    subtext: 'Concerts, festivals, workshops and more — updated weekly',
    placeholderColor: '#2D1B69',
    seoTitle: "Free Events for Young People in Victoria — What's On Youth",
    seoDescription: "Find free and low-cost events for young people aged 15–25 across Victoria. Concerts, festivals, workshops, art exhibitions, sports events and more in Melbourne, Geelong, Ballarat, Bendigo and regional Victoria. Updated weekly.",
    slug: 'events',
  },
  Jobs: {
    label: 'Jobs',
    heading: 'Jobs and Internships for Young Victorians',
    subtext: 'Entry-level, part-time and casual work for ages 15–25',
    placeholderColor: '#1A2A4A',
    seoTitle: "Entry Level Jobs & Internships for Young People in Victoria — What's On Youth",
    seoDescription: "Find part-time jobs, casual work, internships, apprenticeships and traineeships for young people aged 15–25 in Victoria. No experience required. Melbourne, regional Victoria and online opportunities.",
    slug: 'jobs',
  },
  Grants: {
    label: 'Grants',
    heading: 'Grants and Scholarships for Young Victorians',
    subtext: 'Free funding opportunities — arts, community, education and more',
    placeholderColor: '#1A3A2A',
    seoTitle: "Grants & Scholarships for Young Victorians — What's On Youth",
    seoDescription: "Find grants, scholarships, bursaries and funding opportunities for young people aged 15–25 in Victoria. Arts grants, community grants, education funding, youth leadership awards and more. Free to apply.",
    slug: 'grants',
  },
  Programs: {
    label: 'Programs',
    heading: 'Youth Programs and Courses in Victoria',
    subtext: 'Free and low-cost programs, workshops and leadership opportunities',
    placeholderColor: '#2D1B4A',
    seoTitle: "Youth Programs & Courses in Victoria — What's On Youth",
    seoDescription: "Discover free and low-cost youth programs, leadership courses, volunteering opportunities, skill development workshops and community programs for young people aged 15–25 across Victoria.",
    slug: 'programs',
  },
  Wellbeing: {
    label: 'Wellbeing',
    heading: 'Mental Health and Wellbeing Support',
    subtext: 'Free support services for young Victorians aged 15–25',
    placeholderColor: '#2A1A3A',
    seoTitle: "Mental Health & Wellbeing Support for Young People in Victoria — What's On Youth",
    seoDescription: "Find free mental health support, counselling services, youth wellbeing programs and crisis resources for young Victorians aged 15–25. Includes services in Melbourne, Geelong, Ballarat, Bendigo and online.",
    slug: 'wellbeing',
  },
};

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
  const { isSaved, toggleSave } = useSavedListings();

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
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        ogUrl={`https://www.whatsonyouth.org.au/${config.slug}`}
        canonical={`https://www.whatsonyouth.org.au/${config.slug}`}
      />
      <Navbar />

      {/* Page header */}
      <section className="bg-brand-section-alt px-6 py-6 md:px-16 md:py-12">
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
            <p className="font-heading font-bold text-2xl text-brand-text-primary">
              {filtered.length}
              <span className="font-body font-normal text-sm text-brand-text-muted ml-1">
                opportunities
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-brand-card-border px-6 py-4 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
            <div className="relative flex-1 md:max-w-[360px] min-w-[180px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder={`Search ${config.label.toLowerCase()}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && search.trim()) {
                    navigate(`/search?q=${encodeURIComponent(search.trim())}&category=${category}`);
                  }
                }}
                className="w-full border border-brand-input-border rounded-lg py-2.5 pl-10 pr-3.5 font-body text-[16px] md:text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet min-h-[44px]"
              />
            </div>
            <div className="flex gap-3 flex-1 md:flex-none">
              <div className="relative flex-1 md:flex-none">
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="w-full md:w-auto appearance-none border border-brand-input-border rounded-lg py-2.5 pl-3.5 pr-9 font-body text-[16px] md:text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white min-h-[44px]"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
              </div>
              <div className="relative flex-1 md:flex-none">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as any)}
                  className="w-full md:w-auto appearance-none border border-brand-input-border rounded-lg py-2.5 pl-3.5 pr-9 font-body text-[16px] md:text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white min-h-[44px]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="az">A–Z</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
              </div>
            </div>
            <p className="font-body text-[13px] text-brand-text-muted ml-auto hidden md:block">
              Showing {visible.length} of {filtered.length} listings
            </p>
          </div>
          <p className="font-body text-xs text-brand-text-muted md:hidden mt-2">
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Listings grid */}
      <section className="bg-white px-6 py-10 md:px-16 md:py-10">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search size={48} className="text-brand-disabled mb-4" />
              {!hasFilters && category === 'Jobs' ? (
                <>
                  <h2 className="font-heading font-bold text-[20px] text-brand-text-primary mb-2">No jobs listed yet</h2>
                  <p className="font-body text-[15px] text-brand-text-muted text-center max-w-md mb-6">
                    We're building this out. In the meantime, try these trusted job boards for young Victorians:
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    <a href="https://www.seek.com.au/jobs/in-Victoria" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-body font-medium text-[13px] rounded-full px-5 py-2 border border-brand-card-border text-brand-text-secondary hover:border-brand-violet hover:text-brand-violet transition-colors">
                      Search on SEEK <ExternalLink size={12} />
                    </a>
                    <a href="https://www.youthcentral.vic.gov.au/jobs-and-careers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-body font-medium text-[13px] rounded-full px-5 py-2 border border-brand-card-border text-brand-text-secondary hover:border-brand-violet hover:text-brand-violet transition-colors">
                      Youth Central Jobs <ExternalLink size={12} />
                    </a>
                    <a href="https://www.ethicaljobs.com.au" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-body font-medium text-[13px] rounded-full px-5 py-2 border border-brand-card-border text-brand-text-secondary hover:border-brand-violet hover:text-brand-violet transition-colors">
                      Ethical Jobs <ExternalLink size={12} />
                    </a>
                  </div>
                  <Link
                    to="/submit"
                    className="bg-brand-coral text-white font-heading font-bold text-sm rounded-lg px-6 py-3 transition-colors hover:bg-brand-coral-light min-h-[44px]"
                  >
                    Submit a listing
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="font-heading font-bold text-[20px] text-brand-text-primary mb-2">No listings found</h2>
                  <p className="font-body text-[15px] text-brand-text-muted text-center max-w-md">
                    {hasFilters
                      ? 'Try adjusting your search or filters to find what you\u2019re looking for.'
                      : `No ${config.label.toLowerCase()} listings yet — check back soon or submit one yourself.`}
                  </p>
                  {!hasFilters && (
                    <Link
                      to="/submit"
                      className="mt-6 bg-brand-coral text-white font-heading font-bold text-sm rounded-lg px-6 py-3 transition-colors hover:bg-brand-coral-light min-h-[44px]"
                    >
                      Submit a listing
                    </Link>
                  )}
                </>
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
                        {listing.description && (
                          <p className="font-body text-[13px] text-brand-text-muted line-clamp-2 mb-3">
                            {listing.description.replace(/^\[Link needs review\]\s*/i, '')}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          {listing.source !== 'user' ? (
                            <span className="bg-[#E6F1FB] text-[#0C447C] font-body text-[10px] rounded-full px-2 py-0.5">
                              Curated by WOY
                            </span>
                          ) : (
                            <span className="bg-brand-section-alt text-brand-text-muted font-body text-[10px] rounded-full px-2 py-0.5">
                              Submitted by community
                            </span>
                          )}
                          <span className="font-body font-medium text-[13px] text-brand-violet ml-auto min-h-[44px] flex items-center">
                            View details →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="flex flex-col items-center mt-10 gap-3">
                  <p className="font-body text-sm text-brand-text-muted">
                    Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} listings
                  </p>
                  <button
                    onClick={() => setVisibleCount(c => c + ITEMS_PER_PAGE)}
                    className="w-full sm:w-auto bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-heading font-bold text-sm rounded-lg px-8 py-3 hover:bg-[#F7F7F7] transition-colors min-h-[48px]"
                  >
                    Load more {category.toLowerCase()}
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
