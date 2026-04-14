import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Upload, Copy, MapPin, Calendar, Plus } from 'lucide-react';
import { z } from 'zod';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const categories = ['Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'] as const;

const categoryColors: Record<string, string> = {
  Events: '#2D1B69',
  Jobs: '#1A2A4A',
  Grants: '#1A3A2A',
  Programs: '#2D1B4A',
  Wellbeing: '#2A1A3A',
};

const listingSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title must be under 150 characters'),
  category: z.enum(categories, { errorMap: () => ({ message: 'Please select a category' }) }),
  organisation: z.string().trim().min(1, 'Organisation is required').max(200, 'Organisation must be under 200 characters'),
  location: z.string().trim().min(1, 'Location is required').max(200, 'Location must be under 200 characters'),
  link: z.string().trim().url('Please enter a valid URL (e.g. https://example.com)').max(2000, 'URL is too long'),
  description: z.string().trim().min(1, 'Description is required').max(300, 'Description must be under 300 characters'),
  contact_email: z.string().trim().email('Please enter a valid email address').max(255, 'Email is too long'),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof listingSchema>, string>>;

function PreviewCard({ form, imagePreview }: { form: any; imagePreview: string | null }) {
  const color = categoryColors[form.category] || '#2D1B69';
  return (
    <div className="sticky top-6">
      <p className="font-body font-medium text-xs text-brand-text-muted uppercase tracking-[0.06em] mb-1">Preview</p>
      <p className="font-body text-xs text-brand-disabled-text mb-4">This is how your listing will appear</p>
      <div className="bg-white border border-brand-card-border rounded-xl overflow-hidden">
        <div className="w-full h-40 relative" style={{ backgroundColor: color }}>
          {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />}
          {form.category && (
            <span className="absolute bottom-2.5 left-2.5 bg-black/60 text-white font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">
              {form.category}
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="font-body text-xs text-brand-text-muted uppercase tracking-[0.04em] mb-1.5">
            {form.organisation || 'Organisation name'}
          </p>
          <h3 className="font-heading font-bold text-[16px] text-brand-text-primary leading-[1.3] mb-2 line-clamp-2">
            {form.title || 'Listing title'}
          </h3>
          {form.location && (
            <div className="flex items-center gap-1.5 font-body text-[13px] text-brand-text-secondary">
              <MapPin size={13} />
              <span>{form.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [newListingId, setNewListingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    title: '',
    category: '',
    organisation: '',
    location: '',
    link: '',
    description: '',
    contact_email: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (loading) return null;
  if (!user) {
    return (
      <>
        <SEO
          title="Submit a Listing — What's On Youth"
          description="Share your event, job, grant, program, or wellbeing resource with young Victorians for free."
          noindex
        />
        <Navbar />
        <div className="bg-white min-h-screen flex items-start justify-center px-4 md:px-6 py-16">
          <div className="text-center max-w-[480px]">
            <div className="w-16 h-16 rounded-full bg-brand-violet-surface flex items-center justify-center mx-auto mb-5">
              <Plus size={28} className="text-brand-violet" />
            </div>
            <h1 className="font-heading font-bold text-[28px] text-brand-text-primary mb-3">Submit a listing</h1>
            <p className="font-body text-base text-brand-text-secondary mb-6">
              Create a free account to share opportunities with young Victorians across the state.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/signup" className="bg-brand-coral text-white font-heading font-bold text-[15px] rounded-lg px-6 py-3 hover:bg-brand-coral-light transition-colors min-h-[48px] flex items-center">
                Create free account
              </Link>
              <Link to="/login" className="border border-brand-card-border text-brand-text-primary font-heading font-bold text-[15px] rounded-lg px-6 py-3 hover:bg-brand-section-alt transition-colors min-h-[48px] flex items-center">
                Log in
              </Link>
            </div>
            <p className="font-body text-sm text-brand-text-secondary text-center mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-violet hover:underline">Log in here</Link>
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const contactEmail = form.contact_email || user.email || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof FieldErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleImageSelect = (file: File) => {
    setImageError('');
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setImageError('Please upload a PNG or JPG image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be under 5MB.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (honeypot) {
      toast.success('Listing submitted successfully!');
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < 60000) {
      toast.error('Please wait a moment before submitting again.');
      return;
    }

    const payload = { ...form, contact_email: contactEmail };
    const result = listingSchema.safeParse(payload);

    let hasImageError = false;
    if (!imageFile) {
      setImageError('Please upload an image for your listing.');
      hasImageError = true;
    }

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField && formRef.current) {
        const el = formRef.current.querySelector(`[name="${firstErrorField}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (hasImageError) return;

    // Minimum content checks
    if (result.data.title.length < 10) {
      toast.error('Title must be at least 10 characters.');
      return;
    }
    if (result.data.description.trim().length > 0 && result.data.description.trim().length < 30) {
      toast.error('Description must be at least 30 characters if provided.');
      return;
    }

    setErrors({});
    setSubmitting(true);

    let imageUrl: string | null = null;

    // Upload image if selected
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, imageFile, { contentType: imageFile.type });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase.from('listings').insert({
      user_id: user.id,
      title: result.data.title,
      category: result.data.category,
      organisation: result.data.organisation,
      location: result.data.location,
      link: result.data.link,
      description: result.data.description,
      contact_email: result.data.contact_email,
      image_url: imageUrl,
      expiry_date: expiryDate || null,
    }).select('id').single();

    setSubmitting(false);
    if (!error && data) {
      setLastSubmitTime(Date.now());
      setNewListingId(data.id);
      setSubmitted(true);
    }
  };

  const listingUrl = newListingId ? `${window.location.origin}/listings/${newListingId}` : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(listingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setSubmitted(false);
    setNewListingId(null);
    setForm({ title: '', category: '', organisation: '', location: '', link: '', description: '', contact_email: '' });
    setConfirmed(false);
    setImageFile(null);
    setImagePreview(null);
    setExpiryDate('');
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="bg-white min-h-screen flex items-start justify-center px-6 py-16">
          <div className="text-center max-w-[480px]">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#E1F5EE' }}>
              <Check size={36} style={{ color: '#1D9E75' }} />
            </div>
            <h1 className="font-heading font-bold text-[28px] text-brand-text-primary mt-5">Your listing is live!</h1>
            <p className="font-body text-base text-brand-text-secondary mt-3 max-w-[440px] mx-auto">
              It's now visible to young Victorians across Victoria. Share it to spread the word.
            </p>

            {/* Share URL box */}
            <div className="mt-6 flex items-center gap-2 bg-brand-section-alt border border-brand-card-border rounded-lg px-4 py-3">
              <p className="font-body text-[13px] text-brand-text-secondary truncate flex-1 text-left">{listingUrl}</p>
              <button onClick={handleCopy} className="flex-shrink-0 text-brand-text-muted hover:text-brand-text-primary transition-colors">
                {copied ? <Check size={16} style={{ color: '#1D9E75' }} /> : <Copy size={16} />}
              </button>
            </div>
            {copied && <p className="font-body text-xs mt-1" style={{ color: '#1D9E75' }}>Copied!</p>}

            <div className="flex gap-3 justify-center mt-8">
              <Link
                to={`/listings/${newListingId}`}
                className="bg-brand-coral text-white font-heading font-bold text-[15px] rounded-lg px-6 py-3 hover:bg-brand-coral-light transition-colors"
              >
                View my listing
              </Link>
              <button
                onClick={resetForm}
                className="border border-brand-card-border text-brand-text-primary font-heading font-bold text-[15px] rounded-lg px-6 py-3 hover:bg-brand-section-alt transition-colors"
              >
                Submit another
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet ${errors[field] ? 'border-[#E24B4A]' : 'border-brand-input-border'}`;

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <SEO
        title="Submit a Listing \u2014 What's On Youth"
        description="Share your event, job, grant, program, or wellbeing resource with young Victorians for free."
        ogUrl="https://www.whatsonyouth.org.au/submit"
        canonical="https://www.whatsonyouth.org.au/submit"
        noindex
      />
      <Navbar />
      <div className="bg-white min-h-screen px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-7xl mx-auto flex gap-10">
          {/* Form column */}
          <div className="flex-1 max-w-[640px]">
            <h1 className="text-[32px] text-brand-text-primary">Submit a listing</h1>
            <p className="font-body text-base text-brand-text-secondary mb-8">
              Share an opportunity with young Victorians across the state.
            </p>

            <div className="bg-brand-violet-surface rounded-xl p-4 px-5 mb-6">
              <p className="font-body text-sm text-brand-text-secondary">
                Your listing will go live immediately and be visible to young Victorians across the state. Please make sure all details are accurate.
              </p>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="bg-white border border-brand-card-border rounded-xl p-8 relative">
              {/* Honeypot */}
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-5">
                {/* Title */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Listing title</label>
                  <input type="text" name="title" required maxLength={150} value={form.title} onChange={handleChange} className={inputClass('title')} />
                  {errors.title && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.title}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Category</label>
                  <select name="category" required value={form.category} onChange={handleChange} className={`${inputClass('category')} bg-white`}>
                    <option value="">Select a category</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.category}</p>}
                </div>

                {/* Organisation */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Organisation or group name</label>
                  <input type="text" name="organisation" required maxLength={200} value={form.organisation} onChange={handleChange} className={inputClass('organisation')} />
                  {errors.organisation && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.organisation}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Location</label>
                  <input type="text" name="location" required maxLength={200} value={form.location} onChange={handleChange} placeholder="E.g. Richmond, Geelong, or Victoria-wide" className={`${inputClass('location')} placeholder:text-brand-text-muted`} />
                  {errors.location && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.location}</p>}
                </div>

                {/* Link */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Website or application link</label>
                  <input type="url" name="link" required maxLength={2000} value={form.link} onChange={handleChange} placeholder="https://example.com" className={`${inputClass('link')} placeholder:text-brand-text-muted`} />
                  {errors.link && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.link}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Short description</label>
                  <textarea name="description" required maxLength={300} value={form.description} onChange={handleChange} className={`${inputClass('description')} min-h-[120px] resize-none`} />
                  <p className="font-body text-xs text-brand-text-muted mt-1">{form.description.length} / 300</p>
                  {errors.description && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.description}</p>}
                </div>

                {/* Image upload */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1">Listing image</label>
                  <p className="font-body text-xs text-brand-disabled-text mb-2">Add an image for your listing. PNG or JPG, max 5MB.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }}
                  />
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Upload preview" className="w-full max-h-[200px] object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className={`bg-brand-section-alt border-2 border-dashed rounded-xl p-5 md:p-8 text-center cursor-pointer hover:border-brand-violet transition-colors ${imageError ? 'border-[#E24B4A]' : 'border-brand-input-border'}`}
                    >
                      <Upload size={24} className="mx-auto text-brand-text-muted mb-2" />
                      <p className="font-body text-sm text-brand-text-muted">Click to upload or drag and drop</p>
                      <p className="font-body text-xs text-brand-disabled-text mt-1">PNG or JPG · Max 5MB</p>
                    </div>
                  )}
                  {imageError && <p className="font-body text-xs text-[#E24B4A] mt-1">{imageError}</p>}
                </div>

                {/* Expiry date */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1">Listing expiry date (optional)</label>
                  <p className="font-body text-xs text-brand-disabled-text mb-2">When does this opportunity close? We'll automatically deactivate it after this date.</p>
                  <input
                    type="date"
                    value={expiryDate}
                    min={today}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full border border-brand-input-border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet"
                  />
                </div>

                {/* Contact email */}
                <div>
                  <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Contact email</label>
                  <input type="email" name="contact_email" required maxLength={255} value={contactEmail} onChange={handleChange} className={inputClass('contact_email')} />
                  {errors.contact_email && <p className="font-body text-xs text-[#E24B4A] mt-1">{errors.contact_email}</p>}
                </div>

                {/* Confirm checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-brand-violet"
                  />
                  <span className="font-body text-sm text-brand-text-secondary">
                    I confirm this listing is accurate and appropriate for young people aged 15–25
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!confirmed || !imageFile || submitting}
                  className={`font-heading font-bold text-base rounded-lg px-7 py-3.5 mt-2 transition-colors duration-100 ${
                    confirmed && imageFile
                      ? 'bg-brand-coral text-white hover:bg-brand-coral-light'
                      : 'bg-brand-disabled text-brand-disabled-text cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Publishing...' : 'Publish listing'}
                </button>
              </div>
            </form>
          </div>

          {/* Preview column (desktop only) */}
          <div className="hidden lg:block w-[320px] flex-shrink-0 pt-[140px]">
            <PreviewCard form={form} imagePreview={imagePreview} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
