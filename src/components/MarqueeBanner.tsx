import { Link, useLocation } from "react-router-dom";
import { useBannerAds, recordAdClick, type BannerAd } from "@/hooks/useBannerAds";
import { useAuth } from "@/contexts/AuthContext";

const MIN_AD_ITEMS_PER_LOOP = 48;

interface AdBox {
  id?: string;
  label: string;
  href: string;
  external?: boolean;
  icon_url?: string | null;
}

const AdItem = ({ ad, userId }: { ad: AdBox; userId?: string }) => {
  const className =
    "inline-flex h-5 items-center gap-1.5 px-3 mx-2 rounded-full bg-[#1a5fb4]/10 text-[#1a5fb4] text-[11px] leading-none font-semibold tracking-wide hover:bg-[#1a5fb4]/20 transition-colors whitespace-nowrap dark:bg-white/10 dark:text-white dark:hover:bg-white/20";

  const handleClick = () => {
    if (ad.id) {
      recordAdClick(ad.id, userId);
    }
  };

  const icon = ad.icon_url ? (
    <span className="text-sm leading-none flex-shrink-0">👍</span>
  ) : null;

  if (ad.external) {
    return (
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
      >
        {icon}
        {ad.label}
      </a>
    );
  }

  return (
    <Link to={ad.href} className={className} onClick={handleClick}>
      {icon}
      {ad.label}
    </Link>
  );
};

const getRepeatCount = (adCount: number) => Math.max(8, Math.ceil(MIN_AD_ITEMS_PER_LOOP / adCount));

const renderAdStrip = (ads: AdBox[], repeatCount: number, loopIndex: number, userId?: string) => {
  const items: AdBox[] = [];
  for (let i = 0; i < repeatCount; i++) {
    items.push(...ads);
  }
  return items.map((ad, idx) => <AdItem key={`${ad.id ?? ad.label}-${loopIndex}-${idx}`} ad={ad} userId={userId} />);
};

const renderRecurringAdStrip = (ads: AdBox[], repeatCount: number, userId?: string) => {
  return [0, 1].map((loopIndex) => (
    <div key={loopIndex} className="flex shrink-0 items-center">
      {renderAdStrip(ads, repeatCount, loopIndex, userId)}
    </div>
  ));
};

const isMicSignupPath = (pathname: string) =>
  pathname === '/mic-signup' || /^\/mic\/[^/]+\/signup\/?$/.test(pathname);

const MarqueeBanner = () => {
  const { bottomAds } = useBannerAds();
  const { user, subscriptionPlan } = useAuth();
  const location = useLocation();

  if (location.pathname.startsWith('/auth')) return null;
  if (isMicSignupPath(location.pathname)) return null;
  if (subscriptionPlan !== 'free') return null;
  if (bottomAds.length === 0) return null;

  return (
    <>
      <div
        className="keyboard-fixed-hide fixed bottom-[4.75rem] left-0 right-0 z-[50] h-7 shrink-0 bg-white/10 overflow-x-hidden overflow-y-hidden flex items-center shadow-[0_-10px_35px_rgba(4,20,55,0.14)] backdrop-blur-xl dark:bg-[#07111f]/20 dark:shadow-[0_-10px_35px_rgba(4,20,55,0.24)]"
      >
        <div className="animate-marquee whitespace-nowrap flex w-max items-center">
          {renderRecurringAdStrip(bottomAds as AdBox[], getRepeatCount(bottomAds.length), user?.id)}
        </div>
      </div>
    </>
  );
};

export default MarqueeBanner;
