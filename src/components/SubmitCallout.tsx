import { Link } from 'react-router-dom';

const steps = [
  'Fill in your listing details',
  'Create a free account or log in',
  'Your listing goes live immediately and reaches young Victorians',
];

export default function SubmitCallout() {
  return (
    <section className="bg-brand-violet px-6 py-12 md:px-16 md:py-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:gap-16">
        <div className="flex-1 mb-10 md:mb-0">
          <span className="inline-block bg-brand-ink-mid text-brand-mist font-body font-medium text-xs rounded-full px-3 py-1 mb-4">
            For organisations and community groups
          </span>
          <h2 className="text-[32px] text-white">Have an opportunity to share?</h2>
          <p className="font-body text-base text-brand-mist leading-relaxed max-w-[440px] mt-3">
            Submit your event, job, grant, program, or wellbeing resource for free. Create a free account to get started — your listing goes live immediately.
          </p>
          <Link
            to="/submit"
            className="inline-block bg-brand-coral text-white font-heading font-bold text-base rounded-lg px-7 py-3.5 mt-6 transition-colors duration-100 hover:bg-brand-coral-light"
          >
            Submit a listing
          </Link>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-ink-mid flex items-center justify-center shrink-0">
                <span className="font-heading font-bold text-sm text-brand-mist">{i + 1}</span>
              </div>
              <p className="font-body text-[15px] text-brand-mist">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
