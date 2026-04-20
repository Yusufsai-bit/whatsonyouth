import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/woy-logo-reversed.svg';

const exploreLinks = [
  { label: 'Events', href: '/events' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Grants', href: '/grants' },
  { label: 'Programs', href: '/programs' },
  { label: 'Wellbeing', href: '/wellbeing' },
];

const platformLinks = [
  { label: 'Submit a listing', href: '/submit' },
  { label: 'Sign up', href: '/signup' },
  { label: 'Log in', href: '/login' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Instagram ↗', href: 'https://instagram.com/whatsonyouth', external: true },
];

export default function Footer() {
  const [digestEmail, setDigestEmail] = useState('');
  const [digestSubmitted, setDigestSubmitted] = useState(false);
  const [digestError, setDigestError] = useState('');
  const [digestLoading, setDigestLoading] = useState(false);

  const handleDigest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!digestEmail.trim()) return;
    setDigestLoading(true);
    setDigestError('');

    const { error } = await supabase.from('digest_subscribers').insert({ email: digestEmail.trim().toLowerCase() });

    setDigestLoading(false);
    if (error) {
      if (error.code === '23505') {
        setDigestError('Already subscribed!');
      } else {
        setDigestError('Something went wrong. Try again.');
      }
    } else {
      setDigestSubmitted(true);
    }
  };

  return (
    <footer className="bg-brand-dark px-6 py-10 md:px-16 md:py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <img src={logo} alt="What's On Youth" className="h-[26px] mb-2" />
          <p className="font-body text-sm text-brand-footer-text mt-2">Your opportunities, all in one place.</p>
          <p className="font-body text-[13px] text-brand-footer-text mt-1">Victoria, Australia</p>
        </div>

        <div>
          <p className="font-body font-medium text-[13px] text-brand-footer-link uppercase tracking-[0.06em] mb-3">Explore</p>
          {exploreLinks.map((link) => (
            <Link key={link.label} to={link.href} className="block font-body text-sm text-brand-footer-link hover:text-white transition-colors duration-100 mb-3 md:mb-2">
              {link.label}
            </Link>
          ))}
        </div>

        <div>
          <p className="font-body font-medium text-[13px] text-brand-footer-link uppercase tracking-[0.06em] mb-3">Platform</p>
          {platformLinks.map((link) => (
            'external' in link && link.external ? (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="block font-body text-sm text-brand-footer-link hover:text-white transition-colors duration-100 mb-3 md:mb-2">
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.href} className="block font-body text-sm text-brand-footer-link hover:text-white transition-colors duration-100 mb-3 md:mb-2">
                {link.label}
              </Link>
            )
          ))}
        </div>

        <div>
          <p className="font-body font-medium text-[13px] text-brand-footer-link uppercase tracking-[0.06em] mb-3">Stay updated</p>
          <p className="font-body text-sm text-brand-footer-text mb-3"></p>
          <form onSubmit={handleDigest} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={digestEmail}
              onChange={e => setDigestEmail(e.target.value)}
              className="flex-1 min-w-0 bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 font-body text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-brand-violet"
            />
            <button
              type="submit"
              disabled={digestLoading || digestSubmitted}
              className="bg-brand-violet text-white font-body font-medium text-sm rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
            >
              {digestSubmitted ? '✓' : 'Sign up'}
            </button>
          </form>
          {digestSubmitted && (
            <p className="font-body text-xs text-brand-footer-text mt-2">
              You're in! We'll email new opportunities twice a week.
            </p>
          )}
          {digestError && (
            <p className="font-body text-xs text-brand-footer-text mt-2">{digestError}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-brand-footer-divider mt-8 pt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
        <p className="font-body text-[13px] text-brand-footer-text">
          © {new Date().getFullYear()} What's On Youth. Built for young Victorians.
        </p>
        <span className="font-body text-[12px]" style={{ color: '#555555' }}>
          Photos from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#555555' }}>Unsplash</a>
        </span>
      </div>
    </footer>
  );
}
