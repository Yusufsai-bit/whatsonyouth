import { Link } from 'react-router-dom';

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
  { label: 'Contact', href: '/about' },
  { label: 'Privacy policy', href: '/about' },
];

export default function Footer() {
  return (
    <footer className="bg-brand-forest px-6 py-10 md:px-16 md:py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-heading font-bold text-lg text-brand-seafoam">What's On Youth</p>
          <p className="font-body text-sm text-brand-mid-teal mt-2">Your opportunities, all in one place.</p>
          <p className="font-body text-[13px] text-brand-mid-teal mt-1">Victoria, Australia</p>
        </div>

        <div>
          <p className="font-body font-medium text-[13px] text-brand-soft-teal uppercase tracking-[0.06em] mb-3">Explore</p>
          {exploreLinks.map((link) => (
            <Link key={link.label} to={link.href} className="block font-body text-sm text-brand-soft-teal hover:text-white transition-colors duration-100 mb-2">
              {link.label}
            </Link>
          ))}
        </div>

        <div>
          <p className="font-body font-medium text-[13px] text-brand-soft-teal uppercase tracking-[0.06em] mb-3">Platform</p>
          {platformLinks.map((link) => (
            <Link key={link.label} to={link.href} className="block font-body text-sm text-brand-soft-teal hover:text-white transition-colors duration-100 mb-2">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-brand-forest-divider mt-8 pt-5">
        <p className="font-body text-[13px] text-brand-mid-teal text-center">
          © 2025 What's On Youth. Built for young Victorians.
        </p>
      </div>
    </footer>
  );
}
