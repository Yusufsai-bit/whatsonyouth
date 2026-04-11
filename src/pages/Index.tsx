import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import FeaturedOpportunities from '@/components/FeaturedOpportunities';
import SubmitCallout from '@/components/SubmitCallout';
import RegionalBanner from '@/components/RegionalBanner';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Index = () => (
  <>
    <SEO
      title="What's On Youth — Events, Jobs, Grants & More for Young Victorians"
      description="Victoria's free platform for young people aged 15–25. Discover events, jobs, grants, programs, and wellbeing support all in one place."
      ogUrl="https://www.whatsonyouth.org.au"
      canonical="https://www.whatsonyouth.org.au"
    />
    <Navbar />
    <Hero />
    <CategoryGrid />
    <FeaturedOpportunities />
    <SubmitCallout />
    <RegionalBanner />
    <HowItWorks />
    <Footer />
  </>
);

export default Index;
