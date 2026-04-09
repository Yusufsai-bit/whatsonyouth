import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OpportunityCard } from '@/components/FeaturedOpportunities';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <div className="bg-brand-page-bg min-h-screen px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-[28px] text-brand-forest">My account</h1>
            <button
              onClick={signOut}
              className="font-body text-sm text-brand-mid-teal hover:text-brand-teal transition-colors"
            >
              Log out
            </button>
          </div>
          <p className="font-body text-base text-brand-mid-teal mb-8">
            Manage your submitted listings.
          </p>

          <h2 className="text-xl text-brand-forest mb-4">My listings</h2>

          {listings.length === 0 ? (
            <p className="font-body text-sm text-brand-mid-teal mb-6">You haven't submitted any listings yet.</p>
          ) : (
            <div className="flex flex-col gap-4 mb-6">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white border border-brand-seafoam rounded-xl p-5">
                  <span className="inline-block bg-brand-mint text-brand-teal font-body font-medium text-xs rounded-full px-2.5 py-[3px]">
                    {listing.category}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-brand-forest mt-2">{listing.title}</h3>
                  <p className="font-body text-sm text-brand-mid-teal mt-1">{listing.organisation}</p>
                  <p className="font-body text-[13px] text-brand-mid-teal mt-1">{listing.location}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brand-seafoam">
                    <button className="font-body font-medium text-sm text-brand-teal hover:underline">Edit</button>
                    <div className="w-px h-4 bg-brand-seafoam" />
                    <button className="font-body font-medium text-sm text-brand-coral hover:underline">Remove listing</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/submit"
            className="inline-block bg-brand-coral text-white font-heading font-bold text-[15px] rounded-lg px-6 py-3 transition-colors duration-100 hover:bg-brand-coral-light"
          >
            Submit a new listing
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
