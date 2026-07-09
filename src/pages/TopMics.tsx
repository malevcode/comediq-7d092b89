import { useWeeklyTopMics } from '@/hooks/useWeeklyTopMics';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import PageHeader from '@/components/PageHeader';

const CREAM = '#f5f0e6';

export default function TopMics() {
  const { data: topMics = [], isLoading } = useWeeklyTopMics();

  return (
    <>
      <PageHeader />
      <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-24" style={{ color: CREAM }}>
        <div className="max-w-[1600px] mx-auto px-5 md:px-10">
          {/* Top meta row */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-white/50 mb-10">
            <span>top mics</span>
            <span className="hidden sm:block">nyc · week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()}</span>
            <span>{topMics.length.toString().padStart(2, '0')} / 05</span>
          </div>

          {/* Massive display header */}
          <h1
            className="font-bold leading-[0.85] tracking-[-0.04em]"
            style={{
              color: CREAM,
              fontSize: 'clamp(3.5rem, 14vw, 12rem)',
            }}
          >
            top mics
          </h1>
          <p className="mt-6 text-white/50 text-sm md:text-base max-w-xl">
            the most talked-about open mics in new york this week. hand-curated. updated every monday.
          </p>

          {/* List */}
          <div className="mt-20">
            {isLoading ? (
              <div className="text-white/40 text-sm uppercase tracking-[0.2em]">loading…</div>
            ) : topMics.length === 0 ? (
              <p className="text-white/40 text-sm uppercase tracking-[0.2em]">
                no rankings yet — check back monday.
              </p>
            ) : (
              topMics.map((mic) => {
                const to = mic.to || `/mics/${slugify(mic.venue_name || '')}-${slugify(mic.neighborhood || '')}?id=${mic.mic_unique_identifier}`;
                return (
                  <Link
                    key={mic.id}
                    to={to}
                    className="group block border-t border-white/10 py-6 md:py-8 last:border-b transition"
                  >
                    <div className="grid grid-cols-12 gap-4 items-baseline">
                      {/* Rank */}
                      <div
                        className="col-span-2 md:col-span-1 text-[11px] uppercase tracking-[0.2em] text-white/40"
                      >
                        {String(mic.rank).padStart(2, '0')}
                      </div>

                      {/* Name — huge */}
                      <div className="col-span-10 md:col-span-7">
                        <div
                          className="font-bold leading-[0.9] tracking-[-0.03em] transition-opacity group-hover:opacity-70"
                          style={{
                            color: CREAM,
                            fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
                          }}
                        >
                          {mic.mic_name.toLowerCase()}
                        </div>
                      </div>

                      {/* Attributes — tiny */}
                      <div className="col-start-3 md:col-start-9 col-span-10 md:col-span-4 grid grid-cols-3 gap-4 mt-3 md:mt-0">
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-0.5">venue</div>
                          <div className="text-xs md:text-sm truncate" style={{ color: CREAM }}>
                            {mic.venue_name || '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-0.5">when</div>
                          <div className="text-xs md:text-sm truncate" style={{ color: CREAM }}>
                            {mic.day ? mic.day.slice(0, 3) : '—'}{mic.start_time ? ` · ${mic.start_time}` : ''}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-0.5">cost</div>
                          <div className="text-xs md:text-sm truncate" style={{ color: CREAM }}>
                            {mic.cost || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
