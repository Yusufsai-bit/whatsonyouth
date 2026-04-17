import { Link } from 'react-router-dom';

const locations = ['Ballarat', 'Bendigo', 'Geelong', 'Gippsland', 'Shepparton'];

export default function RegionalBanner() {
  return (
    <section className="bg-brand-dark px-6 py-8 md:px-16 md:py-14">
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-block bg-brand-violet text-white font-body font-medium text-xs rounded-full px-3 py-1 mb-4">
          Not just Melbourne
        </span>
        <h2 className="text-[28px] md:text-[32px] tracking-[-0.02em] text-white">Built for all of Victoria</h2>
        <p className="font-body text-base text-brand-footer-link leading-relaxed max-w-[560px] mx-auto mt-3">
          From Ballarat to Bendigo, Geelong to Gippsland — we surface opportunities from across the state, not just the CBD.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {locations.map((loc) => (
            <Link
              key={loc}
              to={`/search?location=${encodeURIComponent(loc)}`}
              className="border border-brand-loc-border text-brand-text-muted font-body text-sm rounded-full px-3.5 py-1.5 transition-colors duration-150 hover:border-brand-violet hover:text-white"
            >
              {loc}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
