import { Link } from 'react-router-dom';

interface OpportunityCardProps {
  category: string;
  title: string;
  organisation: string;
  location: string;
  dateInfo: string;
  communityBadge?: boolean;
  href?: string;
}

const categoryColors: Record<string, string> = {
  Events: '#2D1B69',
  Grants: '#1A3A2A',
  Jobs: '#1A2A4A',
  Programs: '#3D2A0A',
  Wellbeing: '#2A1A3A',
};

export function OpportunityCard({ category, title, organisation, location, dateInfo, communityBadge, href }: OpportunityCardProps) {
  const imgBg = categoryColors[category] || '#2D1B69';

  return (
    <div className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:border-brand-violet hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
      {/* Image placeholder */}
      <div className="w-full h-40 relative" style={{ backgroundColor: imgBg }}>
        <span className="absolute bottom-3 left-3 bg-white/90 text-brand-text-primary font-body font-medium text-xs rounded-full px-2.5 py-1">
          {category}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <span className="inline-block self-start bg-brand-violet-surface text-brand-violet font-body font-medium text-[11px] rounded-full px-2.5 py-[3px]">
          {category}
        </span>
        <h3 className="font-heading font-bold text-[17px] text-brand-text-primary mt-2">{title}</h3>
        <p className="font-body text-[13px] text-brand-text-secondary mt-1">{organisation}</p>
        <p className="font-body text-xs text-brand-text-muted mt-1">{location} · {dateInfo}</p>
        {communityBadge && (
          <span className="inline-block self-start bg-brand-section-alt border border-brand-card-border text-brand-text-muted font-body text-[11px] rounded-full px-2 py-[2px] mt-2">
            Submitted by community
          </span>
        )}
        <Link
          to={href || '#'}
          className="font-body font-medium text-[13px] text-brand-violet mt-3 hover:underline"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}

const featured = [
  { category: 'Events', title: 'Youth Climate Summit 2025', organisation: 'Sustainability Victoria', location: 'Melbourne CBD', dateInfo: '15 March 2025' },
  { category: 'Grants', title: 'Create Your Future Fund', organisation: 'Creative Victoria', location: 'Victoria-wide', dateInfo: 'Applications close 28 Feb' },
  { category: 'Jobs', title: 'Junior Marketing Assistant', organisation: 'City of Yarra', location: 'Richmond', dateInfo: 'Posted 2 days ago', communityBadge: true },
];

export default function FeaturedOpportunities() {
  return (
    <section className="bg-white px-6 py-12 md:px-16 md:py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[28px] md:text-[32px] tracking-[-0.02em] text-brand-text-primary">Featured opportunities</h2>
        <p className="font-body text-base text-brand-text-secondary mb-8">
          Updated regularly. Curated for young Victorians.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((item) => (
            <OpportunityCard key={item.title} {...item} />
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <Link
            to="/events"
            className="bg-brand-violet text-white font-heading font-bold text-base rounded-lg px-8 py-3.5 transition-colors duration-100 hover:opacity-90"
          >
            View all opportunities
          </Link>
        </div>
      </div>
    </section>
  );
}
