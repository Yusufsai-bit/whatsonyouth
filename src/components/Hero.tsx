import { Link } from 'react-router-dom';

const heroCards = [
  { label: 'Events', bg: '#2D1B69' },
  { label: 'Jobs', bg: '#1A3A2A' },
  { label: 'Grants', bg: '#3D1515' },
  { label: 'Programs', bg: '#0A2A3D' },
];

export default function Hero() {
  return (
    <section className="bg-white px-6 py-12 md:px-16 md:py-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:gap-16">
        <div className="flex-1">
          <span className="inline-block bg-brand-violet-surface text-brand-violet font-body font-medium text-xs rounded-full px-3 py-1 mb-3.5">
            Victoria-wide · Free to use
          </span>
          <h1 className="text-[48px] md:text-[72px] leading-[1.1] tracking-[-0.03em] text-brand-text-primary mb-4">
            Your next opportunity starts here
          </h1>
          <p className="font-body text-lg text-brand-text-secondary leading-relaxed max-w-[480px] mb-8">
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
              className="border-2 border-brand-dark text-brand-dark font-heading font-bold text-base rounded-lg px-7 py-3.5 text-center transition-colors duration-100 hover:bg-brand-section-alt"
            >
              Submit a listing
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="w-[480px] h-[360px] grid grid-cols-2 gap-2">
            {heroCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl relative overflow-hidden"
                style={{ backgroundColor: card.bg }}
              >
                <span className="absolute bottom-3 left-3 bg-white/90 text-brand-text-primary font-body font-medium text-xs rounded-full px-2.5 py-1">
                  {card.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
