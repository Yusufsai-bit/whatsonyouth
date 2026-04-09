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

export function OpportunityCard({ category, title, organisation, location, dateInfo, communityBadge, href }: OpportunityCardProps) {
  return (
    <div className="bg-white border border-brand-seafoam rounded-xl p-5 flex flex-col">
      <span className="inline-block self-start bg-brand-mint text-brand-teal font-body font-medium text-xs rounded-full px-2.5 py-[3px]">
        {category}
      </span>
      <h3 className="font-heading font-bold text-lg text-brand-forest mt-2">{title}</h3>
      <p className="font-body text-sm text-brand-mid-teal mt-1">{organisation}</p>
      <p className="font-body text-[13px] text-brand-mid-teal mt-1">{location} · {dateInfo}</p>
      {communityBadge && (
        <span className="inline-block self-start bg-brand-page-bg border border-brand-seafoam text-brand-mid-teal font-body text-[11px] rounded-full px-2 py-[2px] mt-2">
          Submitted by community
        </span>
      )}
      <Link
        to={href || '#'}
        className="font-body font-medium text-sm text-brand-teal mt-3 hover:underline"
      >
        View details →
      </Link>
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
    <section className="bg-brand-page-bg px-6 py-12 md:px-16 md:py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[28px] text-brand-forest">Featured opportunities</h2>
        <p className="font-body text-base text-brand-mid-teal mb-8">
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
            className="bg-brand-teal text-white font-heading font-bold text-base rounded-lg px-8 py-3.5 transition-colors duration-100 hover:bg-brand-mid-teal"
          >
            View all opportunities
          </Link>
        </div>
      </div>
    </section>
  );
}
