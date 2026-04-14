import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Briefcase, Award, BookOpen, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const categories = [
  { name: 'Events', desc: "What's on near you", href: '/events' },
  { name: 'Jobs', desc: 'Find work and internships', href: '/jobs' },
  { name: 'Grants', desc: 'Funding for your ideas', href: '/grants' },
  { name: 'Programs', desc: 'Youth programs and workshops', href: '/programs' },
  { name: 'Wellbeing', desc: 'Mental health and wellbeing support', href: '/wellbeing' },
];

export default function CategoryGrid() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from('listings')
      .select('category')
      .eq('is_active', true)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, number> = {};
        data.forEach(row => {
          map[row.category] = (map[row.category] || 0) + 1;
        });
        setCounts(map);
      });
  }, []);

  const categoryColors: Record<string, string> = {
    Events:    '#2D1B69',
    Jobs:      '#1A2A4A',
    Grants:    '#1A3A2A',
    Programs:  '#0A2A3A',
    Wellbeing: '#2A1A3A',
  };

  return (
    <section className="bg-brand-section-alt px-6 py-12 md:px-16 md:py-16">
      <div className="max-w-7xl mx-auto">
        <p className="font-body font-medium text-[13px] text-brand-violet uppercase tracking-[0.06em] mb-1">
          Browse by category
        </p>
        <p className="font-body text-sm text-brand-text-muted mb-6">
          Curated from 43 verified Victorian sources · Updated every Tuesday and Friday
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const count = counts[cat.name];
            return (
              <Link
                key={cat.name}
                to={cat.href}
                className="bg-white border border-brand-card-border rounded-xl p-5 pt-5 pb-5 transition-all duration-150 hover:border-brand-violet hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 group"
              >
                <div className="w-10 h-10 rounded-lg mb-2.5 flex items-center justify-center" style={{ backgroundColor: categoryColors[cat.name] || '#5847E0' }}>
                  {(() => {
                    const iconMap: Record<string, any> = { Events: Calendar, Jobs: Briefcase, Grants: Award, Programs: BookOpen, Wellbeing: Heart };
                    const Icon = iconMap[cat.name];
                    return Icon ? <Icon size={20} className="text-white" /> : null;
                  })()}
                </div>
                <p className="font-heading font-bold text-[15px] text-brand-text-primary">{cat.name}</p>
                <p className="font-body text-[13px] text-brand-text-muted mt-1">{cat.desc}</p>
                <p className="font-body text-xs mt-1.5" style={{ color: count ? '#888888' : '#AAAAAA' }}>
                  {count === undefined ? '' : count === 0 ? 'No listings yet' : `${count} listing${count !== 1 ? 's' : ''}`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
