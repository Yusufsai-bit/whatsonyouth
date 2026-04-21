import { Link } from 'react-router-dom';
import { Mail, Flag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

export default function ContactPage() {
  return (
    <>
      <SEO title="Contact — What's On Youth" description="Get in touch with the What's On Youth team. General enquiries, partnerships, or report a listing." canonical="https://www.whatsonyouth.org.au/contact" />
      <Navbar />
      <div className="min-h-screen">
        {/* Hero */}
        <section className="bg-brand-dark px-6 py-16 md:px-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[28px] md:text-[48px] leading-[1.1] tracking-[-0.03em] text-white mb-4">Get in touch</h1>
            <p className="font-body text-lg text-brand-footer-link max-w-[520px] mx-auto">
              Have a question, want to partner with us, or need to report a listing? We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact cards */}
        <section className="bg-white px-6 py-12 md:px-16 md:py-16">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-brand-card-border rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-brand-violet-surface flex items-center justify-center mb-3">
                <Mail size={20} className="text-brand-violet" />
              </div>
              <h2 className="font-heading font-bold text-[17px] text-brand-text-primary mb-2">General enquiries</h2>
              <p className="font-body text-sm text-brand-text-secondary mb-4">
                For questions about the platform, partnerships, or media enquiries.
              </p>
              <a href="mailto:info@whatsonyouth.org.au" className="font-body text-sm text-brand-violet hover:underline">
                info@whatsonyouth.org.au
              </a>
            </div>

            <div className="border border-brand-card-border rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-brand-violet-surface flex items-center justify-center mb-3">
                <Flag size={20} className="text-brand-violet" />
              </div>
              <h2 className="font-heading font-bold text-[17px] text-brand-text-primary mb-2">Report a listing</h2>
              <p className="font-body text-sm text-brand-text-secondary mb-4">
                Found something incorrect, expired, or inappropriate? Let us know.
              </p>
              <Link to="/search" className="font-body text-sm text-brand-violet hover:underline">
                Find and report a listing →
              </Link>
            </div>
          </div>
        </section>

        {/* Submit CTA */}
        <section className="bg-brand-section-alt px-6 py-12 md:px-16 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading font-bold text-[24px] text-brand-text-primary mb-3">Submit an opportunity</h2>
            <p className="font-body text-base text-brand-text-secondary max-w-[480px] mx-auto mb-6">
              Are you an organisation with an opportunity for young Victorians? Submit it for free.
            </p>
            <Link
              to="/submit"
              className="inline-flex items-center justify-center bg-brand-coral text-white font-heading font-bold text-base rounded-lg px-7 py-3.5 transition-colors duration-100 hover:bg-brand-coral-light min-h-[48px]"
            >
              Submit a listing
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
