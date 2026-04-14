import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import ListingCardImage from '@/components/ListingCardImage';
import useSavedListings from '@/hooks/useSavedListings';

interface Listing {
  id: string;
  title: string;
  organisation: string;
  location: string;
  category: string;
  image_url: string | null;
  link: string;
  source: string;
}

export default function SavedListingsPage() {
  const navigate = useNavigate();
  const { savedIds, toggleSave, isSaved } = useSavedListings();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (savedIds.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    supabase
      .from('listings')
      .select('id, title, organisation, location, category, image_url, link, source')
      .in('id', savedIds)
      .eq('is_active', true)
      .then(({ data }) => {
        setListings((data as Listing[]) || []);
        setLoading(false);
      });
  }, [savedIds]);

  return (
    <>
      <SEO title="Saved Listings — What's On Youth" description="Your saved opportunities." noindex />
      <Navbar />
      <section className="bg-white min-h-screen px-6 py-10 md:px-16 md:py-14">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-[32px] md:text-[40px] tracking-[-0.02em] text-brand-text-primary mb-2">Saved listings</h1>
          <p className="font-body text-base text-brand-text-secondary mb-8">Opportunities you've saved for later.</p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-violet border-t-transparent rounded-full animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Heart size={48} className="text-brand-disabled mb-4" />
              <h2 className="font-heading font-bold text-[20px] text-brand-text-primary mb-2">No saved listings yet</h2>
              <p className="font-body text-[15px] text-brand-text-muted text-center max-w-md mb-6">
                Browse opportunities and tap the heart icon to save them here.
              </p>
              <Link to="/search" className="bg-brand-coral text-white font-heading font-bold text-sm rounded-lg px-6 py-3 hover:bg-brand-coral-light transition-colors min-h-[44px]">
                Browse opportunities
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <div
                  key={listing.id}
                  role="article"
                  className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
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
                    <p className="font-body text-xs text-brand-text-muted uppercase tracking-[0.04em] mb-1.5">{listing.organisation}</p>
                    <Link to={`/listings/${listing.id}`}>
                      <h3 className="font-heading font-bold text-[16px] text-brand-text-primary leading-[1.3] mb-2 line-clamp-2">{listing.title}</h3>
                    </Link>
                    <div className="flex items-center gap-1.5 font-body text-[13px] text-brand-text-secondary">
                      <MapPin size={13} className="flex-shrink-0" />
                      <span>{listing.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
