import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { toast } from 'sonner';

const categories = ['Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'];

export default function AdminEditListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '', category: '', organisation: '', location: '',
    link: '', contact_email: '', description: '', expiry_date: '',
    is_active: true, is_featured: false, image_url: '',
  });

  useEffect(() => {
    if (!id) return;
    supabase.from('listings').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          title: data.title, category: data.category, organisation: data.organisation,
          location: data.location, link: data.link, contact_email: data.contact_email,
          description: data.description, is_active: data.is_active,
          is_featured: data.is_featured, image_url: data.image_url || '',
          expiry_date: (data as any).expiry_date || '',
        });
        if (data.image_url) setImagePreview(data.image_url);
      }
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);

    let image_url = form.image_url;
    if (imageFile) {
      const filename = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(filename, imageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(filename);
        image_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('listings').update({
      title: form.title, category: form.category, organisation: form.organisation,
      location: form.location, link: form.link, contact_email: form.contact_email,
      description: form.description, is_active: form.is_active, is_featured: form.is_featured,
      image_url: image_url || null,
      expiry_date: form.expiry_date || null,
    } as any).eq('id', id);

    setSubmitting(false);
    if (error) {
      toast.error('Failed to save changes');
    } else {
      toast('Changes saved');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await supabase.from('listings').delete().eq('id', id);
    toast('Listing deleted');
    navigate('/admin/listings');
  };

  if (loading) return <AdminLayout><AdminHeader title="Edit listing" showAddButton={false} /><div className="p-8 font-body text-sm text-[#888888]">Loading...</div></AdminLayout>;

  const inputClass = "w-full border border-[#DDDDDD] rounded-lg px-3.5 py-3 font-body text-sm text-[#0A0A0A] focus:outline-none focus:border-[#5847E0] bg-white";
  const labelClass = "font-body font-medium text-sm text-[#0A0A0A] block mb-1.5";

  return (
    <AdminLayout>
      <AdminHeader title="Edit listing" showAddButton={false} />
      <div className="p-6 md:p-8 overflow-auto">
        <form onSubmit={handleSubmit} className="bg-white border border-[#EBEBEB] rounded-xl p-8 max-w-[820px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className={labelClass}>Listing title</label><input type="text" name="title" required value={form.title} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Category</label>
              <select name="category" required value={form.category} onChange={handleChange} className={inputClass}>
                <option value="">Select</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Organisation</label><input type="text" name="organisation" required value={form.organisation} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Location</label><input type="text" name="location" required value={form.location} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Website link</label><input type="url" name="link" required value={form.link} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Contact email</label><input type="email" name="contact_email" required value={form.contact_email} onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Description</label>
            <textarea name="description" required maxLength={300} value={form.description} onChange={handleChange} className={`${inputClass} min-h-[120px] resize-none`} />
            <p className="font-body text-xs text-[#888888] mt-1">{form.description.length} / 300</p>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Listing image (optional)</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full max-h-[220px] object-cover rounded-lg" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setForm({...form, image_url: ''}); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">×</button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="bg-[#F7F7F7] border-2 border-dashed border-[#DDDDDD] rounded-xl p-8 text-center cursor-pointer hover:border-[#5847E0] transition-colors">
                <p className="font-body text-sm text-[#888888]">Click to upload or drag and drop</p>
                <p className="font-body text-xs text-[#AAAAAA] mt-1">PNG or JPG, max 5MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="hidden" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className={labelClass}>Expiry date (optional)</label>
              <input type="date" name="expiry_date" value={form.expiry_date} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-3 justify-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-[#5847E0]" />
                <span className="font-body text-sm text-[#0A0A0A]">Active (visible on site)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-[#5847E0]" />
                <span className="font-body text-sm text-[#0A0A0A]">Featured on homepage</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="mt-6 bg-[#D85A30] text-white font-heading font-bold text-base rounded-lg px-7 py-3.5 transition-colors hover:bg-[#F0997B] disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>

        <button onClick={() => setShowDeleteModal(true)} className="font-body text-sm text-[#D85A30] hover:underline mt-4 block">
          Delete this listing
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-[400px] w-full mx-4">
            <h2 className="font-heading font-bold text-xl text-[#0A0A0A]">Delete this listing?</h2>
            <p className="font-body text-[15px] text-[#555555] mt-3">This cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 border-2 border-[#0A0A0A] text-[#0A0A0A] font-heading font-bold text-sm rounded-lg py-2.5">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-[#E24B4A] text-white font-heading font-bold text-sm rounded-lg py-2.5">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
