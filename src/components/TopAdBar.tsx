import { Link } from "react-router-dom";
import { useBannerAds, recordAdClick, type BannerAd } from "@/hooks/useBannerAds";
import { useAuth } from "@/contexts/AuthContext";

const MIN_AD_ITEMS_PER_LOOP = 48;

const AdItem = ({ ad, userId }: { ad: BannerAd; userId?: string }) => {
  const className =
    "inline-flex h-5 items-center gap-1.5 px-3 mx-2 rounded-full bg-[#1a5fb4]/10 text-[#1a5fb4] text-[11px] leading-none font-semibold tracking-wide hover:bg-[#1a5fb4]/20 transition-colors whitespace-nowrap dark:bg-white/10 dark:text-white dark:hover:bg-white/20";

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

const getRepeatCount = (adCount: number) => Math.max(8, Math.ceil(MIN_AD_ITEMS_PER_LOOP / adCount));

const renderAdStrip = (ads: BannerAd[], repeatCount: number, loopIndex: number, userId?: string) => {
  const items: BannerAd[] = [];
  for (let i = 0; i < repeatCount; i++) items.push(...ads);
  return items.map((ad, index) => <AdItem key={`${ad.id}-${loopIndex}-${index}`} ad={ad} userId={userId} />);
};

const renderRecurringAdStrip = (ads: BannerAd[], repeatCount: number, userId?: string) => {
  return [0, 1].map((loopIndex) => (
    <div key={loopIndex} className="flex shrink-0 items-center">
      {renderAdStrip(ads, repeatCount, loopIndex, userId)}
    </div>
  ));
};

export function TopAdBar() {
  const { user, subscriptionPlan } = useAuth();
  const { topAds } = useBannerAds();

  if (subscriptionPlan !== 'free' || topAds.length === 0) return null;

  return (
    <div className="w-full h-7 shrink-0 bg-white/10 overflow-x-hidden overflow-y-hidden flex items-center backdrop-blur-xl dark:bg-[#07111f]/20">
      <div className="animate-marquee-slow whitespace-nowrap flex w-max items-center">
        {renderRecurringAdStrip(topAds, getRepeatCount(topAds.length), user?.id)}
      </div>
    </div>
  );
}

export default TopAdBar;
