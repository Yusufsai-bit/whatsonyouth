import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/woy-logo-reversed.svg';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Grants', href: '/grants' },
  { label: 'Programs', href: '/programs' },
  { label: 'Wellbeing', href: '/wellbeing' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase.rpc('is_admin', { _user_id: user.id }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  return (
    <nav className="bg-brand-dark h-14 md:h-[60px] flex items-center px-6 md:px-16 justify-between relative z-50 border-b border-brand-nav-border">
      <Link to="/">
        <img src={logo} alt="What's On Youth" className="h-[30px]" />
      </Link>

      <div className="hidden md:flex items-center gap-4">
        {!loading && user && isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-brand-coral hover:text-brand-coral-light transition-colors duration-100 font-body text-sm font-medium"
          >
            <Shield size={14} />
            <span>Admin</span>
          </Link>
        )}
        {!loading && user && (
          <Link
            to="/account"
            className="flex items-center gap-2 text-brand-nav-link hover:text-white transition-colors duration-100 font-body text-sm"
          >
            <User size={16} />
            <span>{user.email}</span>
          </Link>
        )}
        <Link
          to="/submit"
          className="bg-brand-coral text-white font-body font-medium text-sm rounded-full px-[18px] py-2 transition-colors duration-100 hover:bg-brand-coral-light"
        >
          Submit a listing
        </Link>
      </div>

      <button
        className="md:hidden text-brand-nav-link"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-brand-dark z-50 flex flex-col px-6 pt-4">
          <div className="flex justify-end">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-brand-nav-link">
              <X size={28} />
            </button>
          </div>
          <div className="flex flex-col gap-5 mt-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className="font-heading font-bold text-[22px] text-brand-nav-link hover:text-white transition-colors duration-100"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/submit"
              onClick={() => setOpen(false)}
              className="font-heading font-bold text-[22px] text-brand-nav-link hover:text-white transition-colors duration-100"
            >
              Submit a listing
            </Link>
            {!loading && user && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="font-heading font-bold text-[22px] text-brand-coral hover:text-brand-coral-light transition-colors duration-100 flex items-center gap-2"
              >
                <Shield size={20} />
                Admin
              </Link>
            )}
            {!loading && user ? (
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                className="font-heading font-bold text-[22px] text-brand-coral hover:text-brand-coral-light transition-colors duration-100"
              >
                My account
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="font-heading font-bold text-[22px] text-brand-coral hover:text-brand-coral-light transition-colors duration-100"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
