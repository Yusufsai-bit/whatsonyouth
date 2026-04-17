import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Shield, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import useSavedListings from '@/hooks/useSavedListings';
import logo from '@/assets/woy-logo-reversed.svg';

const categoryLinks = [
  { label: 'Events', href: '/events' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Grants', href: '/grants' },
  { label: 'Programs', href: '/programs' },
  { label: 'Wellbeing', href: '/wellbeing' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const location = window.location;
  const { savedIds } = useSavedListings();

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase.rpc('is_admin', { _user_id: user.id }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  const pathname = window.location.pathname;
  const isActive = (href: string) => pathname === href;

  const mobileLinkClass = "font-heading font-bold text-[20px] text-white py-3 border-b border-[#1A1A1A] block min-h-[44px] flex items-center";
  const mobileLinkInactive = "font-heading font-bold text-[20px] text-brand-nav-link hover:text-white py-3 border-b border-[#1A1A1A] block min-h-[44px] flex items-center";

  return (
    <nav className="bg-brand-dark h-14 md:h-[60px] flex items-center px-6 md:px-16 fixed top-0 left-0 right-0 z-40 border-b border-brand-nav-border">
      <Link to="/" className="shrink-0">
        <img src={logo} alt="What's On Youth" className="h-[30px]" />
      </Link>

      {/* Desktop category links */}
      <div className="hidden md:flex items-center justify-center gap-6 flex-1 mx-8">
        {categoryLinks.map(link => (
          <Link
            key={link.href}
            to={link.href}
            className={`font-body font-medium text-sm transition-colors duration-100 relative pb-0.5 ${
              isActive(link.href)
                ? 'text-white after:absolute after:bottom-[-10px] after:left-0 after:w-full after:h-[2px] after:bg-brand-coral'
                : 'text-brand-nav-link hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Desktop right side */}
      <div className="hidden md:flex items-center gap-3">
        <Link to="/search" className="text-brand-nav-link hover:text-white transition-colors duration-100">
          <Search size={18} />
        </Link>
        <Link to="/saved" className="relative text-brand-nav-link hover:text-white transition-colors duration-100">
          <Heart size={18} />
          {savedIds.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-brand-coral text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {savedIds.length > 9 ? '9+' : savedIds.length}
            </span>
          )}
        </Link>
        {!loading && user && isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-brand-coral hover:text-brand-coral-light transition-colors duration-100 font-body text-sm font-medium"
          >
            <Shield size={14} />
            <span>Admin</span>
          </Link>
        )}
        {!loading && user ? (
          <Link
            to="/account"
            className="font-body font-medium text-sm text-brand-nav-link hover:text-white transition-colors duration-100"
          >
            Account
          </Link>
        ) : !loading ? (
          <Link
            to="/login"
            className="font-body font-medium text-sm text-brand-nav-link hover:text-white transition-colors duration-100"
          >
            Log in
          </Link>
        ) : null}
        <Link
          to="/submit"
          className="bg-brand-coral text-white font-body font-medium text-sm rounded-full px-[18px] py-2 transition-colors duration-100 hover:bg-brand-coral-light"
        >
          Submit a listing
        </Link>
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center gap-2 ml-auto">
        <Link to="/saved" className="relative text-brand-nav-link hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Heart size={20} />
          {savedIds.length > 0 && (
            <span className="absolute top-1 right-1 bg-brand-coral text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {savedIds.length > 9 ? '9+' : savedIds.length}
            </span>
          )}
        </Link>
        <button
          className="text-brand-nav-link min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-brand-dark z-40 flex flex-col px-6 pt-4 overflow-y-auto">
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="flex flex-col mt-6">
            <Link to="/search" onClick={() => setOpen(false)} className={isActive('/search') ? mobileLinkClass : mobileLinkInactive}>
              Search
            </Link>
            <div className="border-b border-[#333] my-2" />
            {categoryLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setOpen(false)} className={isActive(link.href) ? mobileLinkClass : mobileLinkInactive}>
                {link.label}
              </Link>
            ))}
            <div className="border-b border-[#333] my-2" />
            <Link to="/saved" onClick={() => setOpen(false)} className={isActive('/saved') ? mobileLinkClass : mobileLinkInactive}>
              Saved {savedIds.length > 0 && `(${savedIds.length})`}
            </Link>
            <Link to="/submit" onClick={() => setOpen(false)} className={isActive('/submit') ? mobileLinkClass : mobileLinkInactive}>
              Submit a listing
            </Link>
            {!loading && user ? (
              <Link to="/account" onClick={() => setOpen(false)} className={isActive('/account') ? mobileLinkClass : mobileLinkInactive}>
                My account
              </Link>
            ) : !loading ? (
              <Link to="/login" onClick={() => setOpen(false)} className={isActive('/login') ? mobileLinkClass : mobileLinkInactive}>
                Log in
              </Link>
            ) : null}
            <Link to="/about" onClick={() => setOpen(false)} className={isActive('/about') ? mobileLinkClass : mobileLinkInactive}>
              About
            </Link>
            {!loading && user && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="font-heading font-bold text-[20px] text-brand-coral hover:text-brand-coral-light py-3 border-b border-[#1A1A1A] min-h-[44px] flex items-center gap-2"
              >
                <Shield size={18} />
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
