import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, List, PlusCircle, Star, Radar, Users, Settings, Menu, X, ExternalLink, ScanSearch } from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Listings', href: '/admin/listings', icon: List },
  { label: 'Add listing', href: '/admin/add', icon: PlusCircle },
  { label: 'Featured', href: '/admin/featured', icon: Star },
  { label: 'Scanner', href: '/admin/scanner', icon: Radar },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Scan log', href: '/admin/scan-log', icon: ScanSearch },
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
                  ? 'bg-[#1A1A1A] text-white border-l-[3px] border-brand-violet'
                  : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-white border-l-[3px] border-transparent'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-5 border-t border-[#1A1A1A]">
        <p className="font-body text-xs text-[#555555] truncate">{user?.email}</p>
        <div className="flex flex-col gap-1 mt-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[13px] text-[#888888] hover:text-white transition-colors flex items-center gap-1.5"
          >
            View site <ExternalLink size={12} />
          </a>
          <button
            onClick={signOut}
            className="font-body text-[13px] text-[#888888] hover:text-white transition-colors text-left"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#0A0A0A] text-white p-2 rounded-lg"
        aria-label="Open admin menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[240px] h-full bg-[#0A0A0A]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-[#888888]"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="hidden md:flex md:flex-col md:w-[240px] md:min-h-screen bg-[#0A0A0A] flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
