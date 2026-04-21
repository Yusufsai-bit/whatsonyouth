import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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

interface IntroContent {
  body: string;
  tags: string[];
  crisis?: string;
}

interface FAQItemData {
  q: string;
  a: string;
}

const categoryConfig: Record<string, {
  label: string;
  heading: string;
  subtext: string;
  placeholderColor: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  introContent: IntroContent;
  faq: FAQItemData[];
}> = {
  Events: {
    label: 'Events',
    heading: 'Free Events for Young People in Victoria',
    subtext: 'Concerts, festivals, workshops and more — updated weekly',
    placeholderColor: '#2D1B69',
    seoTitle: "Free Events for Young People in Victoria — What's On Youth",
    seoDescription: "Find free and low-cost events for young people aged 15–25 across Victoria. Concerts, festivals, workshops, art exhibitions, sports events and more in Melbourne, Geelong, Ballarat, Bendigo and regional Victoria. Updated weekly.",
    slug: 'events',
    introContent: {
      body: "What's On Youth scans Victorian event listings every week to find free and low-cost events worth your time — concerts, festivals, exhibitions, workshops, sports events, cultural celebrations and more. Every listing links directly to the organiser so you can book, register or get in touch instantly.",
      tags: ["Free events", "Melbourne events", "Regional Victoria", "Festivals", "Workshops", "Youth events", "Things to do Victoria"],
    },
    faq: [
      { q: "Are these events free for young people?", a: "Many events listed on What's On Youth are free or low cost. Each listing links directly to the organiser where you can check pricing and book." },
      { q: "Do you list events outside Melbourne?", a: "Yes — we specifically source events from across Victoria including Geelong, Ballarat, Bendigo, Shepparton, Gippsland, Mildura and Warrnambool, not just the CBD." },
      { q: "How often are new events added?", a: "New events are scanned and added every Tuesday and Friday automatically from verified Victorian event sources." },
      { q: "Can I submit my own event?", a: "Yes — organisations and community groups can submit events for free. Create a free account and submit your listing at whatsonyouth.org.au/submit." },
    ],
  },
  Jobs: {
    label: 'Jobs',
    heading: 'Jobs and Internships for Young Victorians',
    subtext: 'Entry-level, part-time and casual work for ages 15–25',
    placeholderColor: '#1A2A4A',
    seoTitle: "Entry Level Jobs & Internships for Young People in Victoria — What's On Youth",
    seoDescription: "Find part-time jobs, casual work, internships, apprenticeships and traineeships for young people aged 15–25 in Victoria. No experience required. Melbourne, regional Victoria and online opportunities.",
    slug: 'jobs',
    introContent: {
      body: "Finding your first job or internship is hard. We make it easier by collecting entry-level jobs, part-time work, casual roles, apprenticeships, traineeships and graduate programs across Victoria — all in one place. No account needed to browse. New listings added every week.",
      tags: ["Entry level jobs", "Part time work", "Apprenticeships", "Internships", "Casual jobs", "Graduate programs", "Youth employment Victoria"],
    },
    faq: [
      { q: "What kinds of jobs are listed here?", a: "We focus on entry-level jobs, part-time and casual roles, apprenticeships, traineeships, internships and graduate programs suitable for young people aged 15–25 in Victoria." },
      { q: "Do I need experience to apply for these jobs?", a: "Most listings are entry-level or beginner-friendly. Each listing links directly to the employer or job board where you can check requirements." },
      { q: "Are there jobs outside Melbourne?", a: "Yes — we include jobs from across Victoria including regional areas. Use the location filter to narrow results to your area." },
      { q: "Can employers post jobs for free?", a: "Yes — organisations can submit job listings for free at whatsonyouth.org.au/submit." },
    ],
  },
  Grants: {
    label: 'Grants',
    heading: 'Grants and Scholarships for Young Victorians',
    subtext: 'Free funding opportunities — arts, community, education and more',
    placeholderColor: '#1A3A2A',
    seoTitle: "Grants & Scholarships for Young Victorians — What's On Youth",
    seoDescription: "Find grants, scholarships, bursaries and funding opportunities for young people aged 15–25 in Victoria. Arts grants, community grants, education funding, youth leadership awards and more. Free to apply.",
    slug: 'grants',
    introContent: {
      body: "Grants and scholarships for young Victorians are more accessible than most people think. We surface funding opportunities from state and local government, foundations, arts bodies and community organisations — covering arts, education, community projects, leadership, sport and more.",
      tags: ["Youth grants Victoria", "Scholarships", "Arts funding", "Community grants", "Education bursaries", "Free money for young people", "Grant opportunities"],
    },
    faq: [
      { q: "Can individuals apply for these grants or are they for organisations only?", a: "Both. Some grants are for individual young people (arts, leadership, education), while others are for community organisations. Each listing specifies who can apply." },
      { q: "Are these grants only for Victorians?", a: "Most grants listed are specific to Victoria or Australian residents. Some national grants are included where they are open to young Victorians." },
      { q: "Do I need to be studying to apply for grants?", a: "Not necessarily. Many grants are open to young people in work, running community projects, pursuing arts or sport, or starting businesses." },
      { q: "How do I apply for a grant?", a: "Each listing links directly to the grant provider's website where you can find eligibility criteria and application instructions." },
    ],
  },
  Programs: {
    label: 'Programs',
    heading: 'Youth Programs and Courses in Victoria',
    subtext: 'Free and low-cost programs, workshops and leadership opportunities',
    placeholderColor: '#2D1B4A',
    seoTitle: "Youth Programs & Courses in Victoria — What's On Youth",
    seoDescription: "Discover free and low-cost youth programs, leadership courses, volunteering opportunities, skill development workshops and community programs for young people aged 15–25 across Victoria.",
    slug: 'programs',
    introContent: {
      body: "From leadership programs and outdoor challenges to skill-building workshops and volunteering — Victoria has hundreds of programs designed specifically for young people. Browse free and low-cost opportunities that build your skills, expand your network, and look great on a resume.",
      tags: ["Youth programs Victoria", "Leadership programs", "Volunteering", "Skill development", "Free workshops", "Duke of Edinburgh", "Community programs"],
    },
    faq: [
      { q: "Are these programs free?", a: "Many programs are free or subsidised for young people. Some have a fee — check each listing for details." },
      { q: "What kinds of programs are listed?", a: "Leadership programs, volunteering opportunities, outdoor challenges, workshops, mentoring programs, sports programs, arts courses and community development programs for young Victorians aged 15–25." },
      { q: "Do I need to be from Melbourne to participate?", a: "No — many programs are available Victoria-wide or online. Use the location filter to find programs in your area." },
      { q: "Can organisations list their programs for free?", a: "Yes — submit your program at whatsonyouth.org.au/submit. It's free and your listing goes live immediately." },
    ],
  },
  Wellbeing: {
    label: 'Wellbeing',
    heading: 'Mental Health and Wellbeing Support',
    subtext: 'Free support services for young Victorians aged 15–25',
    placeholderColor: '#2A1A3A',
    seoTitle: "Mental Health & Wellbeing Support for Young People in Victoria — What's On Youth",
    seoDescription: "Find free mental health support, counselling services, youth wellbeing programs and crisis resources for young Victorians aged 15–25. Includes services in Melbourne, Geelong, Ballarat, Bendigo and online.",
    slug: 'wellbeing',
    introContent: {
      body: "Finding the right support can be the hardest step. This page lists free and low-cost mental health services, counselling resources, crisis support lines, wellbeing programs and community organisations for young Victorians aged 15–25. You don't have to figure it out alone.",
      crisis: "If you need to talk to someone right now, call Lifeline on 13 11 14 or text 0477 13 11 14 (24/7, free).",
      tags: ["Mental health support young people", "Free counselling Victoria", "Youth wellbeing", "Crisis support", "Headspace", "Beyond Blue", "ReachOut"],
    },
    faq: [
      { q: "Are these services free?", a: "Most services listed are free or Medicare-funded for young people. headspace, Beyond Blue and ReachOut are free. Each listing links to the provider for full details." },
      { q: "What if I need help right now?", a: "If you're in crisis, call Lifeline on 13 11 14 (24/7, free) or text 0477 13 11 14. You can also call Beyond Blue on 1300 22 4636 or Kids Helpline on 1800 55 1800." },
      { q: "Are there in-person services outside Melbourne?", a: "Yes — headspace has centres across Victoria including Geelong, Ballarat, Bendigo, Shepparton and more. Use the location filter to find services near you." },
      { q: "I'm worried about a friend. What can I do?", a: "ReachOut and Beyond Blue both have specific resources for supporting a friend. Links are in the listings above. You can also call any of the crisis lines on behalf of someone else." },
    ],
  },
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-brand-card-border rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 min-h-[56px]"
      >
        <span className="font-heading font-bold text-[15px] text-brand-text-primary">{q}</span>
        <span className="font-heading text-xl text-brand-text-muted flex-shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="font-body text-[14px] text-brand-text-secondary leading-[1.7]">{a}</p>
        </div>
      )}
    </div>
  );
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": config.faq.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a,
      },
    })),
  };

  return (
    <>
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        ogUrl={`https://www.whatsonyouth.org.au/${config.slug}`}
        canonical={`https://www.whatsonyouth.org.au/${config.slug}`}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
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

      {/* SEO intro content block */}
      <section className="bg-white px-6 py-8 md:px-16 md:py-10">
        <div className="max-w-7xl mx-auto">
          {config.introContent.crisis && (
            <div className="bg-brand-violet-surface border border-brand-violet-border rounded-xl p-4 mb-5 flex items-start gap-3">
              <span aria-hidden="true" className="text-xl leading-none">💜</span>
              <p className="font-body text-sm text-brand-text-primary leading-[1.6]">
                {config.introContent.crisis}
              </p>
            </div>
          )}
          <p className="font-body text-[15px] md:text-base text-brand-text-secondary leading-[1.7] max-w-[800px]">
            {config.introContent.body}
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {config.introContent.tags.map(tag => (
              <span key={tag} className="font-body text-[12px] text-brand-text-muted bg-brand-section-alt rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
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


      {/* FAQ section */}
      {config.faq && config.faq.length > 0 && (
        <section className="bg-brand-section-alt px-6 py-12 md:px-16 md:py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-[24px] md:text-[28px] text-brand-text-primary mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {config.faq.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
