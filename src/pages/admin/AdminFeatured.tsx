import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { StatusBadge } from '@/pages/admin/AdminDashboard';
import { Star, GripVertical, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface FeaturedListing {
  id: string;
  title: string;
  organisation: string;
  category: string;
  is_active: boolean;
  featured_order: number;
  image_url: string | null;
}

export default function AdminFeatured() {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const fetchFeatured = async () => {
    const { data } = await supabase
      .from('listings')
      .select('id, title, organisation, category, is_active, featured_order, image_url')
      .eq('is_featured', true)
      .order('featured_order', { ascending: true });
    if (data) setListings(data);
  };

  useEffect(() => { fetchFeatured(); }, []);

  const removeFeatured = async (id: string) => {
    await supabase.from('listings').update({ is_featured: false }).eq('id', id);
    toast('Removed from featured');
    fetchFeatured();
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDrop = async (dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const reordered = [...listings];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setListings(reordered);
    setDragIdx(null);
    
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('listings').update({ featured_order: i } as any).eq('id', reordered[i].id);
    }
    toast('Order saved');
  };

  return (
    <AdminLayout>
      <AdminHeader title="Featured" />
      <div className="p-6 md:p-8 overflow-auto">
        {listings.length >= 6 && (
          <div className="bg-[#FFF3D0] text-[#633806] rounded-xl px-5 py-3 font-body text-sm mb-4">
            You have 6 featured listings — the maximum. Remove one before adding another.
          </div>
        )}

        {listings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="font-heading font-bold text-lg text-[#0A0A0A]">No featured listings yet.</h2>
              <p className="font-body text-sm text-[#888888] mt-2 max-w-[320px]">
                Go to Listings and click the star on any listing to feature it on the homepage.
              </p>
              <Link to="/admin/listings" className="inline-block mt-4 bg-[#5847E0] text-white font-heading font-bold text-sm rounded-lg px-5 py-2.5">
                Go to listings
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map((l, i) => (
              <div
                key={l.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                className="bg-white border border-[#EBEBEB] rounded-xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={16} className="text-[#888888] flex-shrink-0" />
                {l.image_url ? (
                  <img src={l.image_url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#F7F7F7] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-[#0A0A0A] truncate">{l.title}</p>
                  <p className="font-body text-xs text-[#888888]">{l.organisation}</p>
                </div>
                <span className="inline-block bg-[#F0EEFF] text-[#5847E0] font-body text-xs font-medium px-2 py-0.5 rounded-full hidden md:inline-block">{l.category}</span>
                <StatusBadge active={l.is_active} />
                <div className="flex items-center gap-2">
                  <Link to={`/admin/listings/${l.id}/edit`} className="text-[#888888] hover:text-[#5847E0]"><Pencil size={15} /></Link>
                  <button onClick={() => removeFeatured(l.id)} className="text-[#EF9F27] hover:text-[#888888]" title="Remove from featured">
                    <Star size={16} className="fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
