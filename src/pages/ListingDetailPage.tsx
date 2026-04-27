import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Calendar, Copy, Check, Flag, X, ExternalLink, ChevronRight, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import ListingCardImage from '@/components/ListingCardImage';
import useSavedListings from '@/hooks/useSavedListings';
import useRecentlyViewed from '@/hooks/useRecentlyViewed';
import { buildListingJsonLd, buildBreadcrumbJsonLd } from '@/lib/structured-data';
import { sanitizeText } from '@/lib/validation';

const categoryRoutes: Record<string, string> = {
  Events: '/events',
  Jobs: '/jobs',
  Grants: '/grants',
  Programs: '/programs',
  Wellbeing: '/wellbeing',
};

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

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
  contact_email: string;
  view_count?: number;
}

interface RelatedListing {
  id: string;
  title: string;
  organisation: string;
  category: string;
  image_url: string | null;
  link: string;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [related, setRelated] = useState<RelatedListing[]>([]);
  const { isSaved, toggleSave } = useSavedListings();
  const { addRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    if (!id) return;
    supabase
      .from('listings')
      .select('id, title, organisation, location, description, link, image_url, source, created_at, expiry_date, category, contact_email, view_count')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setListing(data as Listing);
          addRecentlyViewed(data.id);
          // Increment view count
          supabase.rpc('increment_listing_views', { listing_id: data.id });
          // Fetch related
          supabase
            .from('listings')
            .select('id, title, organisation, category, image_url, link')
            .eq('category', data.category)
            .eq('is_active', true)
            .neq('id', data.id)
            .order('created_at', { ascending: false })
            .limit(3)
            .then(({ data: rel }) => {
              if (rel) setRelated(rel as RelatedListing[]);
            });
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [id]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: `Check out this opportunity on What's On Youth`,
          url: window.location.href,
        });
        return;
      } catch {}
    }
    handleCopy();
  };

  const handleReport = async () => {
    const reason = sanitizeText(reportReason);
    if (!reason || reason.length > 500 || !id) return;
    setReportSubmitting(true);
    await supabase.from('listing_reports').insert({
      listing_id: id,
      reason,
    });
    setReportSubmitting(false);
    setReportSent(true);
    setTimeout(() => {
      setShowReport(false);
      setReportSent(false);
      setReportReason('');
    }, 2000);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="bg-white min-h-screen px-6 md:px-16 py-12 max-w-7xl mx-auto">
          <div className="skeleton-shimmer rounded-xl w-full h-[300px] mb-6" />
          <div className="skeleton-shimmer rounded h-8 w-[60%] mb-4" />
          <div className="skeleton-shimmer rounded h-4 w-[30%] mb-6" />
          <div className="skeleton-shimmer rounded h-4 w-full mb-2" />
          <div className="skeleton-shimmer rounded h-4 w-full mb-2" />
          <div className="skeleton-shimmer rounded h-4 w-[80%]" />
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !listing) {
    return (
      <>
        <Navbar />
        <div className="bg-white min-h-screen flex flex-col items-center justify-center px-6 py-16">
          <h1 className="font-heading font-bold text-[24px] text-brand-text-primary mb-4">
            This listing could not be found.
          </h1>
          <Link to="/" className="font-body text-brand-violet hover:underline text-[15px] min-h-[44px] flex items-center">
            ← Back to homepage
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const backRoute = categoryRoutes[listing.category] || '/';
  const isClosingSoon = listing.expiry_date &&
    (new Date(listing.expiry_date).getTime() - Date.now()) < 7 * 86400000 &&
    new Date(listing.expiry_date).getTime() > Date.now();

  const ctaLabel = listing.category === 'Events' ? 'Register' :
    listing.category === 'Jobs' ? 'Apply now' : 'Visit website';

  const cleanDescription = (desc: string | null) => {
    if (!desc) return '';
    return desc.replace(/^\[Link needs review\]\s*/i, '').trim();
  };

  const cleanDesc = cleanDescription(listing.description);
  const truncDesc = cleanDesc.length > 155 ? cleanDesc.slice(0, 155) + '...' : cleanDesc;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${listing.title} — ${window.location.href}`)}`;

  const listingUrl = `https://www.whatsonyouth.org.au/listings/${listing.id}`;
  const listingJsonLd = buildListingJsonLd({
    id: listing.id,
    title: listing.title,
    organisation: listing.organisation,
    location: listing.location,
    description: cleanDesc,
    link: listing.link,
    image_url: listing.image_url,
    created_at: listing.created_at,
    expiry_date: listing.expiry_date,
    category: listing.category,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: 'https://www.whatsonyouth.org.au/' },
    { name: listing.category, url: `https://www.whatsonyouth.org.au${categoryRoutes[listing.category] || '/'}` },
    { name: listing.title, url: listingUrl },
  ]);

  return (
    <>
      <SEO
        title={`${listing.title} | ${listing.category} in ${listing.location} — What's On Youth`}
        description={`${truncDesc} — Free ${listing.category.toLowerCase()} opportunity for young Victorians in ${listing.location}. Find more at What's On Youth.`}
        ogTitle={listing.title}
        ogDescription={truncDesc}
        ogUrl={listingUrl}
        ogImage={listing.image_url || undefined}
        ogType="article"
        canonical={listingUrl}
        jsonLd={[listingJsonLd, breadcrumbJsonLd]}
      />
      <Navbar />

      <div className="bg-white min-h-screen overflow-x-hidden">
        {/* Breadcrumbs */}
        <div className="px-6 md:px-16 py-4 max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 font-body text-sm min-h-[44px] flex-wrap" aria-label="Breadcrumb">
            <Link to="/" className="text-brand-text-muted hover:text-brand-violet transition-colors">Home</Link>
            <ChevronRight size={14} className="text-brand-text-muted flex-shrink-0" />
            <Link to={backRoute} className="text-brand-text-muted hover:text-brand-violet transition-colors">{listing.category}</Link>
            <ChevronRight size={14} className="text-brand-text-muted flex-shrink-0" />
            <span className="text-brand-text-primary font-medium truncate max-w-[200px] md:max-w-[400px]">{listing.title}</span>
          </nav>
        </div>

        <div className="px-6 md:px-16 pb-24 lg:pb-16 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            <span className="inline-block bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px] mb-2">
              {listing.category}
            </span>
            <h1 className="font-heading font-bold text-[24px] md:text-[32px] text-brand-text-primary leading-[1.2] mt-2">
              {listing.title}
            </h1>
            <p className="font-body text-sm text-brand-text-muted uppercase tracking-[0.04em] mt-2">
              {listing.organisation}
            </p>

            <div className="mt-6 rounded-xl overflow-hidden max-h-[360px]">
              <ListingCardImage
                listingId={listing.id}
                imageUrl={listing.image_url}
                title={listing.title}
                category={listing.category}
                link={listing.link}
                className="w-full max-h-[360px]"
              />
            </div>

            <div className="mt-6">
              <p className="font-body text-base text-brand-text-secondary leading-[1.7] whitespace-pre-line">
                {cleanDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-6 font-body text-[15px] text-brand-text-secondary">
              <MapPin size={16} />
              <span>{listing.location}</span>
            </div>

            <div className="mt-4">
              {listing.source === 'user' ? (
                <span className="inline-block bg-brand-section-alt text-brand-text-muted font-body text-xs rounded-full px-3 py-1">
                  Submitted by community
                </span>
              ) : (
                <span className="inline-block bg-brand-section-alt text-brand-text-muted font-body text-xs rounded-full px-3 py-1">
                  Curated by WOY
                </span>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            <div className="lg:sticky lg:top-6 bg-white border border-brand-card-border rounded-xl p-6 space-y-5">
              {listing.expiry_date && (
                <div>
                  <p className="font-body font-medium text-[13px] text-brand-text-muted">
                    {listing.category === 'Events' ? 'Date' : 'Closes'}
                  </p>
                  <p className="font-heading font-bold text-[18px] text-brand-text-primary mt-1">
                    {formatDate(listing.expiry_date)}
                  </p>
                  {isClosingSoon && (
                    <span className="inline-block bg-red-100 text-red-600 font-body font-medium text-xs rounded-full px-2.5 py-0.5 mt-1.5">
                      Closing soon
                    </span>
                  )}
                </div>
              )}

              <a
                href={listing.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-coral text-white font-heading font-bold text-base rounded-lg py-3.5 transition-colors hover:bg-brand-coral-light min-h-[48px]"
              >
                {ctaLabel}
                <ExternalLink size={14} />
              </a>

              <button
                onClick={() => toggleSave({ id: listing.id, title: listing.title, category: listing.category, organisation: listing.organisation, location: listing.location })}
                className="flex items-center justify-center gap-2 w-full border border-brand-card-border text-brand-text-primary font-body font-medium text-sm rounded-lg py-3 hover:bg-brand-section-alt transition-colors min-h-[48px]"
              >
                <Heart size={14} className={isSaved(listing.id) ? 'fill-red-400 text-red-400' : ''} />
                {isSaved(listing.id) ? 'Saved' : 'Save listing'}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 w-full border border-brand-card-border text-brand-text-primary font-body font-medium text-sm rounded-lg py-3 hover:bg-brand-section-alt transition-colors min-h-[48px]"
              >
                {copied ? <><Check size={14} /> Link copied!</> : <><Copy size={14} /> Share this listing</>}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-brand-text-muted font-body text-xs hover:text-brand-text-secondary transition-colors min-h-[36px]"
              >
                Share on WhatsApp
              </a>

              {listing.category !== 'Wellbeing' && (
                <p className="font-body text-[13px] text-brand-text-muted">
                  Listed {daysAgo(listing.created_at)}
                </p>
              )}

              {listing.view_count != null && listing.view_count > 0 && (
                <p className="font-body text-[13px] text-brand-text-muted">
                  👁 {listing.view_count} {listing.view_count === 1 ? 'view' : 'views'}
                </p>
              )}

              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1.5 font-body text-xs text-brand-text-muted hover:text-[#E24B4A] transition-colors min-h-[44px]"
              >
                <Flag size={12} />
                Report this listing
              </button>
            </div>
          </div>
        </div>

        {/* More in category */}
        {related.length > 0 && (
          <section className="bg-brand-section-alt px-6 md:px-16 py-10">
            <div className="max-w-7xl mx-auto">
              <h2 className="font-heading font-bold text-[22px] text-brand-text-primary mb-6">
                More {listing.category.toLowerCase()} opportunities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map(r => (
                  <Link
                    key={r.id}
                    to={`/listings/${r.id}`}
                    className="bg-white border border-brand-card-border rounded-xl overflow-hidden hover:border-brand-violet transition-colors"
                  >
                    <div className="h-28 relative">
                      <ListingCardImage
                        listingId={r.id}
                        imageUrl={r.image_url}
                        title={r.title}
                        category={r.category}
                        link={r.link}
                        className="w-full h-28"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-body text-[11px] text-brand-text-muted uppercase tracking-[0.04em] mb-1">{r.organisation}</p>
                      <h3 className="font-heading font-bold text-[14px] text-brand-text-primary leading-[1.3] line-clamp-2">{r.title}</h3>
                      <span className="font-body text-[12px] text-brand-violet mt-1 inline-block">View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Mobile floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-card-border p-4 pb-6 z-30 lg:hidden" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <a
          href={listing.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-brand-coral text-white font-heading font-bold text-base rounded-lg py-3.5 hover:bg-brand-coral-light min-h-[48px]"
        >
          {ctaLabel}
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
            <button onClick={() => { setShowReport(false); setReportSent(false); setReportReason(''); }} className="absolute top-4 right-4 text-brand-text-muted min-w-[44px] min-h-[44px] flex items-center justify-center">
              <X size={18} />
            </button>
            {reportSent ? (
              <p className="font-body text-brand-text-primary text-center py-8">
                Thanks for letting us know.
              </p>
            ) : (
              <>
                <h3 className="font-heading font-bold text-lg text-brand-text-primary mb-3">
                  Report this listing
                </h3>
                <textarea
                  placeholder="Why are you reporting this?"
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  rows={4}
                  className="w-full border border-brand-input-border rounded-lg p-3 font-body text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet resize-none"
                />
                <button
                  onClick={handleReport}
                  disabled={!reportReason.trim() || reportSubmitting}
                  className="mt-3 w-full bg-brand-coral text-white font-heading font-bold text-sm rounded-lg py-3 hover:bg-brand-coral-light transition-colors disabled:opacity-50 min-h-[48px]"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit report'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
