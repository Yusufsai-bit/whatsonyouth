import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <>
      <Navbar />
      <div className="bg-white min-h-screen flex items-start justify-center px-6 py-16">
        <div className="bg-white border border-brand-card-border rounded-xl p-10 w-full max-w-[480px]">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#F0EEFF] flex items-center justify-center mx-auto mb-5">
                <Mail size={28} className="text-[#5847E0]" />
              </div>
              <h1 className="font-heading font-bold text-2xl text-[#0A0A0A]">Check your email</h1>
              <p className="font-body text-[15px] text-[#555555] mt-3">
                If an account exists for {email}, you'll receive a reset link shortly. Check your spam folder if you don't see it within a few minutes.
              </p>
              <Link to="/login" className="inline-block mt-6 font-body text-sm text-[#5847E0] hover:underline">
                Back to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-heading font-bold text-[28px] text-[#0A0A0A]">Reset your password</h1>
              <p className="font-body text-[15px] text-[#555555] mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-body font-medium text-sm text-[#0A0A0A] block mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#DDDDDD] rounded-lg px-3.5 py-3 font-body text-[15px] text-[#0A0A0A] focus:outline-none focus:border-[#5847E0]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D85A30] text-white font-heading font-bold text-base rounded-lg py-3.5 transition-colors duration-100 hover:bg-[#F0997B] disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
              <p className="font-body text-sm text-[#555555] text-center mt-4">
                <Link to="/login" className="text-[#5847E0] hover:underline">Back to log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
