import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  title: string;
  showAddButton?: boolean;
}

export default function AdminHeader({ title, showAddButton = true }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-[#EBEBEB] flex items-center justify-between px-6 md:px-8 flex-shrink-0">
      <h1 className="font-heading font-bold text-xl text-[#0A0A0A] pl-10 md:pl-0">{title}</h1>
      {showAddButton && (
        <Link
          to="/admin/add"
          className="bg-[#D85A30] text-white font-heading font-bold text-sm rounded-lg px-[18px] py-2 transition-colors hover:bg-[#F0997B]"
        >
          Add listing
        </Link>
      )}
    </header>
  );
}
