import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

function timeAgoShort(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, { value: string; updated_at: string }>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from('platform_settings').select('key, value, updated_at');
    if (data) {
      const map: Record<string, { value: string; updated_at: string }> = {};
      data.forEach(s => { map[s.key] = { value: s.value || '', updated_at: s.updated_at }; });
      setSettings(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const getValue = (key: string) => settings[key]?.value || '';
  const getUpdated = (key: string) => settings[key]?.updated_at || '';
  const setValue = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  const saveKeys = async (keys: string[]) => {
    for (const key of keys) {
      await supabase.from('platform_settings').upsert(
        { key, value: getValue(key), updated_at: new Date().toISOString() } as any,
        { onConflict: 'key' }
      );
    }
    toast('Settings saved');
    fetchSettings();
  };

  if (loading) return <AdminLayout><AdminHeader title="Settings" showAddButton={false} /><div className="p-8 font-body text-sm text-[#888888]">Loading...</div></AdminLayout>;

  const inputClass = "w-full border border-[#DDDDDD] rounded-lg px-3.5 py-3 font-body text-sm text-[#0A0A0A] focus:outline-none focus:border-[#5847E0] bg-white";
  const labelClass = "font-body font-medium text-sm text-[#0A0A0A] block mb-1.5";

  const homepageKeys = ['featured_heading', 'hero_subheading', 'show_regional_banner'];
  const platformKeys = ['contact_email', 'announcement_active', 'announcement_text'];
  const listingsKeys = ['auto_expire_listings', 'default_expiry_events', 'default_expiry_jobs'];

  const latestUpdate = (keys: string[]) => {
    const dates = keys.map(k => getUpdated(k)).filter(Boolean);
    if (dates.length === 0) return '';
    return timeAgoShort(dates.sort().reverse()[0]);
  };

  return (
    <AdminLayout>
      <AdminHeader title="Settings" showAddButton={false} />
      <div className="p-6 md:p-8 overflow-auto space-y-6 max-w-[680px]">
        {/* Homepage */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <h2 className="font-heading font-bold text-lg text-[#0A0A0A] mb-4">Homepage</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Featured section heading</label>
              <input type="text" value={getValue('featured_heading')} onChange={e => setValue('featured_heading', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hero subheading</label>
              <textarea value={getValue('hero_subheading')} onChange={e => setValue('hero_subheading', e.target.value)} className={`${inputClass} min-h-[80px] resize-none`} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={getValue('show_regional_banner') === 'true'} onChange={e => setValue('show_regional_banner', e.target.checked ? 'true' : 'false')} className="w-4 h-4 accent-[#5847E0]" />
              <span className="font-body text-sm text-[#0A0A0A]">Show regional banner</span>
            </label>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => saveKeys(homepageKeys)} className="bg-[#5847E0] text-white font-heading font-bold text-sm rounded-lg px-5 py-2.5">Save</button>
            {latestUpdate(homepageKeys) && <span className="font-body text-xs text-[#888888]">Last updated {latestUpdate(homepageKeys)}</span>}
          </div>
        </div>

        {/* Platform */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <h2 className="font-heading font-bold text-lg text-[#0A0A0A] mb-4">Platform</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Contact email address</label>
              <input type="email" value={getValue('contact_email')} onChange={e => setValue('contact_email', e.target.value)} className={inputClass} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={getValue('announcement_active') === 'true'} onChange={e => setValue('announcement_active', e.target.checked ? 'true' : 'false')} className="w-4 h-4 accent-[#5847E0]" />
              <span className="font-body text-sm text-[#0A0A0A]">Show announcement banner</span>
            </label>
            {getValue('announcement_active') === 'true' && (
              <div>
                <label className={labelClass}>Announcement message</label>
                <input type="text" value={getValue('announcement_text')} onChange={e => setValue('announcement_text', e.target.value)} className={inputClass} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => saveKeys(platformKeys)} className="bg-[#5847E0] text-white font-heading font-bold text-sm rounded-lg px-5 py-2.5">Save</button>
            {latestUpdate(platformKeys) && <span className="font-body text-xs text-[#888888]">Last updated {latestUpdate(platformKeys)}</span>}
          </div>
        </div>

        {/* Listings */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <h2 className="font-heading font-bold text-lg text-[#0A0A0A] mb-4">Listings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={getValue('auto_expire_listings') === 'true'} onChange={e => setValue('auto_expire_listings', e.target.checked ? 'true' : 'false')} className="w-4 h-4 accent-[#5847E0]" />
              <span className="font-body text-sm text-[#0A0A0A]">Auto-deactivate expired listings</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Default expiry for Events (days)</label>
                <input type="number" value={getValue('default_expiry_events')} onChange={e => setValue('default_expiry_events', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Default expiry for Jobs (days)</label>
                <input type="number" value={getValue('default_expiry_jobs')} onChange={e => setValue('default_expiry_jobs', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => saveKeys(listingsKeys)} className="bg-[#5847E0] text-white font-heading font-bold text-sm rounded-lg px-5 py-2.5">Save</button>
            {latestUpdate(listingsKeys) && <span className="font-body text-xs text-[#888888]">Last updated {latestUpdate(listingsKeys)}</span>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
