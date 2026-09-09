import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, MicVocal, Ticket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useWeeklyTopMics } from '@/hooks/useWeeklyTopMics';
import { useAudienceShows } from '@/hooks/useAudienceShows';
import OpenMicsMapRefactored from '@/components/map/OpenMicsMapRefactored';
import AudienceShowsMap from '@/components/map/AudienceShowsMap';
import { slugify } from '@/utils/slugify';
import SEO from '@/components/SEO';

type Segment = 'shows' | 'mics';

const SEGMENT_STORAGE_KEY = 'comediq_map_segment';

const SHOWS_WINDOW_DAYS = 5;

export default function UnifiedMap() {
  const navigate = useNavigate();
  const { user, isApprovedComedian } = useAuth();

  // Comedians land on mics, everyone else lands on the ticket-buying surface.
  const [segment, setSegment] = useState<Segment>(isApprovedComedian ? 'mics' : 'shows');

  useEffect(() => {
    const saved = localStorage.getItem(SEGMENT_STORAGE_KEY);
    if (saved === 'shows' || saved === 'mics') {
      setSegment(saved);
    } else {
      setSegment(isApprovedComedian ? 'mics' : 'shows');
    }
  }, [isApprovedComedian]);

  const selectSegment = (next: Segment) => {
    setSegment(next);
    localStorage.setItem(SEGMENT_STORAGE_KEY, next);
  };

  const showFilters = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + SHOWS_WINDOW_DAYS);
    return {
      dateFrom: today.toISOString().split('T')[0],
      dateTo: end.toISOString().split('T')[0],
    };
  }, []);

  const { data: allMics = [] } = useOpenMics();
  const { data: topMics = [] } = useWeeklyTopMics();
  const { data: shows = [] } = useAudienceShows(showFilters);

  // Audience view is limited to the curated weekly top mics. The full catalog is
  // the reason to become an approved comedian.
  const visibleMics = useMemo(() => {
    if (isApprovedComedian) return allMics;
    const topIds = new Set(topMics.map(mic => mic.mic_unique_identifier));
    return allMics.filter(mic => topIds.has(mic.uniqueIdentifier));
  }, [allMics, topMics, isApprovedComedian]);

  const lockedCopy = user
    ? {
        title: 'Your comedian account is under review',
        body: 'We approve new comedians by hand so the mic list stays real. You will get the full map as soon as you are cleared.',
        cta: null,
      }
    : {
        title: `${allMics.length || '500'}+ open mics across NYC`,
        body: 'The full open mic map is for comedians. Create a free account to unlock every mic, track your sets, and build your comedy history.',
        cta: { label: 'Create a free account', to: '/auth/create' },
      };

  return (
    <>
      <SEO
        title="Comedy Map | Comediq"
        description="Live comedy shows and open mics across New York City on one map."
        url="https://comediq.us/map"
      />

      {/* Full-bleed map between the header offset and the bottom nav. */}
      <div
        className="fixed inset-x-0 z-10 bg-[#f5f2eb] dark:bg-[#07111f]"
        style={{ top: 'var(--page-top-offset)', bottom: 0 }}
      >
        {segment === 'shows' ? (
          <AudienceShowsMap shows={shows} />
        ) : (
          <OpenMicsMapRefactored
            mics={visibleMics}
            variant="full"
            onMicSelect={(mic) =>
              navigate(
                `/mics/${slugify(mic.venueName || '')}-${slugify(mic.neighborhood || '')}?id=${mic.uniqueIdentifier}`
              )
            }
          />
        )}
      </div>

      {/* Segmented control */}
      <div
        className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4"
        style={{ top: 'calc(var(--page-top-offset) + 0.75rem)' }}
      >
        <div className="pointer-events-auto flex gap-1 rounded-full border border-white/40 bg-white/70 p-1 shadow-[0_12px_38px_rgba(2,10,30,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/70">
          {([
            { key: 'shows' as const, label: 'Shows', icon: Ticket },
            { key: 'mics' as const, label: 'Mics', icon: MicVocal },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectSegment(key)}
              aria-pressed={segment === key}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                segment === key
                  ? 'bg-[#1a5fb4] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Unlock card: only on the mics segment, only for non-comedians. */}
      {segment === 'mics' && !isApprovedComedian && (
        <div className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4" style={{ bottom: '132px' }}>
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/40 bg-white/85 p-4 shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/85">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#1a5fb4]/10 p-2 text-[#1a5fb4] dark:bg-white/10 dark:text-[#8ec5ff]">
                <Lock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#07111f] dark:text-white">{lockedCopy.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#07111f]/60 dark:text-white/60">{lockedCopy.body}</p>
                {lockedCopy.cta && (
                  <button
                    type="button"
                    onClick={() => navigate(lockedCopy.cta!.to)}
                    className="mt-3 w-full rounded-full bg-[#1a5fb4] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#164e96]"
                  >
                    {lockedCopy.cta.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
