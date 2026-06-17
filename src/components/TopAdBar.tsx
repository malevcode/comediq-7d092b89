import { Link } from "react-router-dom";
import { useBannerAds, recordAdClick, type BannerAd } from "@/hooks/useBannerAds";
import { useAuth } from "@/contexts/AuthContext";

interface AdBox {
  id?: string;
  label: string;
  href: string;
  external?: boolean;
}

const AdItem = ({ ad, userId }: { ad: AdBox; userId?: string }) => {
  const className =
    "inline-flex items-center gap-1.5 px-3 py-0.5 mx-2 rounded-full bg-[#1a5fb4]/10 text-[#1a5fb4] text-[11px] font-semibold tracking-wide hover:bg-[#1a5fb4]/20 transition-colors whitespace-nowrap";

  const handleClick = () => {
    if (ad.id) {
      recordAdClick(ad.id, userId);
    }
  };

  if (ad.external) {
    return (
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
      >
        {ad.label}
      </a>
    );
  }

  return (
    <Link to={ad.href} className={className} onClick={handleClick}>
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

export function TopAdBar() {
  const { topAds } = useBannerAds();
  const { user } = useAuth();

  if (!topAds || topAds.length === 0) return null;

  return (
    <div className="w-full h-7 bg-[#f5f0e6] border-b border-[#d4c4a8] overflow-x-auto overflow-y-hidden flex items-center scrollbar-hide touch-pan-x">
      <div className="animate-marquee whitespace-nowrap flex items-center hover:[animation-play-state:paused]">
        {renderAdStrip(topAds as AdBox[], 8, user?.id)}
      </div>
    </div>
  );
}

export default TopAdBar;
