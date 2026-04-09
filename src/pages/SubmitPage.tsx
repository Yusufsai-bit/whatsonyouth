import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check } from 'lucide-react';
import { z } from 'zod';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const categories = ['Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'] as const;

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

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
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

  if (loading) return null;
  if (!user) return <Navigate to="/signup" replace />;

  const contactEmail = form.contact_email || user.email || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof FieldErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...form, contact_email: contactEmail };
    const result = listingSchema.safeParse(payload);

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
    setSubmitting(true);
    const { error } = await supabase.from('listings').insert({
      user_id: user.id,
      title: result.data.title,
      category: result.data.category,
      organisation: result.data.organisation,
      location: result.data.location,
      link: result.data.link,
      description: result.data.description,
      contact_email: result.data.contact_email,
    });
    setSubmitting(false);
    if (!error) setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="bg-white min-h-screen flex items-start justify-center px-6 py-16">
          <div className="text-center max-w-[400px]">
            <div className="w-16 h-16 rounded-full bg-brand-violet-surface flex items-center justify-center mx-auto">
              <Check size={32} className="text-brand-violet" />
            </div>
            <h1 className="text-2xl text-brand-text-primary mt-4">Your listing is live!</h1>
            <p className="font-body text-base text-brand-text-secondary mt-3">
              It's now visible on What's On Youth and can be found by young Victorians across the state.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Link
                to="/account"
                className="bg-brand-violet text-white font-heading font-bold text-[15px] rounded-lg px-6 py-3"
              >
                View my listings
              </Link>
              <Link
                to="/submit"
                onClick={() => { setSubmitted(false); setForm({ title: '', category: '', organisation: '', location: '', link: '', description: '', contact_email: '' }); setConfirmed(false); }}
                className="border-2 border-brand-dark text-brand-dark font-heading font-bold text-[15px] rounded-lg px-6 py-3"
              >
                Submit another
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-white min-h-screen px-6 py-12 md:py-16">
        <div className="max-w-[640px] mx-auto">
          <h1 className="text-[32px] text-brand-text-primary">Submit a listing</h1>
          <p className="font-body text-base text-brand-text-secondary mb-8">
            Share an opportunity with young Victorians across the state.
          </p>

          <div className="bg-brand-violet-surface rounded-xl p-4 px-5 mb-6">
            <p className="font-body text-sm text-brand-text-secondary">
              Your listing will go live immediately and be visible to young Victorians across the state. Please make sure all details are accurate.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-brand-card-border rounded-xl p-8">
            <div className="flex flex-col gap-5">
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Listing title</label>
                <input type="text" name="title" required maxLength={150} value={form.title} onChange={handleChange} className={`w-full border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet ${errors.title ? 'border-brand-coral' : 'border-brand-input-border'}`} />
                {errors.title && <p className="font-body text-xs text-brand-coral mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Category</label>
                <select name="category" required value={form.category} onChange={handleChange} className={`w-full border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet bg-white ${errors.category ? 'border-brand-coral' : 'border-brand-input-border'}`}>
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="font-body text-xs text-brand-coral mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Organisation or group name</label>
                <input type="text" name="organisation" required maxLength={200} value={form.organisation} onChange={handleChange} className={`w-full border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet ${errors.organisation ? 'border-brand-coral' : 'border-brand-input-border'}`} />
                {errors.organisation && <p className="font-body text-xs text-brand-coral mt-1">{errors.organisation}</p>}
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Location</label>
                <input type="text" name="location" required maxLength={200} value={form.location} onChange={handleChange} placeholder="E.g. Richmond, Geelong, or Victoria-wide" className={`w-full border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet placeholder:text-brand-text-muted ${errors.location ? 'border-brand-coral' : 'border-brand-input-border'}`} />
                {errors.location && <p className="font-body text-xs text-brand-coral mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Website or application link</label>
                <input type="url" name="link" required maxLength={2000} value={form.link} onChange={handleChange} placeholder="https://example.com" className={`w-full border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet placeholder:text-brand-text-muted ${errors.link ? 'border-brand-coral' : 'border-brand-input-border'}`} />
                {errors.link && <p className="font-body text-xs text-brand-coral mt-1">{errors.link}</p>}
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Short description</label>
                <textarea name="description" required maxLength={300} value={form.description} onChange={handleChange} className={`w-full border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet min-h-[120px] resize-none ${errors.description ? 'border-brand-coral' : 'border-brand-input-border'}`} />
                <p className="font-body text-xs text-brand-text-muted mt-1">{form.description.length} / 300</p>
                {errors.description && <p className="font-body text-xs text-brand-coral mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Contact email</label>
                <input type="email" name="contact_email" required maxLength={255} value={contactEmail} onChange={handleChange} className={`w-full border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet ${errors.contact_email ? 'border-brand-coral' : 'border-brand-input-border'}`} />
                {errors.contact_email && <p className="font-body text-xs text-brand-coral mt-1">{errors.contact_email}</p>}
              </div>

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
                disabled={!confirmed || submitting}
                className={`font-heading font-bold text-base rounded-lg px-7 py-3.5 mt-2 transition-colors duration-100 ${
                  confirmed
                    ? 'bg-brand-coral text-white hover:bg-brand-coral-light'
                    : 'bg-brand-disabled text-brand-disabled-text cursor-not-allowed'
                }`}
              >
                {submitting ? 'Publishing...' : 'Publish listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
