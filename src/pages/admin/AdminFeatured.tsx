import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { StatusBadge, SourceBadge } from '@/pages/admin/AdminDashboard';
import { Star, GripVertical, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface FeaturedListing {
  id: string;
  title: string;
  organisation: string;
  category: string;
  is_active: boolean;
  source: string;
  featured_order: number;
  image_url: string | null;
}

export default function AdminFeatured() {
  const [listings, setListings] = useState<FeaturedListing[]>([]);

  const fetchFeatured = async () => {
    const { data } = await supabase
      .from('listings')
      .select('id, title, organisation, category, is_active, source, featured_order, image_url')
      .eq('is_featured', true)
      .order('featured_order', { ascending: true });
    if (data) setListings(data);
  };

  useEffect(() => { fetchFeatured(); }, []);

  const removeFeatured = async (id: string) => {
    await supabase.from('listings').update({ is_featured: false }).eq('id', id);
    toast('Removed from featured listings');
    fetchFeatured();
  };

  if (listings.length === 0) {
    return (
      <AdminLayout>
        <AdminHeader title="Featured" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-heading font-bold text-lg text-brand-text-primary">No featured listings yet.</h2>
            <p className="font-body text-sm text-brand-text-muted mt-2 max-w-[320px]">
              Go to All Listings and click the star on any listing to feature it on the homepage.
            </p>
            <Link to="/admin/listings" className="inline-block mt-4 bg-brand-violet text-white font-heading font-bold text-sm rounded-lg px-5 py-2.5">
              Go to all listings
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader title="Featured" />
      <div className="p-6 md:p-8 overflow-auto">
        <div className="bg-white border border-brand-card-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-brand-section-alt">
                <th className="w-10 px-3 py-3" />
                <th className="px-3 py-3 font-body font-medium text-[13px] text-brand-text-secondary text-left hidden md:table-cell">Image</th>
                <th className="px-3 py-3 font-body font-medium text-[13px] text-brand-text-secondary text-left">Title</th>
                <th className="px-3 py-3 font-body font-medium text-[13px] text-brand-text-secondary text-left hidden md:table-cell">Category</th>
                <th className="px-3 py-3 font-body font-medium text-[13px] text-brand-text-secondary text-left">Status</th>
                <th className="px-3 py-3 font-body font-medium text-[13px] text-brand-text-secondary text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l, i) => (
                <tr key={l.id} className={`h-12 ${i % 2 === 1 ? 'bg-brand-card-hover' : 'bg-white'}`}>
                  <td className="px-3 text-brand-text-muted"><GripVertical size={16} /></td>
                  <td className="px-3 hidden md:table-cell">
                    {l.image_url ? <img src={l.image_url} className="w-12 h-12 rounded-md object-cover" alt="" /> : <div className="w-12 h-12 rounded-md bg-brand-section-alt" />}
                  </td>
                  <td className="px-3">
                    <p className="font-body text-sm font-medium text-brand-text-primary">{l.title}</p>
                    <p className="font-body text-xs text-brand-text-muted">{l.organisation}</p>
                  </td>
                  <td className="px-3 hidden md:table-cell">
                    <span className="inline-block bg-brand-violet-surface text-brand-violet font-body text-xs font-medium px-2 py-0.5 rounded-full">{l.category}</span>
                  </td>
                  <td className="px-3"><StatusBadge active={l.is_active} /></td>
                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/listings/${l.id}/edit`} className="text-brand-text-muted hover:text-brand-violet"><Pencil size={15} /></Link>
                      <button onClick={() => removeFeatured(l.id)} className="text-[#EF9F27] hover:text-brand-text-muted" title="Remove from featured">
                        <Star size={16} className="fill-current" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
