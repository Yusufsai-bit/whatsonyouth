import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const NotFound = () => (
  <>
    <Navbar />
    <div className="bg-white min-h-[calc(100vh-56px)] flex items-center justify-center px-6 py-[120px]">
      <div className="text-center">
        <p className="font-heading font-bold text-[120px] leading-none text-[#F0EEFF]">404</p>
        <h1 className="font-heading font-bold text-[32px] text-[#0A0A0A] mt-0">Page not found</h1>
        <p className="font-body text-base text-[#555555] max-w-[400px] mx-auto mt-3 mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-[#D85A30] text-white font-heading font-bold text-[15px] rounded-lg px-7 py-3 transition-colors hover:opacity-90 min-h-[48px] flex items-center justify-center"
          >
            Go to homepage
          </Link>
          <Link
            to="/search"
            className="border-2 border-[#0A0A0A] text-[#0A0A0A] font-heading font-bold text-[15px] rounded-lg px-7 py-3 transition-colors hover:bg-brand-section-alt min-h-[48px] flex items-center justify-center"
          >
            Browse opportunities
          </Link>
        </div>
      </div>
    </div>
    <Footer />
  </>
);

export default NotFound;
