import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { CheckCircle } from 'lucide-react';
import PasswordStrengthBar from '@/components/PasswordStrengthBar';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidSession(!!session);
    });

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  if (validSession === null) return null;

  return (
    <>
      <SEO title="Reset Password \u2014 What's On Youth" description="Set a new password for your What's On Youth account." noindex />
      <Navbar />
      <div className="bg-white min-h-screen flex items-start justify-center px-6 py-16">
        <div className="bg-white border border-brand-card-border rounded-xl p-10 w-full max-w-[480px]">
          {!validSession && !success ? (
            <div className="text-center">
              <h1 className="font-heading font-bold text-2xl text-[#0A0A0A]">Link expired</h1>
              <p className="font-body text-[15px] text-[#555555] mt-3">
                This reset link has expired or has already been used. Request a new one.
              </p>
              <Link to="/forgot-password" className="inline-block mt-4 font-body text-sm text-[#5847E0] hover:underline">
                Request a new link
              </Link>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-[#1D9E75]" />
              </div>
              <h1 className="font-heading font-bold text-2xl text-[#0A0A0A]">Password updated!</h1>
              <p className="font-body text-[15px] text-[#555555] mt-3">
                You can now log in with your new password.
              </p>
              <Link
                to="/login"
                className="inline-block mt-6 bg-[#C04A22] text-white font-heading font-bold text-base rounded-lg px-7 py-3 transition-colors hover:bg-[#D96840]"
              >
                Go to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-heading font-bold text-[28px] text-[#0A0A0A]">Choose a new password</h1>
              {error && <p className="font-body text-sm text-[#C04A22] mt-3">{error}</p>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
                <div>
                  <label className="font-body font-medium text-sm text-[#0A0A0A] block mb-1.5">New password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[#DDDDDD] rounded-lg px-3.5 py-3 font-body text-[15px] text-[#0A0A0A] focus:outline-none focus:border-[#5847E0]"
                  />
                  <PasswordStrengthBar password={password} />
                </div>
                <div>
                  <label className="font-body font-medium text-sm text-[#0A0A0A] block mb-1.5">Confirm new password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full border border-[#DDDDDD] rounded-lg px-3.5 py-3 font-body text-[15px] text-[#0A0A0A] focus:outline-none focus:border-[#5847E0]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C04A22] text-white font-heading font-bold text-base rounded-lg py-3.5 transition-colors duration-100 hover:bg-[#D96840] disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Set new password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
