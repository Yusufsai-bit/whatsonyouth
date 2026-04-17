const steps = [
  { title: 'Browse categories', desc: 'Pick from events, jobs, grants, programs, or wellbeing support.' },
  { title: 'Find your opportunity', desc: 'Read the details, check the date, and see if it\'s right for you.' },
  { title: 'Take action', desc: 'Click through to apply, register, or get in touch directly.' },
];

export default function HowItWorks() {
  return (
    <section className="bg-brand-section-alt px-6 py-8 md:px-16 md:py-16">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-[28px] md:text-[32px] tracking-[-0.02em] text-brand-text-primary">How it works</h2>
        <p className="font-body text-base text-brand-text-secondary mb-10">
          Three simple steps to find what you're looking for.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white border border-brand-card-border flex items-center justify-center">
                <span className="font-heading font-bold text-lg text-brand-violet">{i + 1}</span>
              </div>
              <h3 className="text-lg text-brand-text-primary mt-3">{step.title}</h3>
              <p className="font-body text-[15px] text-brand-text-secondary max-w-[260px] mt-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
