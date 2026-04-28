import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import ListingCardImage from '@/components/ListingCardImage';
import SkeletonCard from '@/components/SkeletonCard';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/structured-data';

interface Listing {
  id: string;
  title: string;
  organisation: string;
  location: string;
  description: string;
  link: string;
  image_url: string | null;
  created_at: string;
  expiry_date: string | null;
  category: string;
}

const landingConfigs = {
  'youth-events-melbourne': {
    slug: 'youth-events-melbourne',
    category: 'Events',
    location: 'Melbourne',
    title: "Youth Events in Melbourne — What's On Youth",
    description: 'Find free and low-cost youth events in Melbourne for young people aged 15–25. Workshops, festivals, arts, community events and more.',
    h1: 'Youth events in Melbourne',
    intro: 'Browse Melbourne events selected for young Victorians — from workshops and festivals to arts, sport, culture and community opportunities.',
    links: [['More events', '/events'], ['Melbourne opportunities', '/melbourne'], ['Search all', '/search?category=Events&location=Melbourne']],
  },
  'youth-jobs-victoria': {
    slug: 'youth-jobs-victoria',
    category: 'Jobs',
    title: "Youth Jobs in Victoria — What's On Youth",
    description: 'Find entry-level jobs, internships, traineeships and work opportunities for young Victorians aged 15–25.',
    h1: 'Youth jobs in Victoria',
    intro: 'Find entry-level roles, casual jobs, internships, apprenticeships, traineeships and graduate opportunities suitable for young people across Victoria.',
    links: [['All jobs', '/jobs'], ['Melbourne jobs', '/search?category=Jobs&location=Melbourne'], ['Submit a job', '/submit']],
  },
  'grants-for-young-people-victoria': {
    slug: 'grants-for-young-people-victoria',
    category: 'Grants',
    title: "Grants for Young People in Victoria — What's On Youth",
    description: 'Find grants, scholarships, bursaries and funding opportunities for young people aged 15–25 in Victoria.',
    h1: 'Grants for young people in Victoria',
    intro: 'Discover funding for study, arts, community projects, leadership, sport and youth-led ideas from trusted Victorian and Australian sources.',
    links: [['All grants', '/grants'], ['Programs', '/programs'], ['Search all', '/search?category=Grants']],
  },
  'youth-programs-victoria': {
    slug: 'youth-programs-victoria',
    category: 'Programs',
    title: "Youth Programs in Victoria — What's On Youth",
    description: 'Find youth programs, leadership courses, workshops, volunteering and skill-building opportunities across Victoria.',
    h1: 'Youth programs in Victoria',
    intro: 'Explore leadership programs, workshops, mentoring, volunteering and courses that help young Victorians build skills and confidence.',
    links: [['All programs', '/programs'], ['Volunteering', '/volunteering-for-young-people-victoria'], ['Search all', '/search?category=Programs']],
  },
  'volunteering-for-young-people-victoria': {
    slug: 'volunteering-for-young-people-victoria',
    category: 'Programs',
    keyword: 'volunteer',
    title: "Volunteering for Young People in Victoria — What's On Youth",
    description: 'Find volunteering opportunities, community programs and youth leadership pathways for young people in Victoria.',
    h1: 'Volunteering for young people in Victoria',
    intro: 'Find community programs, volunteering pathways and youth leadership opportunities that help you gain experience and make an impact.',
    links: [['All programs', '/programs'], ['Youth programs', '/youth-programs-victoria'], ['Search all', '/search?q=volunteer']],
  },
  'mental-health-support-young-people-victoria': {
    slug: 'mental-health-support-young-people-victoria',
    category: 'Wellbeing',
    title: "Mental Health Support for Young People in Victoria — What's On Youth",
    description: 'Find mental health, counselling, crisis support and wellbeing services for young Victorians aged 15–25.',
    h1: 'Mental health support for young people in Victoria',
    intro: 'Browse youth wellbeing services, counselling options, crisis supports and mental health programs across Victoria and online.',
    links: [['All wellbeing support', '/wellbeing'], ['Online support', '/search?category=Wellbeing&location=Online'], ['Contact', '/contact']],
  },
} as const;

