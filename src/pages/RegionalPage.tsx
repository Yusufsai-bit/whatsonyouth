import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Heart, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import SkeletonCard from '@/components/SkeletonCard';
import ListingCardImage from '@/components/ListingCardImage';
import useSavedListings from '@/hooks/useSavedListings';
import { buildCollectionPageJsonLd, buildBreadcrumbJsonLd } from '@/lib/structured-data';

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

export const regionConfig: Record<string, {
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  heading: string;
  subtext: string;
}> = {
  melbourne: {
    name: 'Melbourne',
    slug: 'melbourne',
    seoTitle: "Free Events & Opportunities for Young People in Melbourne — What's On Youth",
    seoDescription: "Find free events, jobs, grants, programs and mental health support for young people in Melbourne. Updated weekly. For ages 15–25.",
    heading: 'Opportunities in Melbourne',
    subtext: 'Events, jobs, grants and support for young Melburnians',
  },
  geelong: {
    name: 'Geelong',
    slug: 'geelong',
    seoTitle: "Things to Do for Young People in Geelong — What's On Youth",
    seoDescription: "Find events, jobs, grants, youth programs and wellbeing support in Geelong for young people aged 15–25. Free to use.",
    heading: 'Opportunities in Geelong',
    subtext: 'Events, jobs, grants and support in the Geelong region',
  },
  ballarat: {
    name: 'Ballarat',
    slug: 'ballarat',
    seoTitle: "Youth Events & Opportunities in Ballarat — What's On Youth",
    seoDescription: "Discover events, jobs, grants and youth programs in Ballarat for young people aged 15–25. Free opportunities in regional Victoria.",
    heading: 'Opportunities in Ballarat',
    subtext: 'Events, jobs, grants and support in Ballarat',
  },
  bendigo: {
    name: 'Bendigo',
    slug: 'bendigo',
    seoTitle: "Youth Events & Opportunities in Bendigo — What's On Youth",
    seoDescription: "Find events, jobs, grants and youth programs in Bendigo for young people aged 15–25. Free opportunities in regional Victoria.",
    heading: 'Opportunities in Bendigo',
    subtext: 'Events, jobs, grants and support in Bendigo',
  },
  gippsland: {
    name: 'Gippsland',
    slug: 'gippsland',
    seoTitle: "Youth Events & Opportunities in Gippsland — What's On Youth",
    seoDescription: "Find events, jobs, grants and youth programs across Gippsland for young people aged 15–25. Free opportunities in regional Victoria.",
    heading: 'Opportunities in Gippsland',
    subtext: 'Events, jobs, grants and support across Gippsland',
  },
  shepparton: {
    name: 'Shepparton',
    slug: 'shepparton',
    seoTitle: "Youth Events & Opportunities in Shepparton — What's On Youth",
    seoDescription: "Find events, jobs, grants and youth programs in Shepparton for young people aged 15–25. Free opportunities in regional Victoria.",
    heading: 'Opportunities in Shepparton',
    subtext: 'Events, jobs, grants and support in Shepparton',
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

function getDateDisplay(listing: Listing) {
  if (listing.category === 'Events' && listing.expiry_date) return formatDate(listing.expiry_date);
  if (listing.category === 'Jobs') return `Posted ${daysAgo(listing.created_at)}`;
  if (listing.category === 'Grants' && listing.expiry_date) return `Closes ${formatDate(listing.expiry_date)}`;
  if (listing.expiry_date) return formatDate(listing.expiry_date);
  return null;
}

export default function RegionalPage({ region }: { region: string }) {
  const config = regionConfig[region];
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSave } = useSavedListings();

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    supabase
      .from('listings')
      .select('id, title, organisation, location, description, link, image_url, source, created_at, expiry_date, category')
      .eq('is_active', true)
      .or(`location.ilike.%${config.name}%,location.eq.Victoria-wide,location.eq.Online`)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings((data as Listing[]) || []);
        setLoading(false);
      });
  }, [region, config]);

  const filtered = useMemo(() => listings, [listings]);

  if (!config) return null;

  const regionUrl = `https://www.whatsonyouth.org.au/${config.slug}`;
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: config.heading,
    description: config.seoDescription,
    url: regionUrl,
    numberOfItems: filtered.length,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: 'https://www.whatsonyouth.org.au/' },
    { name: config.name, url: regionUrl },
  ]);

  return (
    <>
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        ogUrl={regionUrl}
        canonical={regionUrl}
        jsonLd={[collectionJsonLd, breadcrumbJsonLd]}
      />
      <Navbar />

      <section className="bg-brand-section-alt px-6 py-6 md:px-16 md:py-12">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <span className="inline-block bg-brand-violet-surface text-brand-violet font-body font-medium text-xs rounded-full px-3 py-1 mb-3">
              {config.name}
            </span>
            <h1 className="text-[32px] md:text-[40px] leading-[1.15] tracking-[-0.02em] text-brand-text-primary">
              {config.heading}
            </h1>
            <p className="font-body text-base text-brand-text-secondary mt-2">{config.subtext}</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="font-heading font-bold text-2xl text-brand-text-primary">
              {filtered.length}
              <span className="font-body font-normal text-sm text-brand-text-muted ml-1">opportunities</span>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-10 md:px-16 md:py-10">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search size={48} className="text-brand-disabled mb-4" />
              <h2 className="font-heading font-bold text-[20px] text-brand-text-primary mb-2">No listings yet</h2>
              <p className="font-body text-[15px] text-brand-text-muted text-center max-w-md">
                No listings for {config.name} yet — check back soon or browse all opportunities.
              </p>
              <Link to="/search" className="mt-6 bg-brand-coral text-white font-heading font-bold text-sm rounded-lg px-6 py-3 hover:bg-brand-coral-light min-h-[44px]">
                Browse all
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(listing => {
                const dateDisplay = getDateDisplay(listing);
                return (
                  <div key={listing.id} role="article" className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:opacity-90">
                    <Link to={`/listings/${listing.id}`} className="block">
                      <div className="w-full h-40 relative">
                        <ListingCardImage listingId={listing.id} imageUrl={listing.image_url} title={listing.title} category={listing.category} link={listing.link} className="w-full h-40" />
                        <span className="absolute bottom-2.5 left-2.5 bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">{listing.category}</span>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave({ id: listing.id, title: listing.title, category: listing.category, organisation: listing.organisation, location: listing.location }); }} className="absolute top-2.5 right-2.5 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors" aria-label={isSaved(listing.id) ? 'Unsave listing' : 'Save listing'}>
                          <Heart size={18} className={isSaved(listing.id) ? 'fill-red-400 text-red-400' : 'text-white/60'} />
                        </button>
                      </div>
                    </Link>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="font-body text-xs text-brand-text-muted uppercase tracking-[0.04em] mb-1.5">{listing.organisation}</p>
                      <Link to={`/listings/${listing.id}`}>
                        <h3 className="font-heading font-bold text-[16px] text-brand-text-primary leading-[1.3] mb-2 line-clamp-2">{listing.title}</h3>
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
