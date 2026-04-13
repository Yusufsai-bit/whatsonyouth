import { Link } from 'react-router-dom';

const heroCards = [
  { label: 'Events', bg: '#2D1B69', image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80' },
  { label: 'Jobs', bg: '#1A2A4A', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80' },
  { label: 'Grants', bg: '#1A3A2A', image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80' },
  { label: 'Programs', bg: '#0A2A3A', image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&q=80' },
];

export default function Hero() {
  return (
    <section className="bg-white px-6 py-10 md:px-16 md:py-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:gap-16">
        <div className="flex-1">
          <span className="inline-block bg-brand-violet-surface text-brand-violet font-body font-medium text-xs rounded-full px-3 py-1 mb-3.5">
            Victoria-wide · Free to use
          </span>
          <h1 className="text-[40px] md:text-[72px] leading-[1.1] tracking-[-0.03em] text-brand-text-primary mb-4">
            Your next opportunity starts here
          </h1>
          <p className="font-body text-lg text-brand-text-secondary leading-relaxed max-w-[480px] mb-8">
            Discover events, jobs, grants, programs, and wellbeing support — all in one place, built for young Victorians.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/events"
              className="bg-brand-coral text-white font-heading font-bold text-base rounded-lg px-7 py-3.5 text-center transition-colors duration-100 hover:bg-brand-coral-light min-h-[48px] flex items-center justify-center"
            >
              Explore opportunities
            </Link>
            <Link
              to="/submit"
              className="border-2 border-brand-dark text-brand-dark font-heading font-bold text-base rounded-lg px-7 py-3.5 text-center transition-colors duration-100 hover:bg-brand-section-alt min-h-[48px] flex items-center justify-center"
            >
              Submit a listing
            </Link>
          </div>
        </div>

        {/* Desktop image grid */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="w-[480px] h-[360px] grid grid-cols-2 gap-2">
            {heroCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl relative overflow-hidden"
                style={{ backgroundColor: card.bg }}
              >
                <img
                  src={card.image}
                  alt={card.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-black/20" />
                <span className="absolute bottom-3 left-3 bg-white/90 text-brand-text-primary font-body font-medium text-xs rounded-full px-2.5 py-1">
                  {card.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile image grid */}
        <div className="flex md:hidden mt-8">
          <div className="w-full grid grid-cols-2 gap-2">
            {heroCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl relative overflow-hidden h-[140px]"
                style={{ backgroundColor: card.bg }}
              >
                <img
                  src={card.image}
                  alt={card.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-black/20" />
                <span className="absolute bottom-2 left-2 bg-white/90 text-brand-text-primary font-body font-medium text-[11px] rounded-full px-2 py-0.5">
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
