import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import FeaturedOpportunities from '@/components/FeaturedOpportunities';
import SubmitCallout from '@/components/SubmitCallout';
import RegionalBanner from '@/components/RegionalBanner';
import HowItWorks from '@/components/HowItWorks';
import RecentlyViewed from '@/components/RecentlyViewed';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const Index = () => {
  const [newCount, setNewCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const lastVisit = localStorage.getItem('woy_last_visit');
    const now = Date.now();
    localStorage.setItem('woy_last_visit', String(now));

    if (lastVisit && now - Number(lastVisit) > 6 * 60 * 60 * 1000) {
      const lastDate = new Date(Number(lastVisit)).toISOString();
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gt('created_at', lastDate)
        .then(({ count }) => {
          if (count && count > 0) {
            setNewCount(count);
            setShowBanner(true);
          }
        });
    }
  }, []);

  return (
    <>
      <SEO
        title="What's On Youth — Free Events, Jobs, Grants & Support for Young Victorians"
        description="Victoria's free platform for young people aged 15–25. Find free events, entry-level jobs, grants, youth programs and mental health support across Melbourne, Geelong, Ballarat, Bendigo and all of Victoria."
        ogUrl="https://www.whatsonyouth.org.au"
        canonical="https://www.whatsonyouth.org.au"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "What's On Youth",
          "url": "https://www.whatsonyouth.org.au",
          "logo": "https://www.whatsonyouth.org.au/woy-favicon.svg",
          "description": "Free platform connecting young Victorians aged 15-25 with events, jobs, grants, programs and wellbeing support.",
          "areaServed": {
            "@type": "State",
            "name": "Victoria",
            "containedInPlace": { "@type": "Country", "name": "Australia" }
          },
          "audience": {
            "@type": "Audience",
            "audienceType": "Young people aged 15-25",
            "geographicArea": { "@type": "State", "name": "Victoria, Australia" }
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@whatsonyouth.org.au",
            "contactType": "Customer Support"
          },
          "sameAs": ["https://www.instagram.com/whatsonyouth"]
        })}</script>
      </Helmet>
      <Navbar />
      {showBanner && (
        <div className="bg-brand-violet-surface border-b border-brand-violet-border px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="font-body text-sm text-brand-text-primary">
              ✨ {newCount} new listing{newCount > 1 ? 's' : ''} added since your last visit
              <Link to="/search" className="text-brand-violet font-medium hover:underline ml-2">
                See what's new
              </Link>
            </p>
            <button onClick={() => setShowBanner(false)} className="text-brand-text-muted hover:text-brand-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <Hero />
      <p className="sr-only">
        What's On Youth is Victoria's free platform for young people aged 15 to 25. Find free events near you, entry level jobs and internships, grants and scholarships, youth programs and courses, and mental health and wellbeing support — all in one place. Serving Melbourne, Geelong, Ballarat, Bendigo, Shepparton, Gippsland, Mildura, Warrnambool, Frankston and all of regional Victoria. Updated every Tuesday and Friday.
      </p>
      <CategoryGrid />
      <FeaturedOpportunities />
      <RecentlyViewed />
      <SubmitCallout />
      <RegionalBanner />
      <HowItWorks />
      <Footer />
    </>
  );
};

export default Index;
