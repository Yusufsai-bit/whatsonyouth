import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at: string | null;
  listings_count: number;
  is_suspended: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: authUsers } = await supabase.rpc('list_users');
    if (!authUsers) { setLoading(false); return; }

    // Get listing counts
    const { data: listings } = await supabase.from('listings').select('user_id');
    const countMap: Record<string, number> = {};
    listings?.forEach(l => { countMap[l.user_id] = (countMap[l.user_id] || 0) + 1; });

    // Get suspension status
    const { data: profiles } = await supabase.from('profiles').select('user_id, is_suspended');
    const suspMap: Record<string, boolean> = {};
    profiles?.forEach(p => { suspMap[p.user_id] = p.is_suspended; });

    setUsers((authUsers as any[]).map(u => ({
      id: u.id,
      email: u.email || '',
      name: u.raw_user_meta_data?.first_name || '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      listings_count: countMap[u.id] || 0,
      is_suspended: suspMap[u.id] || false,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleSuspend = async (userId: string, current: boolean) => {
    // Upsert profile
    const { error } = await supabase.from('profiles').upsert(
      { user_id: userId, is_suspended: !current } as any,
      { onConflict: 'user_id' }
    );
    if (error) {
      toast.error('Failed to update user');
    } else {
      toast(current ? 'User reactivated' : 'User suspended');
      fetchUsers();
    }
  };

  return (
    <AdminLayout>
      <AdminHeader title="Users" showAddButton={false} />
      <div className="p-6 md:p-8 overflow-auto">
        {loading ? (
          <p className="font-body text-sm text-[#888888]">Loading users...</p>
        ) : (
          <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F7F7F7]">
                    <th className="px-5 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Email</th>
                    <th className="px-5 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden md:table-cell">Name</th>
                    <th className="px-5 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden lg:table-cell">Joined</th>
                    <th className="px-5 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden md:table-cell">Listings</th>
                    <th className="px-5 py-3 font-body font-medium text-[13px] text-[#888888] text-left hidden lg:table-cell">Last sign in</th>
                    <th className="px-5 py-3 font-body font-medium text-[13px] text-[#888888] text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className={`h-12 ${i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-sm text-[#0A0A0A]">{u.email}</span>
                          {u.is_suspended && (
                            <span className="inline-block bg-[#FEE2E2] text-[#E24B4A] font-body text-xs font-medium px-2 py-0.5 rounded-full">Suspended</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-body text-sm text-[#555555] hidden md:table-cell">{u.name || '—'}</td>
                      <td className="px-5 py-3 font-body text-sm text-[#888888] hidden lg:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3 font-body text-sm text-[#0A0A0A] hidden md:table-cell">{u.listings_count}</td>
                      <td className="px-5 py-3 font-body text-sm text-[#888888] hidden lg:table-cell">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link to={`/admin/listings?user_id=${u.id}`} className="font-body text-xs text-[#5847E0] hover:underline">View listings</Link>
                          <button
                            onClick={() => toggleSuspend(u.id, u.is_suspended)}
                            className={`font-body text-xs hover:underline ${u.is_suspended ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}
                          >
                            {u.is_suspended ? 'Reactivate' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center font-body text-sm text-[#888888]">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
