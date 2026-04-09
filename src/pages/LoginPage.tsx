import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/submit');
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-white min-h-screen flex items-start justify-center px-6 py-16">
        <div className="bg-white border border-brand-card-border rounded-xl p-10 w-full max-w-[480px]">
          <h1 className="text-[28px] text-brand-text-primary">Welcome back</h1>
          <p className="font-body text-base text-brand-text-secondary mb-6">
            Log in to submit and manage your listings.
          </p>
          {error && <p className="font-body text-sm text-brand-coral mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-brand-input-border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet"
              />
            </div>
            <div>
              <label className="font-body font-medium text-sm text-brand-text-primary block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-brand-input-border rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-text-primary focus:outline-none focus:border-brand-violet"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-violet text-white font-heading font-bold text-base rounded-lg py-3.5 mt-2 transition-colors duration-100 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <p className="font-body text-sm text-brand-text-secondary text-center mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-violet hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
