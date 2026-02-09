const MarqueeBanner = () => {
  const message = "#MeThree · comediq.us supports safe funny spaces · ";
  // Repeat enough times to fill the marquee seamlessly
  const repeated = message.repeat(12);

  return (
    <>
      {/* Top banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-6 bg-primary overflow-hidden flex items-center">
        <div className="animate-marquee whitespace-nowrap text-primary-foreground text-xs font-medium tracking-wide">
          {repeated}
        </div>
      </div>

      {/* Bottom banner - sits above the bottom nav */}
      <div className="fixed bottom-14 left-0 right-0 z-[60] h-6 bg-primary overflow-hidden flex items-center">
        <div className="animate-marquee-reverse whitespace-nowrap text-primary-foreground text-xs font-medium tracking-wide">
          {repeated}
        </div>
      </div>
    </>
  );
};

export default MarqueeBanner;
