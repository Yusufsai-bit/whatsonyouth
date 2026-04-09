import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, List, PlusCircle, Star, Users, Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'All listings', href: '/admin/listings', icon: List },
  { label: 'Add listing', href: '/admin/add', icon: PlusCircle },
  { label: 'Featured', href: '/admin/featured', icon: Star },
  { label: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-violet" />
          <span className="font-heading font-bold text-[16px] text-white">WOY Admin</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 mt-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-md font-body text-sm transition-colors duration-100 ${
                active
                  ? 'bg-[#1A1A1A] text-white border-l-2 border-brand-violet'
                  : 'text-brand-text-muted hover:bg-[#1A1A1A] hover:text-white border-l-2 border-transparent'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-5 border-t border-brand-footer-divider">
        <p className="font-body text-xs text-brand-text-secondary truncate">{user?.email}</p>
        <button
          onClick={signOut}
          className="font-body text-[13px] text-brand-text-muted hover:text-white transition-colors mt-1"
        >
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-brand-dark text-white p-2 rounded-lg"
        aria-label="Open admin menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[240px] h-full bg-brand-dark">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-brand-text-muted"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-[240px] md:min-h-screen bg-brand-dark flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
