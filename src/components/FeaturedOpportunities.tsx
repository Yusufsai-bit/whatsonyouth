import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Calendar, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import ListingCardImage from '@/components/ListingCardImage';
import useSavedListings from '@/hooks/useSavedListings';
import useEmblaCarousel from 'embla-carousel-react';

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

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function alternateCategories(items: Listing[]): Listing[] {
  if (items.length <= 1) return items;
  // Always keep the first item (lowest featured_order = pinned slot) locked at index 0.
  // Only shuffle the rest by category to avoid two adjacent cards of the same category.
  const pinned = items[0];
  const rest = items.slice(1);
  const result: Listing[] = [pinned];
  while (rest.length > 0) {
    const lastCategory = result[result.length - 1].category;
    const diffIdx = rest.findIndex(l => l.category !== lastCategory);
    if (diffIdx !== -1) {
      result.push(rest.splice(diffIdx, 1)[0]);
    } else {
      result.push(rest.shift()!);
    }
  }
  return result;
}

function ListingCard({ listing, isSaved, onToggleSave }: { listing: Listing; isSaved: boolean; onToggleSave: () => void }) {
  return (
    <div
      role="article"
      className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:opacity-90 h-full"
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
          {listing.is_featured && (
            <span className="absolute top-2.5 left-2.5 bg-[#FEF3C7] text-[#92400E] font-body text-[10px] rounded px-1.5 py-0.5">
              ★
            </span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
            className="absolute top-2.5 right-2.5 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
          >
            <Heart size={18} className={isSaved ? 'fill-red-400 text-red-400' : 'text-white/60'} />
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
        <div className="flex items-center gap-1.5 font-body text-xs text-brand-text-muted mb-3">
          <Calendar size={12} className="flex-shrink-0" />
          <span>Posted {daysAgo(listing.created_at)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          {listing.source !== 'user' ? (
            <span className="bg-[#E6F1FB] text-[#0C447C] font-body text-[10px] rounded-full px-2 py-0.5 truncate max-w-[60%]">
              Listed by {listing.organisation}
            </span>
          ) : (
            <span className="bg-[#F0EEFF] text-[#5847E0] font-body text-[10px] rounded-full px-2 py-0.5">
              Community
            </span>
          )}
          <span className="font-body font-medium text-[13px] text-brand-violet ml-auto">
            View details →
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedOpportunities() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { isSaved, toggleSave } = useSavedListings();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    (async () => {
      const { data: featured } = await supabase
        .from('listings')
        .select('id, title, organisation, location, category, image_url, link, source, created_at, is_featured')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('featured_order', { ascending: true })
        .limit(12);

      let results = (featured as Listing[]) || [];

      if (results.length < 6) {
        const existingIds = results.map(r => r.id);
        const { data: recent } = await supabase
          .from('listings')
          .select('id, title, organisation, location, category, image_url, link, source, created_at, is_featured')
          .eq('is_active', true)
          .not('id', 'in', `(${existingIds.length ? existingIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
          .order('created_at', { ascending: false })
          .limit(6 - results.length);
        if (recent) results = [...results, ...(recent as Listing[])];
      }

      setListings(alternateCategories(results));
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
        ) : (
          <>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-[22px] md:text-[32px] tracking-[-0.02em] text-brand-text-primary">Featured opportunities</h2>
                <p className="font-body text-base text-brand-text-secondary">
                  Handpicked opportunities for young Victorians.
                </p>
              </div>
              {listings.length > 3 && (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => emblaApi?.scrollPrev()}
                    disabled={!canScrollPrev}
                    className="w-9 h-9 rounded-full border border-brand-card-border flex items-center justify-center text-brand-text-secondary hover:border-brand-violet hover:text-brand-violet transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => emblaApi?.scrollNext()}
                    disabled={!canScrollNext}
                    className="w-9 h-9 rounded-full border border-brand-card-border flex items-center justify-center text-brand-text-secondary hover:border-brand-violet hover:text-brand-violet transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {listings.length === 0 ? (
              <p className="font-body text-brand-text-muted text-center py-12">No featured opportunities yet.</p>
            ) : (
              <div ref={emblaRef} className="overflow-hidden">
                <div className="flex -ml-4">
                  {listings.map(listing => (
                    <div
                      key={listing.id}
                      className="min-w-0 shrink-0 grow-0 basis-[85%] sm:basis-[45%] md:basis-[33.333%] pl-4"
                    >
                      <ListingCard
                        listing={listing}
                        isSaved={isSaved(listing.id)}
                        onToggleSave={() => toggleSave({ id: listing.id, title: listing.title, category: listing.category, organisation: listing.organisation, location: listing.location })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {listings.length > 3 && (
              <div className="flex md:hidden justify-center mt-4">
                {listings.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => emblaApi?.scrollTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        emblaApi?.selectedScrollSnap() === i ? 'bg-brand-violet' : 'bg-brand-card-border'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-center mt-10">
              <Link to="/search" className="bg-brand-violet text-white font-heading font-bold text-base rounded-lg px-8 py-3.5 transition-colors duration-100 hover:opacity-90">
                View all opportunities
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
