const locations = ['Ballarat', 'Bendigo', 'Geelong', 'Gippsland', 'Shepparton'];

export default function RegionalBanner() {
  return (
    <section className="bg-brand-forest px-6 py-10 md:px-16 md:py-14">
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-block bg-brand-teal text-brand-seafoam font-body font-medium text-xs rounded-full px-3 py-1 mb-4">
          Not just Melbourne
        </span>
        <h2 className="text-[28px] text-white">Built for all of Victoria</h2>
        <p className="font-body text-base text-brand-soft-teal leading-relaxed max-w-[560px] mx-auto mt-3">
          From Ballarat to Bendigo, Geelong to Gippsland — we surface opportunities from across the state, not just the CBD.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {locations.map((loc) => (
            <span
              key={loc}
              className="border border-brand-mid-teal text-brand-soft-teal font-body text-sm rounded-full px-3.5 py-1.5"
            >
              {loc}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
