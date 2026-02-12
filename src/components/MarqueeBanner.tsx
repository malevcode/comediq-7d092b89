import { Link } from "react-router-dom";
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
    "inline-flex items-center gap-1.5 px-4 py-0.5 mx-3 rounded-full bg-[#1a5fb4]/20 text-[#1a5fb4] text-xs font-semibold tracking-wide hover:bg-[#1a5fb4]/30 transition-colors whitespace-nowrap";

  const handleClick = () => {
    if (ad.id) {
      recordAdClick(ad.id, userId);
    }
  };

  const icon = ad.icon_url ? (
    <img src={ad.icon_url} alt="" className="w-4 h-4 rounded-full object-cover" />
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

const MarqueeBanner = () => {
  const { topAds, bottomAds } = useBannerAds();
  const { user } = useAuth();

  return (
    <>
      <div className="fixed top-[80px] left-0 right-0 z-[45] h-7 bg-[#f5f0e6] border-b border-[#d4c4a8] overflow-x-auto overflow-y-hidden flex items-center scrollbar-hide touch-pan-x">
        <div className="animate-marquee whitespace-nowrap flex items-center hover:[animation-play-state:paused]">
          {renderAdStrip(topAds as AdBox[], 10, user?.id)}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[60] h-7 bg-[#f5f0e6] border-t border-[#d4c4a8] overflow-x-auto overflow-y-hidden flex items-center scrollbar-hide touch-pan-x">
        <div className="animate-marquee whitespace-nowrap flex items-center hover:[animation-play-state:paused]">
          {renderAdStrip(bottomAds as AdBox[], 8, user?.id)}
        </div>
      </div>
    </>
  );
};

export default MarqueeBanner;
