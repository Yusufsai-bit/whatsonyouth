import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ArrowLeft, Copy, Check, Flag, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { getListingImage } from '@/lib/listing-image';
const categoryColors: Record<string, string> = {
  Events: '#2D1B69',
  Jobs: '#1A2A4A',
  Grants: '#1A3A2A',
  Programs: '#2D1B4A',
  Wellbeing: '#2A1A3A',
};

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
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('listings')
      .select('id, title, organisation, location, description, link, image_url, source, created_at, expiry_date, category, contact_email')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setListing(data as Listing);
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

  const handleReport = async () => {
    if (!reportReason.trim() || !id) return;
    setReportSubmitting(true);
    await supabase.from('listing_reports').insert({
      listing_id: id,
      reason: reportReason.trim(),
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
  const placeholderColor = categoryColors[listing.category] || '#2D1B69';
  const isClosingSoon = listing.expiry_date &&
    (new Date(listing.expiry_date).getTime() - Date.now()) < 7 * 86400000 &&
    new Date(listing.expiry_date).getTime() > Date.now();

  const ctaLabel = listing.category === 'Events' ? 'Register' :
    listing.category === 'Jobs' ? 'Apply now' : 'Visit website';

  const truncDesc = listing.description.length > 155
    ? listing.description.slice(0, 155) + '...'
    : listing.description;

  return (
    <>
      <SEO
        title={`${listing.title} \u2014 What's On Youth`}
        description={truncDesc}
        ogTitle={listing.title}
        ogDescription={truncDesc}
        ogUrl={`https://www.whatsonyouth.org.au/listings/${listing.id}`}
        ogImage={listing.image_url || undefined}
        ogType="article"
        canonical={`https://www.whatsonyouth.org.au/listings/${listing.id}`}
      />
      <Navbar />

      <div className="bg-white min-h-screen overflow-x-hidden">
        {/* Back link */}
        <div className="px-6 md:px-16 py-4 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(backRoute)}
            className="flex items-center gap-1.5 font-body font-medium text-sm text-brand-violet hover:underline min-h-[44px] w-full md:w-auto"
          >
            <ArrowLeft size={14} />
            Back to {listing.category}
          </button>
        </div>

        <div className="px-6 md:px-16 pb-16 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
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

            {/* Image */}
            <div className="mt-6 rounded-xl overflow-hidden max-h-[360px]" style={{ backgroundColor: placeholderColor }}>
              {listing.image_url ? (
                <img src={listing.image_url} alt={listing.title} className="w-full max-h-[360px] object-cover" />
              ) : (
                <div className="w-full h-[200px]" />
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
              <p className="font-body text-base text-brand-text-secondary leading-[1.7] whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 mt-6 font-body text-[15px] text-brand-text-secondary">
              <MapPin size={16} />
              <span>{listing.location}</span>
            </div>

            {/* Source */}
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

          {/* Right sidebar — becomes full-width on mobile */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            <div className="lg:sticky lg:top-6 bg-white border border-brand-card-border rounded-xl p-6 space-y-5">
              {/* Date info */}
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

              {/* CTA */}
              <a
                href={listing.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-coral text-white font-heading font-bold text-base rounded-lg py-3.5 transition-colors hover:bg-brand-coral-light min-h-[48px]"
              >
                {ctaLabel}
                <ExternalLink size={14} />
              </a>

              {/* Share */}
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 w-full border border-brand-card-border text-brand-text-primary font-body font-medium text-sm rounded-lg py-3 hover:bg-brand-section-alt transition-colors min-h-[48px]"
              >
                {copied ? <><Check size={14} /> Link copied!</> : <><Copy size={14} /> Share this listing</>}
              </button>

              {/* Posted date */}
              <p className="font-body text-[13px] text-brand-text-muted">
                Listed {daysAgo(listing.created_at)}
              </p>

              {/* Report */}
              <button
                onClick={() => setShowReport(true)}
                className="font-body text-xs text-brand-footer-link hover:underline min-h-[44px]"
              >
                Report this listing
              </button>
            </div>
          </div>
        </div>
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
