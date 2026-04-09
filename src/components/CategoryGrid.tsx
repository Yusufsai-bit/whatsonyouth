import { Link } from 'react-router-dom';

const categories = [
  { name: 'Events', desc: "What's on near you", href: '/events' },
  { name: 'Jobs', desc: 'Find work and internships', href: '/jobs' },
  { name: 'Grants', desc: 'Funding for your ideas', href: '/grants' },
  { name: 'Programs', desc: 'Courses and opportunities', href: '/programs' },
  { name: 'Wellbeing', desc: 'Support when you need it', href: '/wellbeing' },
];

export default function CategoryGrid() {
  return (
    <section className="bg-white px-6 py-12 md:px-16 md:py-16">
      <div className="max-w-7xl mx-auto">
        <p className="font-body font-medium text-[13px] text-brand-teal uppercase tracking-[0.06em] mb-6">
          Browse by category
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={cat.href}
              className="bg-brand-page-bg border border-brand-seafoam rounded-xl p-5 pt-5 pb-5 transition-colors duration-100 hover:border-brand-teal hover:bg-brand-mint group"
            >
              <div className="w-10 h-10 bg-brand-teal rounded-lg mb-2.5" />
              <p className="font-heading font-bold text-[15px] text-brand-forest">{cat.name}</p>
              <p className="font-body text-[13px] text-brand-mid-teal mt-1">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
