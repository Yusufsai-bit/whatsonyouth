import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="bg-brand-mint px-6 py-12 md:px-16 md:py-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:gap-16">
        <div className="flex-1">
          <span className="inline-block bg-brand-seafoam text-brand-dark-forest font-body font-medium text-xs rounded-full px-3 py-1 mb-3.5">
            Victoria-wide · Free to use
          </span>
          <h1 className="text-[48px] md:text-[64px] leading-[1.15] text-brand-forest mb-4">
            Your next opportunity starts here
          </h1>
          <p className="font-body text-lg text-brand-mid-teal leading-relaxed max-w-[480px] mb-8">
            Discover events, jobs, grants, programs, and wellbeing support — all in one place, built for young Victorians.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/events"
              className="bg-brand-coral text-white font-heading font-bold text-base rounded-lg px-7 py-3.5 text-center transition-colors duration-100 hover:bg-brand-coral-light"
            >
              Explore opportunities
            </Link>
            <Link
              to="/submit"
              className="border-2 border-brand-teal text-brand-teal font-heading font-bold text-base rounded-lg px-7 py-3.5 text-center transition-colors duration-100 hover:bg-brand-mint hover:text-brand-teal"
            >
              Submit a listing
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="w-[480px] h-[360px] bg-brand-seafoam rounded-2xl flex items-center justify-center">
            <span className="font-body text-sm text-brand-mid-teal">Hero illustration</span>
          </div>
        </div>
      </div>
    </section>
  );
}
