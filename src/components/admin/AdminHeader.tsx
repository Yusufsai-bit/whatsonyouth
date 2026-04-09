import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  title: string;
  showAddButton?: boolean;
}

export default function AdminHeader({ title, showAddButton = true }: AdminHeaderProps) {
  return (
    <header className="h-[60px] bg-white border-b border-brand-card-border flex items-center justify-between px-6 md:px-8 flex-shrink-0">
      <h1 className="font-heading font-bold text-xl text-brand-text-primary pl-10 md:pl-0">{title}</h1>
      {showAddButton && (
        <Link
          to="/admin/add"
          className="bg-brand-coral text-white font-heading font-bold text-sm rounded-lg px-[18px] py-2 transition-colors hover:bg-brand-coral-light"
        >
          Add listing
        </Link>
      )}
    </header>
  );
}
