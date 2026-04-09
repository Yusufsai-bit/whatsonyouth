import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import FeaturedOpportunities from '@/components/FeaturedOpportunities';
import SubmitCallout from '@/components/SubmitCallout';
import RegionalBanner from '@/components/RegionalBanner';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';

const Index = () => (
  <>
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
