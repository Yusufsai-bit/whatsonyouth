import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const categories = ['Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing'];

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('listings').insert({
      user_id: user.id,
      title: form.title,
      category: form.category,
      organisation: form.organisation,
      location: form.location,
      link: form.link,
      description: form.description,
      contact_email: contactEmail,
    });
    setSubmitting(false);
    if (!error) setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="bg-brand-ghost min-h-screen flex items-start justify-center px-6 py-16">
          <div className="text-center max-w-[400px]">
            <div className="w-16 h-16 rounded-full bg-brand-lavender flex items-center justify-center mx-auto">
              <Check size={32} className="text-brand-violet" />
            </div>
            <h1 className="text-2xl text-brand-ink mt-4">Your listing is live!</h1>
            <p className="font-body text-base text-brand-muted-text mt-3">
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
                className="border-2 border-brand-violet text-brand-violet font-heading font-bold text-[15px] rounded-lg px-6 py-3"
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
      <div className="bg-brand-ghost min-h-screen px-6 py-12 md:py-16">
        <div className="max-w-[640px] mx-auto">
          <h1 className="text-[32px] text-brand-ink">Submit a listing</h1>
          <p className="font-body text-base text-brand-muted-text mb-8">
            Share an opportunity with young Victorians across the state.
          </p>

          <div className="bg-brand-lavender rounded-xl p-4 px-5 mb-6">
            <p className="font-body text-sm text-brand-muted-text">
              Your listing will go live immediately and be visible to young Victorians across the state. Please make sure all details are accurate.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-brand-mist rounded-xl p-8">
            <div className="flex flex-col gap-5">
              <div>
                <label className="font-body font-medium text-sm text-brand-ink block mb-1.5">Listing title</label>
                <input type="text" name="title" required value={form.title} onChange={handleChange} className="w-full border border-brand-mist rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-ink focus:outline-none focus:border-brand-violet" />
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-ink block mb-1.5">Category</label>
                <select name="category" required value={form.category} onChange={handleChange} className="w-full border border-brand-mist rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-ink focus:outline-none focus:border-brand-violet bg-white">
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-ink block mb-1.5">Organisation or group name</label>
                <input type="text" name="organisation" required value={form.organisation} onChange={handleChange} className="w-full border border-brand-mist rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-ink focus:outline-none focus:border-brand-violet" />
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-ink block mb-1.5">Location</label>
                <input type="text" name="location" required value={form.location} onChange={handleChange} placeholder="E.g. Richmond, Geelong, or Victoria-wide" className="w-full border border-brand-mist rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-ink focus:outline-none focus:border-brand-violet placeholder:text-brand-mist" />
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-ink block mb-1.5">Website or application link</label>
                <input type="url" name="link" required value={form.link} onChange={handleChange} className="w-full border border-brand-mist rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-ink focus:outline-none focus:border-brand-violet" />
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-ink block mb-1.5">Short description</label>
                <textarea name="description" required maxLength={300} value={form.description} onChange={handleChange} className="w-full border border-brand-mist rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-ink focus:outline-none focus:border-brand-violet min-h-[120px] resize-none" />
                <p className="font-body text-xs text-brand-muted-text mt-1">{form.description.length} / 300</p>
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-ink block mb-1.5">Contact email</label>
                <input type="email" name="contact_email" required value={contactEmail} onChange={handleChange} className="w-full border border-brand-mist rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-ink focus:outline-none focus:border-brand-violet" />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brand-violet"
                />
                <span className="font-body text-sm text-brand-muted-text">
                  I confirm this listing is accurate and appropriate for young people aged 15–25
                </span>
              </label>

              <button
                type="submit"
                disabled={!confirmed || submitting}
                className={`font-heading font-bold text-base rounded-lg px-7 py-3.5 mt-2 transition-colors duration-100 ${
                  confirmed
                    ? 'bg-brand-coral text-white hover:bg-brand-coral-light'
                    : 'bg-brand-mist text-brand-muted-text cursor-not-allowed'
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
