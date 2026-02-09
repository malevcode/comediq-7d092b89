const MarqueeBanner = () => {
  const message = "#MeThree · comediq.us supports safe funny spaces · ";
  const repeated = message.repeat(12);

  return (
    <>
      {/* Top banner - fixed just below the PageHeader (~80px) */}
      <div className="fixed top-20 left-0 right-0 z-[45] h-6 bg-comediq-blue overflow-hidden flex items-center">
        <div className="animate-marquee whitespace-nowrap text-white text-xs font-medium tracking-wide">
          {repeated}
        </div>
      </div>

      {/* Bottom banner - fixed at very bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] h-6 bg-comediq-blue overflow-hidden flex items-center">
        <div className="animate-marquee-reverse whitespace-nowrap text-white text-xs font-medium tracking-wide">
          {repeated}
        </div>
      </div>
    </>
  );
};

export default MarqueeBanner;
