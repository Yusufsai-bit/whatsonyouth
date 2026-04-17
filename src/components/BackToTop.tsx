import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 md:bottom-6 right-6 z-30 w-11 h-11 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#1A1A1A] transition-all duration-150 hover:-translate-y-0.5"
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
