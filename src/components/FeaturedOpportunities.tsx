import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Calendar } from 'lucide-react';
import ListingCardImage from '@/components/ListingCardImage';

const categoryColors: Record<string, string> = {
  Events: '#2D1B69',
  Grants: '#1A3A2A',
  Jobs: '#1A2A4A',
  Programs: '#2D1B4A',
  Wellbeing: '#2A1A3A',
};

interface Listing {
  id: string;
  title: string;
  organisation: string;
  location: string;
  category: string;
  image_url: string | null;
  link: string;
  source: string;
  created_at: string;
  is_featured: boolean;
}

const fallbackCards = [
  { category: 'Events', title: 'Youth Climate Summit 2025', organisation: 'Sustainability Victoria', location: 'Melbourne CBD', dateInfo: '15 March 2025' },
  { category: 'Grants', title: 'Create Your Future Fund', organisation: 'Creative Victoria', location: 'Victoria-wide', dateInfo: 'Applications close 28 Feb' },
  { category: 'Jobs', title: 'Junior Marketing Assistant', organisation: 'City of Yarra', location: 'Richmond', dateInfo: 'Posted 2 days ago' },
];

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function FeaturedOpportunities() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: featured } = await supabase
        .from('listings')
        .select('id, title, organisation, location, category, image_url, link, source, created_at, is_featured')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('featured_order', { ascending: true })
        .limit(6);

      let results = (featured as Listing[]) || [];

      if (results.length < 3) {
        const existingIds = results.map(r => r.id);
        const { data: recent } = await supabase
          .from('listings')
          .select('id, title, organisation, location, category, image_url, link, source, created_at, is_featured')
          .eq('is_active', true)
          .not('id', 'in', `(${existingIds.length ? existingIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
          .order('created_at', { ascending: false })
          .limit(3 - results.length);
        if (recent) results = [...results, ...(recent as Listing[])];
      }

      setListings(results);
      setLoaded(true);
    })();
  }, []);

  return (
    <section className="bg-white px-6 py-12 md:px-16 md:py-16">
      <div className="max-w-7xl mx-auto">
        {!loaded ? (
          <>
            <div className="skeleton-shimmer rounded h-8 min-h-[32px] w-[260px] mb-2" />
            <div className="skeleton-shimmer rounded h-4 min-h-[16px] w-[320px] mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col">
                  <div className="w-full h-40 skeleton-shimmer" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="skeleton-shimmer rounded h-3 min-h-[12px] w-[40%]" />
                    <div className="skeleton-shimmer rounded h-4 min-h-[16px] w-[80%]" />
                    <div className="skeleton-shimmer rounded h-3 min-h-[12px] w-[50%]" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : listings.length === 0 ? (
          <>
            <h2 className="text-[28px] md:text-[32px] tracking-[-0.02em] text-brand-text-primary">Featured opportunities</h2>
            <p className="font-body text-base text-brand-text-secondary mb-8">
              Handpicked opportunities for young Victorians.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fallbackCards.map((item) => (
                <div key={item.title} className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col">
                  <div className="w-full h-40" style={{ backgroundColor: categoryColors[item.category] || '#2D1B69' }} />
                  <div className="p-4 flex flex-col flex-1">
                    <p className="font-body text-xs text-brand-text-muted uppercase tracking-[0.04em] mb-1.5">{item.organisation}</p>
                    <h3 className="font-heading font-bold text-[16px] text-brand-text-primary leading-[1.3] mb-2">{item.title}</h3>
                    <div className="flex items-center gap-1.5 font-body text-[13px] text-brand-text-secondary">
                      <MapPin size={13} />
                      <span>{item.location}</span>
                    </div>
                    <p className="font-body text-xs text-brand-text-muted mt-1">{item.dateInfo}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Link to="/events" className="bg-brand-violet text-white font-heading font-bold text-base rounded-lg px-8 py-3.5 transition-colors duration-100 hover:opacity-90">
                View all opportunities
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-[28px] md:text-[32px] tracking-[-0.02em] text-brand-text-primary">Featured opportunities</h2>
            <p className="font-body text-base text-brand-text-secondary mb-8">
              Handpicked opportunities for young Victorians.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listings.map(listing => {
                const color = categoryColors[listing.category] || '#2D1B69';
                return (
                  <div
                    key={listing.id}
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer"
                  >
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
                      {listing.is_featured && (
                        <span className="absolute top-2.5 right-2.5 bg-[#FEF3C7] text-[#92400E] font-body text-[10px] rounded px-1.5 py-0.5">
                          ★
                        </span>
                      )}
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
                      <div className="flex items-center gap-1.5 font-body text-xs text-brand-text-muted mb-3">
                        <Calendar size={12} className="flex-shrink-0" />
                        <span>Posted {daysAgo(listing.created_at)}</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        {listing.source === 'user' && (
                          <span className="bg-[#F0EEFF] text-[#5847E0] font-body text-[10px] rounded-full px-2 py-0.5">
                            Community
                          </span>
                        )}
                        {listing.source === 'admin' && (
                          <span className="bg-[#E6F1FB] text-[#0C447C] font-body text-[10px] rounded-full px-2 py-0.5">
                            Admin
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
            <div className="flex justify-center mt-10">
              <Link to="/events" className="bg-brand-violet text-white font-heading font-bold text-base rounded-lg px-8 py-3.5 transition-colors duration-100 hover:opacity-90">
                View all opportunities
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
