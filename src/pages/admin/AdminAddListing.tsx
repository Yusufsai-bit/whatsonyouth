import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { toast } from 'sonner';

const categories = ['Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'];

export default function AdminAddListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '', category: '', organisation: '', location: '',
    link: '', contact_email: '', description: '',
    is_active: true, is_featured: false,
  });

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
    if (!user) return;
    setSubmitting(true);

    let image_url: string | null = null;
    if (imageFile) {
      const filename = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(filename, imageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(filename);
        image_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('listings').insert({
      user_id: user.id,
      title: form.title, category: form.category, organisation: form.organisation,
      location: form.location, link: form.link, contact_email: form.contact_email,
      description: form.description, is_active: form.is_active, is_featured: form.is_featured,
      source: 'admin', image_url,
    });

    setSubmitting(false);
    if (error) {
      toast.error('Failed to add listing');
    } else {
      setSuccess(true);
      toast('Listing added successfully');
      setForm({ title: '', category: '', organisation: '', location: '', link: '', contact_email: '', description: '', is_active: true, is_featured: false });
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  const inputClass = "w-full border border-brand-input-border rounded-lg px-3.5 py-3 font-body text-sm text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white";
  const labelClass = "font-body font-medium text-sm text-brand-text-primary block mb-1.5";

  return (
    <AdminLayout>
      <AdminHeader title="Add listing" showAddButton={false} />
      <div className="p-6 md:p-8 overflow-auto">
        {success && (
          <div className="bg-[#E1F5EE] text-[#085041] rounded-lg px-4 py-3 font-body text-sm mb-4">
            Listing added successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-brand-card-border rounded-xl p-8 max-w-[800px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Listing title</label>
              <input type="text" name="title" required value={form.title} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select name="category" required value={form.category} onChange={handleChange} className={inputClass}>
                <option value="">Select a category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Organisation or group name</label>
              <input type="text" name="organisation" required value={form.organisation} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input type="text" name="location" required value={form.location} onChange={handleChange} placeholder="E.g. Richmond or Victoria-wide" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Website or application link</label>
              <input type="url" name="link" required value={form.link} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contact email</label>
              <input type="email" name="contact_email" required value={form.contact_email} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Short description</label>
            <textarea name="description" required maxLength={300} value={form.description} onChange={handleChange} className={`${inputClass} min-h-[120px] resize-none`} />
            <p className="font-body text-xs text-brand-text-muted mt-1">{form.description.length} / 300</p>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Listing image (optional)</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full max-h-[240px] object-cover rounded-lg" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">×</button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-brand-section-alt border-2 border-dashed border-brand-input-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-violet transition-colors"
              >
                <p className="font-body text-sm text-brand-text-muted">Click to upload or drag and drop</p>
                <p className="font-body text-xs text-brand-disabled-text mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="hidden" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-brand-violet" />
              <span className="font-body text-sm text-brand-text-primary">Active (visible on site)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-brand-violet" />
              <span className="font-body text-sm text-brand-text-primary">Featured on homepage</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 bg-brand-coral text-white font-heading font-bold text-base rounded-lg px-7 py-3.5 transition-colors hover:bg-brand-coral-light disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add listing'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
