import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { emailSchema, sanitizeText, strictHttpsUrlSchema } from '@/lib/validation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const categories = ['Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'] as const;

const listingSchema = z.object({
  title: z.string().transform(sanitizeText).pipe(z.string().min(1, 'Title is required').max(150)),
  category: z.enum(categories, { errorMap: () => ({ message: 'Please select a category' }) }),
  organisation: z.string().transform(sanitizeText).pipe(z.string().min(1, 'Organisation is required').max(200)),
  location: z.string().transform(sanitizeText).pipe(z.string().min(1, 'Location is required').max(200)),
  link: strictHttpsUrlSchema,
  description: z.string().transform(sanitizeText).pipe(z.string().min(1, 'Description is required').max(300)),
  contact_email: emailSchema,
}).strict();

type FieldErrors = Partial<Record<keyof z.infer<typeof listingSchema>, string>>;

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    title: '', category: '', organisation: '', location: '',
    link: '', description: '', contact_email: '',
  });
  const [expiryDate, setExpiryDate] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data || data.user_id !== user.id) {
          setAuthorized(false);
          setLoading(false);
          return;
        }
        setForm({
          title: data.title,
          category: data.category,
          organisation: data.organisation,
          location: data.location,
          link: data.link,
          description: data.description,
          contact_email: data.contact_email,
        });
        setExpiryDate(data.expiry_date || '');
        setExistingImageUrl(data.image_url);
        setLoading(false);
      });
  }, [user, id]);

  if (authLoading || loading) return null;
  if (!user || !authorized) return <Navigate to="/" replace />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name as keyof FieldErrors]) setErrors(e2 => ({ ...e2, [name]: undefined }));
  };

  const handleImageSelect = (file: File) => {
    setImageError('');
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) { setImageError('Please upload a PNG or JPG image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setImageError('Image must be under 5MB.'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = listingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    let imageUrl = existingImageUrl;
    if (imageFile) {
      const ext = imageFile.type === 'image/png' ? 'png' : 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, imageFile, { contentType: imageFile.type });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('listings').update({
      title: result.data.title,
      category: result.data.category,
      organisation: result.data.organisation,
      location: result.data.location,
      link: result.data.link,
      description: result.data.description,
      contact_email: result.data.contact_email,
      image_url: imageUrl,
      expiry_date: expiryDate || null,
    }).eq('id', id!);

    setSaving(false);
    if (!error) {
      toast.success('Your listing has been updated.', { duration: 3000 });
    } else {
      toast.error('Failed to save changes.');
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('listings').delete().eq('id', id!);
    if (!error) {
      toast.success('Listing deleted.');
      navigate('/account');
    } else {
      toast.error('Failed to delete listing.');
    }
  };

  const inputClass = "w-full border border-[#DDDDDD] rounded-lg px-3.5 py-3 font-body text-[15px] text-[#0A0A0A] focus:outline-none focus:border-[#5847E0]";
  const labelClass = "font-body font-medium text-sm text-[#0A0A0A] block mb-1.5";
  const currentImage = imagePreview || existingImageUrl;

  return (
    <>
      <SEO title="Edit Your Listing — What's On Youth" description="Edit your submitted listing." noindex />
      <Navbar />
      <div className="bg-white min-h-screen px-6 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-[28px] text-[#0A0A0A] mb-2">Edit your listing</h1>
          <p className="font-body text-base text-[#555555] mb-8">Update the details below and save your changes.</p>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className={labelClass}>Title</label>
              <input name="title" value={form.title} onChange={handleChange} className={inputClass} maxLength={150} />
              {errors.title && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                <option value="">Select a category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className={labelClass}>Organisation</label>
              <input name="organisation" value={form.organisation} onChange={handleChange} className={inputClass} maxLength={200} />
              {errors.organisation && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.organisation}</p>}
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <input name="location" value={form.location} onChange={handleChange} className={inputClass} maxLength={200} />
              {errors.location && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className={labelClass}>Link</label>
              <input name="link" value={form.link} onChange={handleChange} className={inputClass} placeholder="https://" />
              {errors.link && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.link}</p>}
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} maxLength={300} className={inputClass} />
              <p className="font-body text-xs text-[#888888] mt-1 text-right">{form.description.length}/300</p>
              {errors.description && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className={labelClass}>Contact email</label>
              <input name="contact_email" value={form.contact_email} onChange={handleChange} className={inputClass} />
              {errors.contact_email && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.contact_email}</p>}
            </div>

            <div>
              <label className={labelClass}>Expiry date (optional)</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className={inputClass} />
            </div>

            {/* Image */}
            <div>
              <label className={labelClass}>Listing image</label>
              <p className="font-body text-xs text-[#888888] mb-2">Replace the current image. PNG or JPG, max 5MB.</p>
              {currentImage && (
                <img src={currentImage} alt="Current" className="w-full h-40 object-cover rounded-lg mb-3" />
              )}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#DDDDDD] rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-[#5847E0] transition-colors"
              >
                <Upload size={24} className="text-[#888888]" />
                <p className="font-body text-sm text-[#555555]">Click to upload a new image</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }}
              />
              {imageError && <p className="font-body text-xs text-[#E24B4A] mt-1">{imageError}</p>}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#5847E0] text-white font-heading font-bold text-[15px] rounded-lg px-8 py-3.5 transition-colors hover:opacity-90 disabled:opacity-50 w-fit"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#EBEBEB]">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="font-body text-sm text-[#E24B4A] hover:underline">
                  Delete this listing
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this listing? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-[#E24B4A] hover:bg-[#c93a3a]">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
