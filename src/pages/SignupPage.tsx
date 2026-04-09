import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signUp(email, password, firstName);
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
      <div className="bg-brand-page-bg min-h-screen flex items-start justify-center px-6 py-16">
        <div className="bg-white border border-brand-seafoam rounded-xl p-10 w-full max-w-[480px]">
          <h1 className="text-[28px] text-brand-forest">Create your free account</h1>
          <p className="font-body text-base text-brand-mid-teal mb-6">
            Submit listings, save opportunities, and more.
          </p>
          {error && <p className="font-body text-sm text-brand-coral mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="font-body font-medium text-sm text-brand-forest block mb-1.5">First name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-brand-seafoam rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-forest focus:outline-none focus:border-brand-teal"
              />
            </div>
            <div>
              <label className="font-body font-medium text-sm text-brand-forest block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-brand-seafoam rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-forest focus:outline-none focus:border-brand-teal"
              />
            </div>
            <div>
              <label className="font-body font-medium text-sm text-brand-forest block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-brand-seafoam rounded-lg px-3.5 py-3 font-body text-[15px] text-brand-forest focus:outline-none focus:border-brand-teal"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-coral text-white font-heading font-bold text-base rounded-lg py-3.5 mt-2 transition-colors duration-100 hover:bg-brand-coral-light disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create free account'}
            </button>
          </form>
          <p className="font-body text-sm text-brand-mid-teal text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-teal hover:underline">Log in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
