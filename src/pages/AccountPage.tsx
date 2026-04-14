import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import PasswordStrengthBar from '@/components/PasswordStrengthBar';
import { MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Listing {
  id: string;
  title: string;
  category: string;
  organisation: string;
  location: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  source: string;
  created_at: string;
  expiry_date: string | null;
}

const categoryColors: Record<string, string> = {
  Events: '#2D1B69',
  Jobs: '#1A2A4A',
  Grants: '#1A3A2A',
  Programs: '#2D1B4A',
  Wellbeing: '#2A1A3A',
};

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (user) {
      supabase
        .from('listings')
        .select('id, title, category, organisation, location, description, image_url, is_active, source, created_at, expiry_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setListings(data);
          setLoadingListings(false);
        });
    }
  }, [user]);

  const toggleActive = async (listing: Listing) => {
    const newStatus = !listing.is_active;
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_active: newStatus } : l));
    const { error } = await supabase.from('listings').update({ is_active: newStatus }).eq('id', listing.id);
    if (error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_active: !newStatus } : l));
      toast.error('Failed to update listing status.');
    } else {
      toast.success(newStatus ? 'Listing reactivated.' : 'Listing deactivated.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }

    setPwLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInError) {
      setPwLoading(false);
      setPwError('Current password is incorrect');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const firstName = user.user_metadata?.first_name || '';
  const inputClass = "w-full border border-[#DDDDDD] rounded-lg px-3.5 py-3 font-body text-[15px] text-[#0A0A0A] focus:outline-none focus:border-[#5847E0]";

  return (
    <>
      <SEO title="My Account — What's On Youth" description="Manage your listings and account settings." noindex />
      <Navbar />
      <div className="bg-white min-h-screen px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading font-bold text-[28px] text-[#0A0A0A]">My account</h1>
            <button
              onClick={signOut}
              className="font-body text-sm text-[#555555] hover:text-[#5847E0] transition-colors"
            >
              Log out
            </button>
          </div>

          {/* Account details */}
          <div className="mb-8">
            {firstName && (
              <p className="font-body text-base text-[#0A0A0A]">{firstName}</p>
            )}
            <p className="font-body text-sm text-[#555555]">{user.email}</p>
            <p className="font-body text-sm text-[#888888] mt-1">
              You have submitted {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </p>
          </div>

          <h2 className="font-heading font-bold text-xl text-[#0A0A0A] mb-4">My listings</h2>

          {loadingListings ? (
            <div className="flex flex-col gap-4 mb-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-40 h-32 skeleton-shimmer" />
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="skeleton-shimmer rounded h-3 w-[40%]" />
                      <div className="skeleton-shimmer rounded h-4 w-[70%]" />
                      <div className="skeleton-shimmer rounded h-3 w-[50%]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center py-12 mb-6">
              <h3 className="font-heading font-bold text-[18px] text-[#0A0A0A] mb-2">You haven't submitted any listings yet</h3>
              <p className="font-body text-sm text-[#888888] mb-6 text-center max-w-md">
                Share an opportunity with young Victorians — it's free and takes less than 2 minutes.
              </p>
              <Link
                to="/submit"
                className="bg-[#C04A22] text-white font-heading font-bold text-[15px] rounded-lg px-6 py-3 transition-colors duration-100 hover:bg-[#D96840]"
              >
                Submit your first listing
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mb-6">
              {listings.map((listing) => {
                const color = categoryColors[listing.category] || '#2D1B69';
                return (
                  <div key={listing.id} className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden relative">
                    {!listing.is_active && (
                      <div className="bg-[#F0F0F0] px-4 py-2 font-body text-xs text-[#888888]">
                        Inactive — not visible to the public
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-40 h-32 sm:h-auto flex-shrink-0 relative" style={{ backgroundColor: color }}>
                        {listing.image_url && (
                          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">
                          {listing.category}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="font-body text-xs text-[#888888] uppercase tracking-[0.04em] mb-1">
                          {listing.organisation}
                        </p>
                        <h3 className="font-heading font-bold text-[16px] text-[#0A0A0A] leading-[1.3] mb-1 line-clamp-2">
                          {listing.title}
                        </h3>
                        <div className="flex items-center gap-1.5 font-body text-[13px] text-[#555555] mb-1">
                          <MapPin size={13} className="flex-shrink-0" />
                          <span>{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-body text-xs text-[#888888] mb-3">
                          <Calendar size={12} className="flex-shrink-0" />
                          <span>Posted {daysAgo(listing.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-auto">
                          <Link
                            to={`/listings/${listing.id}/edit`}
                            className="font-body font-medium text-[13px] text-[#5847E0] hover:underline"
                          >
                            Edit listing
                          </Link>
                          <button
                            onClick={() => toggleActive(listing)}
                            className={`font-body font-medium text-[13px] hover:underline ${listing.is_active ? 'text-[#888888]' : 'text-[#1D9E75]'}`}
                          >
                            {listing.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            to="/submit"
            className="inline-block bg-[#C04A22] text-white font-heading font-bold text-[15px] rounded-lg px-6 py-3 transition-colors duration-100 hover:bg-[#D96840]"
          >
            Submit a new listing
          </Link>

          {/* Password and security */}
          <div className="mt-12">
            <h2 className="font-heading font-bold text-lg text-[#0A0A0A] mb-4">Password and security</h2>
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-6 max-w-[480px]">
              {pwSuccess && (
                <div className="bg-[#E1F5EE] text-[#085041] rounded-lg px-4 py-3 font-body text-sm mb-4">
                  Password updated successfully.
                </div>
              )}
              {pwError && (
                <p className="font-body text-sm text-[#C04A22] mb-4">{pwError}</p>
              )}
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                <div>
                  <label className="font-body font-medium text-sm text-[#0A0A0A] block mb-1.5">Current password</label>
                  <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="font-body font-medium text-sm text-[#0A0A0A] block mb-1.5">New password</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} />
                  <PasswordStrengthBar password={newPassword} />
                </div>
                <div>
                  <label className="font-body font-medium text-sm text-[#0A0A0A] block mb-1.5">Confirm new password</label>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
                </div>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="bg-[#5847E0] text-white font-heading font-bold text-[15px] rounded-lg px-6 py-3 transition-colors duration-100 hover:opacity-90 disabled:opacity-50 w-fit"
                >
                  {pwLoading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
