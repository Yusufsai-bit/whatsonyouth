import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '@/assets/woy-logo-reversed.svg';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Grants', href: '/grants' },
  { label: 'Programs', href: '/programs' },
  { label: 'Wellbeing', href: '/wellbeing' },
  { label: 'Submit a listing', href: '/submit' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-brand-forest h-14 md:h-16 flex items-center px-6 md:px-16 justify-between relative z-50">
      <Link to="/">
        <img src={logo} alt="What's On Youth" className="h-[30px]" />
      </Link>

      <Link
        to="/submit"
        className="hidden md:inline-block bg-brand-coral text-white font-body font-medium text-sm rounded-full px-[18px] py-2 transition-colors duration-100 hover:bg-brand-coral-light"
      >
        Submit a listing
      </Link>

      <button
        className="md:hidden text-brand-seafoam"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-brand-forest z-50 flex flex-col px-6 pt-4">
          <div className="flex justify-end">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-brand-seafoam">
              <X size={28} />
            </button>
          </div>
          <div className="flex flex-col gap-5 mt-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className="font-heading font-bold text-[22px] text-white hover:text-brand-seafoam transition-colors duration-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
