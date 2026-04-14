import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ListingCardImage from '@/components/ListingCardImage';
import useRecentlyViewed from '@/hooks/useRecentlyViewed';

interface Listing {
  id: string;
  title: string;
  organisation: string;
  category: string;
  image_url: string | null;
  link: string;
}

export default function RecentlyViewed() {
  const { recentIds, clearRecent } = useRecentlyViewed();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (recentIds.length === 0) return;
    supabase
      .from('listings')
      .select('id, title, organisation, category, image_url, link')
      .in('id', recentIds)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          // Preserve order from recentIds
          const map = new Map(data.map(d => [d.id, d]));
          setListings(recentIds.map(id => map.get(id)).filter(Boolean) as Listing[]);
        }
      });
  }, [recentIds]);

  if (recentIds.length === 0 || listings.length === 0) return null;

  return (
    <section className="bg-white px-6 py-10 md:px-16 md:py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-[24px] text-brand-text-primary">Recently viewed</h2>
          <button onClick={clearRecent} className="font-body text-sm text-brand-text-muted hover:text-brand-violet transition-colors">
            Clear
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {listings.map(listing => (
            <Link
              key={listing.id}
              to={`/listings/${listing.id}`}
              className="flex-shrink-0 w-[260px] bg-white border border-brand-card-border rounded-xl overflow-hidden hover:border-brand-violet transition-colors"
            >
              <div className="h-28 relative">
                <ListingCardImage
                  listingId={listing.id}
                  imageUrl={listing.image_url}
                  title={listing.title}
                  category={listing.category}
                  link={listing.link}
                  className="w-full h-28"
                />
              </div>
              <div className="p-3">
                <p className="font-body text-[11px] text-brand-text-muted uppercase tracking-[0.04em] mb-1">{listing.organisation}</p>
                <h3 className="font-heading font-bold text-[14px] text-brand-text-primary leading-[1.3] line-clamp-1">{listing.title}</h3>
                <span className="font-body text-[12px] text-brand-violet mt-1 inline-block">View →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
