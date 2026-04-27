import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import PasswordStrengthBar from '@/components/PasswordStrengthBar';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const now = Date.now();
    if (now - lastAttempt < 3000) {
      setError('Please wait before trying again.');
      return;
    }
    if (attemptCount >= 5) {
      setError('Too many attempts. Please try again later.');
      return;
    }
    setLastAttempt(now);
    setAttemptCount(c => c + 1);

    setLoading(true);
    const { error } = await signUp(email, password, firstName).catch((err) => ({ error: err }));
    setLoading(false);
    if (error) {
      setError(error.issues?.[0]?.message || error.message || 'Please check your details and try again.');
    } else {
      setEmailSent(true);
    }
  };

  return (
    <>
      <SEO title="Create a Free Account — What's On Youth" description="Create a free account to submit and manage listings on What's On Youth." noindex />
      <Navbar />
      <div className="bg-white min-h-screen flex items-start justify-center px-4 md:px-6 py-16">
        {emailSent ? (
          <div className="text-center max-w-[480px]">
            <div className="w-16 h-16 rounded-full bg-brand-violet-surface flex items-center justify-center mx-auto mb-5">
              <Mail size={28} className="text-brand-violet" />
            </div>
            <h1 className="font-heading font-bold text-[28px] text-brand-text-primary mb-3">Check your email</h1>
            <p className="font-body text-base text-brand-text-secondary mb-1">We sent a verification link to</p>
            <p className="font-body font-medium text-base text-brand-text-primary mb-4">{email}</p>
            <p className="font-body text-sm text-brand-text-muted mb-8">
              Click the link in the email to verify your account and get started. Check your spam folder if you don't see it within a few minutes.
            </p>
            <Link to="/login" className="font-body text-sm text-brand-violet hover:underline">
              Back to log in
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-brand-card-border rounded-xl p-6 md:p-10 w-full max-w-[480px]">
            <h1 className="text-[28px] text-brand-text-primary">Create your free account</h1>
            <p className="font-body text-base text-brand-text-secondary mb-6">
              Submit listings and manage your opportunities.
            </p>
            {error && <p className="font-body text-sm text-brand-coral mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">First name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-brand-input-border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet min-h-[48px]"
                />
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-brand-input-border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet min-h-[48px]"
                />
              </div>
              <div>
                <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-brand-input-border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet min-h-[48px]"
                />
                <PasswordStrengthBar password={password} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-coral text-white font-heading font-bold text-base rounded-lg py-3.5 mt-2 transition-colors duration-100 hover:bg-brand-coral-light disabled:opacity-50 min-h-[48px]"
              >
                {loading ? 'Creating account...' : 'Create free account'}
              </button>
            </form>
            <p className="font-body text-sm text-brand-text-secondary text-center mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-violet hover:underline">Log in</Link>
            </p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
