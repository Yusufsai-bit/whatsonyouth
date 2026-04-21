import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const stats = [
  { value: '15–25', label: 'Target age range' },
  { value: 'Victoria-wide', label: 'Including regional areas' },
  { value: '5 categories', label: 'Events, jobs, grants, programs, wellbeing' },
  { value: 'Free', label: 'Always free to use and submit' },
];

const beliefs = [
  {
    title: 'Not just Melbourne',
    body: 'Most opportunity platforms focus on the city. We actively source and surface opportunities from regional Victoria — Ballarat, Bendigo, Geelong, Gippsland, and beyond.',
  },
  {
    title: 'Trustworthy by design',
    body: 'Every listing is either curated by our team or submitted by verified community members. No spam, no clickbait, no irrelevant content.',
  },
  {
    title: 'Wellbeing is a first-class category',
    body: 'We treat wellbeing and support as equal to jobs and events — because for some young people, finding the right support is the most important opportunity of all.',
  },
];

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About What's On Youth — Free Youth Opportunity Platform for Victoria"
        description="What's On Youth is a free platform connecting young Victorians aged 15–25 with events, jobs, grants, programs and wellbeing support. Victoria-wide, including Melbourne, Geelong, Ballarat, Bendigo and regional Victoria."
        ogUrl="https://www.whatsonyouth.org.au/about"
        canonical="https://www.whatsonyouth.org.au/about"
      />
      <Navbar />

      {/* Hero */}
      <section className="bg-brand-dark px-6 py-12 md:px-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <span className="inline-block bg-brand-violet text-white font-body font-medium text-xs rounded-full px-3 py-1 mb-4">
            Our story
          </span>
          <h1 className="text-[28px] md:text-[52px] leading-[1.15] tracking-[-0.02em] text-white max-w-[640px]">
            Built for young Victorians
          </h1>
          <p className="font-body text-lg text-brand-footer-link leading-[1.7] max-w-[560px] mt-5">
            What's On Youth is a free platform that connects young people aged 15–25 across Victoria with events, jobs, grants, programs, and wellbeing support — all in one place.
          </p>
          <p className="font-body text-base text-brand-footer-link leading-[1.7] max-w-[560px] mt-4">
            What's On Youth is an independent platform built and run by Yusuf Sai, a young Victorian passionate about making opportunity discovery easier for everyone across the state.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-section-alt px-6 py-10 md:px-16 md:py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.value} className="bg-white border border-brand-card-border rounded-xl p-6">
              <p className="font-heading font-bold text-[28px] text-brand-text-primary">{s.value}</p>
              <p className="font-body text-sm text-brand-text-muted mt-1.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we believe */}
      <section className="bg-white px-6 py-12 md:px-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <p className="font-body font-medium text-[13px] text-brand-violet uppercase tracking-[0.06em] mb-3">
            What we believe
          </p>
          <h2 className="font-heading font-bold text-[28px] md:text-[36px] text-brand-text-primary max-w-[600px] leading-[1.2] mb-10">
            Every young Victorian deserves access to opportunity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {beliefs.map((b) => (
              <div key={b.title} className="bg-brand-section-alt rounded-xl p-6 border-l-[3px] border-brand-violet">
                <h3 className="font-heading font-bold text-[17px] text-brand-text-primary mb-2">{b.title}</h3>
                <p className="font-body text-sm text-brand-text-secondary leading-[1.7]">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For organisations */}
      <section className="bg-brand-section-alt px-6 py-12 md:px-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <p className="font-body font-medium text-[13px] text-brand-violet uppercase tracking-[0.06em] mb-3">
            For organisations
          </p>
          <h2 className="font-heading font-bold text-[28px] md:text-[36px] text-brand-text-primary leading-[1.2] mb-4">
            Share your opportunities for free
          </h2>
          <p className="font-body text-base text-brand-text-secondary max-w-[560px] leading-[1.7] mb-8">
            Whether you're a council, community group, employer, or arts organisation — if you have something for young Victorians, we want to share it.
          </p>
          <Link
            to="/submit"
            className="inline-block bg-brand-coral text-white font-heading font-bold text-base rounded-lg px-8 py-3.5 hover:bg-brand-coral-light transition-colors"
          >
            Submit a listing
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-brand-dark px-6 py-10 md:px-16 md:py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-heading font-bold text-[32px] text-white mb-3">Get in touch</h2>
          <p className="font-body text-base text-brand-footer-link mb-6">
            Have a question, want to partner with us, or found something that needs fixing?
          </p>
          <a
            href="mailto:info@whatsonyouth.org.au"
            className="font-heading font-bold text-[20px] text-brand-coral hover:text-brand-coral-light transition-colors"
          >
            info@whatsonyouth.org.au
          </a>
          <p className="font-body text-[13px] text-brand-text-secondary mt-3">
            We aim to respond within 2 business days.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
