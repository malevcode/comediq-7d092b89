import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CalendarDays, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const BRAND_BLUE = '#1a5fb4';

type Role = 'performer' | 'host' | 'showrunner';

const roles: { id: Role; icon: React.ReactNode; label: string; description: string }[] = [
  {
    id: 'performer',
    icon: <Mic className="w-6 h-6" />,
    label: 'Comedian / Performer',
    description: 'Find open mics, track your sets, build your set list.',
  },
  {
    id: 'host',
    icon: <CalendarDays className="w-6 h-6" />,
    label: 'Open Mic Host',
    description: 'Manage signups, run your room, connect with performers.',
  },
  {
    id: 'showrunner',
    icon: <Users className="w-6 h-6" />,
    label: 'Show Producer',
    description: 'Book lineups, promote shows, manage your roster.',
  },
];

const Onboarding = () => {
  const { user, needsOnboarding, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role | null>(null);
  const [runsOpenMic, setRunsOpenMic] = useState(false);
  const [runsShow, setRunsShow] = useState(false);
  const [micOrShowName, setMicOrShowName] = useState('');
  const [wantsListingPromo, setWantsListingPromo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !needsOnboarding) navigate('/perform');
  }, [user, loading, needsOnboarding, navigate]);

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setSaving(true);

    const runsAnything = runsOpenMic || runsShow || selected === 'host' || selected === 'showrunner';
    const cleanedName = micOrShowName.trim();

    const { error: responseError } = await (supabase as any)
      .from('user_onboarding_responses')
      .upsert({
        user_id: user.id,
        primary_use: selected,
        runs_open_mic: runsOpenMic || selected === 'host',
        runs_show: runsShow || selected === 'showrunner',
        mic_or_show_name: cleanedName || null,
        wants_listing_promo: runsAnything && wantsListingPromo,
      }, { onConflict: 'user_id' });

    if (responseError) {
      setSaving(false);
      toast({ title: 'Could not save onboarding', description: responseError.message, variant: 'destructive' });
      return;
    }

    const { error: roleError } = await (supabase as any)
      .from('user_roles')
      .upsert({ user_id: user.id, role: selected }, { onConflict: 'user_id,role' });

    if (roleError) {
      setSaving(false);
      toast({ title: 'Could not save role', description: roleError.message, variant: 'destructive' });
      return;
    }

    refreshProfile();
    setSaving(false);
    navigate(selected === 'performer' ? '/perform' : '/host-dashboard', { replace: true });
  };

  return (
    <>
      <SEO title="Welcome to Comediq" description="Tell us how you use Comediq." url="https://comediq.us/onboarding" noindex={true} />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10 justify-center">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BRAND_BLUE }}>
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-lg">Comediq</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">How do you use Comediq?</h1>
          <p className="text-sm text-gray-500 mb-8 text-center">We'll tailor the experience for you. You can change this later.</p>

          <div className="space-y-3 mb-6">
            {roles.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  selected === r.id
                    ? 'border-[#1a5fb4] bg-[#1a5fb4]/5'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className={selected === r.id ? 'text-[#1a5fb4]' : 'text-gray-400'}>{r.icon}</span>
                <div>
                  <p className={`font-medium text-sm ${selected === r.id ? 'text-[#1a5fb4]' : 'text-gray-900'}`}>{r.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="space-y-4 mb-6 rounded-xl border border-gray-200 p-4 bg-gray-50/60">
              <div className="space-y-3">
                <Label className="text-sm text-gray-900">Do you run an open mic or show?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <Checkbox checked={runsOpenMic || selected === 'host'} disabled={selected === 'host'} onCheckedChange={(checked) => setRunsOpenMic(checked === true)} />
                    I run an open mic
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <Checkbox checked={runsShow || selected === 'showrunner'} disabled={selected === 'showrunner'} onCheckedChange={(checked) => setRunsShow(checked === true)} />
                    I run a show
                  </label>
                </div>
              </div>

              {(runsOpenMic || runsShow || selected === 'host' || selected === 'showrunner') && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="micOrShowName" className="text-sm text-gray-900">Open mic or show name</Label>
                    <Input
                      id="micOrShowName"
                      value={micOrShowName}
                      onChange={(event) => setMicOrShowName(event.target.value)}
                      maxLength={120}
                      placeholder="e.g. Sunday Night Mic"
                      className="mt-2 bg-white"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <Checkbox checked={wantsListingPromo} onCheckedChange={(checked) => setWantsListingPromo(checked === true)} />
                    <span>I want to list it on Comediq for extra promo</span>
                  </label>
                </div>
              )}
            </div>
          )}

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selected || saving}
            className="w-full h-12 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: BRAND_BLUE }}
          >
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
