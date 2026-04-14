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
        title="What's On Youth — Events, Jobs, Grants & More for Young Victorians"
        description="Victoria's free platform for young people aged 15–25. Discover events, jobs, grants, programs, and wellbeing support all in one place."
        ogUrl="https://www.whatsonyouth.org.au"
        canonical="https://www.whatsonyouth.org.au"
      />
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
