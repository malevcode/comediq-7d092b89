import { Link, useLocation } from "react-router-dom";
import { useBannerAds, recordAdClick, type BannerAd } from "@/hooks/useBannerAds";
import { useAuth } from "@/contexts/AuthContext";

interface AdBox {
  id?: string;
  label: string;
  href: string;
  external?: boolean;
  icon_url?: string | null;
}

const AdItem = ({ ad, userId }: { ad: AdBox; userId?: string }) => {
  const className =
    "inline-flex items-center gap-1.5 px-4 py-0.5 mx-3 rounded-full bg-[#1a5fb4]/10 text-[#1a5fb4] text-xs font-semibold tracking-wide hover:bg-[#1a5fb4]/18 transition-colors whitespace-nowrap dark:bg-white/10 dark:text-white dark:hover:bg-white/18";

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

const renderAdStrip = (ads: AdBox[], repeatCount: number, userId?: string) => {
  const items: AdBox[] = [];
  for (let i = 0; i < repeatCount; i++) {
    items.push(...ads);
  }
  return items.map((ad, idx) => <AdItem key={`${ad.label}-${idx}`} ad={ad} userId={userId} />);
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

  return (
    <>
      <div className="fixed bottom-[4.75rem] left-0 right-0 z-[50] h-7 bg-white/32 overflow-x-auto overflow-y-hidden flex items-center scrollbar-hide touch-pan-x shadow-[0_-10px_35px_rgba(4,20,55,0.14)] backdrop-blur-xl dark:bg-[#07111f]/62 dark:shadow-[0_-10px_35px_rgba(4,20,55,0.24)]">
        <div className="animate-marquee whitespace-nowrap flex items-center hover:[animation-play-state:paused]">
          {renderAdStrip(bottomAds as AdBox[], 8, user?.id)}
        </div>
      </div>
    </>
  );
};

export default MarqueeBanner;
