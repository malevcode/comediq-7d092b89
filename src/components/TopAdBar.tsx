import { Link } from "react-router-dom";
import { useBannerAds, recordAdClick, type BannerAd } from "@/hooks/useBannerAds";
import { useAuth } from "@/contexts/AuthContext";

const AdItem = ({ ad, userId }: { ad: BannerAd; userId?: string }) => {
  const className =
    "inline-flex items-center gap-1.5 px-3 py-0.5 mx-2 rounded-full bg-[#1a5fb4]/10 text-[#1a5fb4] text-[11px] font-semibold tracking-wide hover:bg-[#1a5fb4]/18 transition-colors whitespace-nowrap dark:bg-white/10 dark:text-white dark:hover:bg-white/18";

  const handleClick = () => {
    recordAdClick(ad.id, userId, 'top');
  };

  if (ad.external) {
    return (
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(event) => { event.stopPropagation(); handleClick(); }}
      >
        {ad.icon_url && <span className="text-sm leading-none">👍</span>}
        {ad.label}
      </a>
    );
  }

  return (
    <Link to={ad.href} className={className} onClick={handleClick}>
      {ad.icon_url && <span className="text-sm leading-none">👍</span>}
      {ad.label}
    </Link>
  );
};

const renderAdStrip = (ads: BannerAd[], repeatCount: number, userId?: string) => {
  const items: BannerAd[] = [];
  for (let i = 0; i < repeatCount; i++) items.push(...ads);
  return items.map((ad, index) => <AdItem key={`${ad.id}-${index}`} ad={ad} userId={userId} />);
};

export function TopAdBar() {
  const { user, subscriptionPlan } = useAuth();
  const { topAds } = useBannerAds();

  if (subscriptionPlan !== 'free' || topAds.length === 0) return null;

  return (
    <div className="w-full h-7 bg-white/20 overflow-x-auto overflow-y-hidden flex items-center scrollbar-hide touch-pan-x backdrop-blur-md dark:bg-white/[0.02]">
      <div className="animate-marquee whitespace-nowrap flex items-center hover:[animation-play-state:paused]">
        {renderAdStrip(topAds, 8, user?.id)}
      </div>
    </div>
  );
}

export default TopAdBar;
