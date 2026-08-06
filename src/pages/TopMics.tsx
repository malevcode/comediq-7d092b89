import { useWeeklyTopMics } from '@/hooks/useWeeklyTopMics';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import PageHeader from '@/components/PageHeader';

export default function TopMics() {
  const { data: topMics = [], isLoading } = useWeeklyTopMics();
  const titleTextClass = "text-[#07111f] dark:text-white";
  const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";
  const panelClass = "border border-[#07111f]/10 bg-white/50 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#102a53]/60 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.24)]";
  const rowClass = "group block rounded-2xl border border-[#07111f]/10 bg-white/50 p-4 text-[#07111f] shadow-[0_14px_44px_rgba(4,20,55,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_18px_60px_rgba(4,20,55,0.16)] dark:border-white/10 dark:bg-[#102a53]/50 dark:text-white dark:shadow-[0_18px_60px_rgba(2,10,30,0.24)] dark:hover:bg-[#102a53]/70 md:p-6";

  return (
    <>
      <PageHeader title="Top Mics" subtitle="This week's standout open mics" />
      <div className="min-h-screen bg-transparent pb-10 page-content-offset">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10">
          <section className={`${panelClass} rounded-3xl p-5 md:p-8`}>
            {/* Top meta row */}
            <div className={`mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] ${mutedTextClass}`}>
              <span>top mics</span>
              <span className="hidden sm:block">nyc · week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()}</span>
              <span>{topMics.length.toString().padStart(2, '0')} / 05</span>
            </div>

            {/* Massive display header */}
            <h1
              className={`font-bold leading-[0.85] tracking-[-0.04em] ${titleTextClass}`}
              style={{
                fontSize: 'clamp(3.5rem, 14vw, 12rem)',
              }}
            >
              top mics
            </h1>
            <p className={`mt-6 max-w-xl text-sm md:text-base ${mutedTextClass}`}>
              the most talked-about open mics in new york this week. hand-curated. updated every monday.
            </p>
          </section>

          {/* List */}
          <div className="mt-8 space-y-3 md:mt-10">
            {isLoading ? (
              <div className={`${panelClass} rounded-2xl p-6 text-sm uppercase tracking-[0.2em] ${mutedTextClass}`}>loading...</div>
            ) : topMics.length === 0 ? (
              <p className={`${panelClass} rounded-2xl p-6 text-sm uppercase tracking-[0.2em] ${mutedTextClass}`}>
                no rankings yet - check back monday.
              </p>
            ) : (
              topMics.map((mic) => {
                const to = mic.to || `/mics/${slugify(mic.venue_name || '')}-${slugify(mic.neighborhood || '')}?id=${mic.mic_unique_identifier}`;
                return (
                  <Link
                    key={mic.id}
                    to={to}
                    className={rowClass}
                  >
                    <div className="grid grid-cols-12 items-baseline">
                      {/* Rank */}
                      <div
                        className={`col-span-2 text-[11px] uppercase tracking-[0.2em] md:col-span-1 ${mutedTextClass}`}
                      >
                        {String(mic.rank).padStart(2, '0')}
                      </div>

                      {/* Name */}
                      <div className="col-span-10 md:col-span-7">
                        <div
                          className={`font-bold leading-[0.9] tracking-[-0.03em] transition-colors group-hover:text-[#1a5fb4] dark:group-hover:text-[#8ec5ff] ${titleTextClass}`}
                          style={{
                            fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
                          }}
                        >
                          {mic.mic_name.toLowerCase()}
                        </div>
                      </div>

                      {/* Attributes */}
                      <div className="col-start-3 md:col-start-9 col-span-10 md:col-span-4 grid grid-cols-3 gap-4 mt-3 md:mt-0">
                        <div>
                          <div className={`mb-0.5 text-[9px] uppercase tracking-[0.2em] ${mutedTextClass}`}>venue</div>
                          <div className={`truncate text-xs md:text-sm ${titleTextClass}`}>
                            {mic.venue_name || '—'}
                          </div>
                        </div>
                        <div>
                          <div className={`mb-0.5 text-[9px] uppercase tracking-[0.2em] ${mutedTextClass}`}>when</div>
                          <div className={`truncate text-xs md:text-sm ${titleTextClass}`}>
                            {mic.day ? mic.day.slice(0, 3) : '—'}{mic.start_time ? ` · ${mic.start_time}` : ''}
                          </div>
                        </div>
                        <div>
                          <div className={`mb-0.5 text-[9px] uppercase tracking-[0.2em] ${mutedTextClass}`}>cost</div>
                          <div className={`truncate text-xs md:text-sm ${titleTextClass}`}>
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
