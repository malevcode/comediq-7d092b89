import { Link } from "react-router-dom";

interface AdBox {
  label: string;
  href: string;
  external?: boolean;
}

const topAds: AdBox[] = [
  { label: "#MeThree", href: "https://metoomvmt.org/", external: true },
  { label: "Comediq Supports Safe Funny Spaces", href: "/" },
  { label: "Advertise!", href: "https://docs.google.com/forms/d/e/1FAIpQLSe58Za3tfgyuUFNoVxQb_qAe3PPfVrnm4gciw_cklp-HPkKQg/viewform?usp=publish-editor", external: true },
];

const bottomAds: AdBox[] = [
  { label: "Add A Mic", href: "/open-mics?addMic=true" },
  { label: "Add Your Show", href: "https://forms.gle/6acD4UbmJyY45tzz9", external: true },
  { label: "Feedback", href: "https://docs.google.com/forms/d/e/1FAIpQLSeDk4FdZGDD1APBNCUzV1IhaylLiHSAnlmhUaUz503umv457A/viewform?usp=dialog", external: true },
  { label: "Advertise!", href: "https://docs.google.com/forms/d/e/1FAIpQLSe58Za3tfgyuUFNoVxQb_qAe3PPfVrnm4gciw_cklp-HPkKQg/viewform?usp=publish-editor", external: true },
];

const AdItem = ({ ad }: { ad: AdBox }) => {
  const className =
    "inline-flex items-center px-4 py-0.5 mx-3 rounded-full bg-[#1a5fb4]/20 text-[#1a5fb4] text-xs font-semibold tracking-wide hover:bg-[#1a5fb4]/30 transition-colors whitespace-nowrap";

  if (ad.external) {
    return (
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {ad.label}
      </a>
    );
  }

  return (
    <Link to={ad.href} className={className}>
      {ad.label}
    </Link>
  );
};

const renderAdStrip = (ads: AdBox[], repeatCount: number) => {
  const items: AdBox[] = [];
  for (let i = 0; i < repeatCount; i++) {
    items.push(...ads);
  }
  return items.map((ad, idx) => <AdItem key={`${ad.label}-${idx}`} ad={ad} />);
};

const MarqueeBanner = () => {
  return (
    <>
      {/* Top banner - fixed just below the PageHeader (~80px) */}
      <div className="fixed top-[80px] left-0 right-0 z-[45] h-7 bg-[#f5f0e6] border-b border-[#d4c4a8] overflow-hidden flex items-center">
        <div className="animate-marquee whitespace-nowrap flex items-center">
          {renderAdStrip(topAds, 10)}
        </div>
      </div>

      {/* Bottom banner - fixed at very bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] h-7 bg-[#f5f0e6] border-t border-[#d4c4a8] overflow-hidden flex items-center">
        <div className="animate-marquee whitespace-nowrap flex items-center">
          {renderAdStrip(bottomAds, 8)}
        </div>
      </div>
    </>
  );
};

export default MarqueeBanner;