export type SeoLandingSlug = keyof typeof landingConfigs;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SeoLandingPage({ slug }: { slug: SeoLandingSlug }) {
  const config = landingConfigs[slug];
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('id, title, organisation, location, description, link, image_url, created_at, expiry_date, category')
      .eq('is_active', true)
      .eq('category', config.category)
      .order('created_at', { ascending: false })
      .limit(12);

    if ('location' in config && config.location) {
      query = query.or(`location.ilike.%${config.location}%,location.eq.Victoria-wide,location.eq.Online`);
    }

    query.then(({ data }) => {
      const rows = ((data as Listing[]) || []).filter((listing) => {
        if (!('keyword' in config) || !config.keyword) return true;
        const haystack = `${listing.title} ${listing.description} ${listing.organisation}`.toLowerCase();
        return haystack.includes(config.keyword);
      });
      setListings(rows);
      setLoading(false);
    });
  }, [config]);

  const url = `https://www.whatsonyouth.org.au/${config.slug}`;
  const jsonLd = useMemo(() => [
    buildCollectionPageJsonLd({ name: config.h1, description: config.description, url, numberOfItems: listings.length }),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: 'https://www.whatsonyouth.org.au/' },
      { name: config.h1, url },
    ]),
  ], [config, listings.length, url]);

  return (
    <>
      <SEO title={config.title} description={config.description} canonical={url} ogUrl={url} jsonLd={jsonLd} />
      <Navbar />
      <section className="bg-brand-dark px-6 py-10 md:px-16 md:py-14">
        <div className="max-w-7xl mx-auto">
          <p className="font-body text-sm text-brand-footer-link mb-3">For young Victorians aged 15–25</p>
          <h1 className="font-heading font-bold text-[34px] md:text-[48px] text-white leading-[1.08] max-w-3xl">{config.h1}</h1>
          <p className="font-body text-base md:text-lg text-brand-footer-link mt-4 max-w-2xl leading-relaxed">{config.intro}</p>
          <div className="flex flex-wrap gap-3 mt-7">
            {config.links.map(([label, href]) => (
              <Link key={href} to={href} className="bg-white/10 border border-white/20 text-white font-body font-medium text-sm rounded-lg px-4 py-2.5 min-h-[44px] flex items-center hover:bg-white/15 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-10 md:px-16 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-heading font-bold text-[24px] text-brand-text-primary">Current listings</h2>
              <p className="font-body text-sm text-brand-text-secondary mt-1">Fresh opportunities pulled from the live directory.</p>
            </div>
            <Link to={`/search?category=${encodeURIComponent(config.category)}`} className="hidden sm:inline-flex font-body font-medium text-sm text-brand-violet hover:underline">View all →</Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-brand-card-border rounded-xl bg-brand-section-alt">
              <Search size={40} className="text-brand-disabled mb-4" />
              <p className="font-heading font-bold text-[20px] text-brand-text-primary">No matching listings right now</p>
              <Link to="/search" className="mt-4 bg-brand-coral text-white font-heading font-bold text-sm rounded-lg px-6 py-3 min-h-[44px]">Search all opportunities</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link key={listing.id} to={`/listings/${listing.id}`} className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                  <div className="h-40 relative">
                    <ListingCardImage listingId={listing.id} imageUrl={listing.image_url} title={listing.title} category={listing.category} link={listing.link} className="w-full h-40" />
                    <span className="absolute bottom-2.5 left-2.5 bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">{listing.category}</span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="font-body text-xs text-brand-text-muted uppercase tracking-[0.04em] mb-1.5">{listing.organisation}</p>
                    <h3 className="font-heading font-bold text-[16px] text-brand-text-primary leading-[1.3] mb-2 line-clamp-2">{listing.title}</h3>
                    <div className="flex items-center gap-1.5 font-body text-[13px] text-brand-text-secondary mb-1"><MapPin size={13} />{listing.location}</div>
                    {listing.expiry_date && <div className="flex items-center gap-1.5 font-body text-xs text-brand-text-muted"><Calendar size={12} />{formatDate(listing.expiry_date)}</div>}
                    <p className="font-body text-[13px] text-brand-text-muted line-clamp-2 mt-2">{listing.description.replace(/^\[Link needs review\]\s*/i, '')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
