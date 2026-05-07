import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import ListingCardImage from '@/components/ListingCardImage';
import { MapPin } from 'lucide-react';
import { orgToSlug } from '@/lib/org-slug';

interface Listing {
  id: string;
  title: string;
  organisation: string;
  location: string;
  description: string;
  link: string;
  image_url: string | null;
  source: string;
  category: string;
}

export default function OrgProfilePage() {
  const { slug = '' } = useParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orgName, setOrgName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Fetch all active listings, then match by slug client-side (organisation is free text)
      const { data } = await supabase
        .from('listings')
        .select('id, title, organisation, location, description, link, image_url, source, category')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(500);
      if (cancelled) return;
      const matches = (data || []).filter(l => orgToSlug(l.organisation) === slug);
      setListings(matches as Listing[]);
      setOrgName(matches[0]?.organisation || '');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const title = orgName ? `${orgName} — Opportunities on What's On Youth` : 'Organisation';

  return (
    <>
      <SEO
        title={title}
        description={orgName ? `Browse all current opportunities listed by ${orgName} on What's On Youth — events, jobs, grants and programs for young Victorians.` : 'Organisation profile'}
        canonical={`https://www.whatsonyouth.org.au/org/${slug}`}
      />
      <Navbar />
      <section className="bg-white px-6 py-10 md:px-16 md:py-14">
        <div className="max-w-7xl mx-auto">
          <Link to="/search" className="font-body text-sm text-brand-violet-text hover:underline">← Browse all opportunities</Link>
          <h1 className="font-heading font-bold text-[28px] md:text-[40px] text-brand-text-primary leading-[1.15] mt-3">
            {loading ? 'Loading…' : (orgName || 'Organisation not found')}
          </h1>
          {!loading && orgName && (
            <p className="font-body text-base text-brand-text-secondary mt-2">
              {listings.length} active {listings.length === 1 ? 'opportunity' : 'opportunities'} on What's On Youth
            </p>
          )}

          {!loading && listings.length === 0 && (
            <div className="mt-10 bg-brand-section-alt border border-brand-card-border rounded-xl p-8 text-center">
              <p className="font-body text-brand-text-secondary">
                We couldn't find any current listings for this organisation.
              </p>
              <Link to="/search" className="inline-block mt-3 font-body font-medium text-brand-violet-text hover:underline">
                Browse all opportunities →
              </Link>
            </div>
          )}

          {!loading && listings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
              {listings.map(l => (
                <Link
                  key={l.id}
                  to={`/listings/${l.id}`}
                  className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                >
                  <div className="w-full h-40 relative">
                    <ListingCardImage
                      listingId={l.id}
                      imageUrl={l.image_url}
                      title={l.title}
                      category={l.category}
                      link={l.link}
                      className="w-full h-40"
                    />
                    <span className="absolute bottom-2.5 left-2.5 bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">
                      {l.category}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-heading font-bold text-[16px] text-brand-text-primary leading-[1.3] mb-2 line-clamp-2">
                      {l.title}
                    </h3>
                    <div className="flex items-center gap-1.5 font-body text-[13px] text-brand-text-secondary">
                      <MapPin size={13} />
                      <span>{l.location}</span>
                    </div>
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
