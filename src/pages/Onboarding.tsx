import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CalendarDays, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !needsOnboarding) navigate('/perform');
  }, [user, loading, needsOnboarding, navigate]);

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setSaving(true);
    setSaving(false);
    refreshProfile();
    navigate(selected === 'performer' ? '/perform' : '/host-dashboard');
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

          <div className="space-y-3 mb-8">
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

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected || saving}
            className="w-full py-3.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: BRAND_BLUE }}
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
