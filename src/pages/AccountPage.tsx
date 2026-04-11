import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import PasswordStrengthBar from '@/components/PasswordStrengthBar';

interface Listing {
  id: string;
  title: string;
  category: string;
  organisation: string;
  location: string;
  created_at: string;
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);

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
        .select('id, title, category, organisation, location, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setListings(data);
        });
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }

    setPwLoading(true);
    // Verify current password by re-signing in
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

  const inputClass = "w-full border border-[#DDDDDD] rounded-lg px-3.5 py-3 font-body text-[15px] text-[#0A0A0A] focus:outline-none focus:border-[#5847E0]";

  return (
    <>
      <SEO title="My Account \u2014 What's On Youth" description="Manage your listings and account settings." noindex />
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
          <p className="font-body text-base text-[#555555] mb-8">
            Manage your submitted listings.
          </p>

          <h2 className="font-heading font-bold text-xl text-[#0A0A0A] mb-4">My listings</h2>

          {listings.length === 0 ? (
            <p className="font-body text-sm text-[#555555] mb-6">You haven't submitted any listings yet.</p>
          ) : (
            <div className="flex flex-col gap-4 mb-6">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white border border-[#EBEBEB] rounded-xl p-5">
                  <span className="inline-block bg-[#F0EEFF] text-[#5847E0] font-body font-medium text-xs rounded-full px-2.5 py-[3px]">
                    {listing.category}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#0A0A0A] mt-2">{listing.title}</h3>
                  <p className="font-body text-sm text-[#555555] mt-1">{listing.organisation}</p>
                  <p className="font-body text-[13px] text-[#888888] mt-1">{listing.location}</p>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/submit"
            className="inline-block bg-[#D85A30] text-white font-heading font-bold text-[15px] rounded-lg px-6 py-3 transition-colors duration-100 hover:bg-[#F0997B]"
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
                <p className="font-body text-sm text-[#D85A30] mb-4">{pwError}</p>
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
