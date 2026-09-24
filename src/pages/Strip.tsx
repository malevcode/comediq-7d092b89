import PageHeader from "@/components/PageHeader";
import SEO from '@/components/SEO';

const STRIP_APP_URL = "https://strip.comediq.us";

const Strip = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <SEO
        title="Carouseler: Turn Comedy Clips into Carousels | Comediq"
        description="Turn a stand-up clip into a scrollable Instagram carousel in seconds with the Comediq Carouseler."
      />
      <PageHeader title="Carouseler" subtitle="Turn any clip into a carousel" />
      <h1 className="sr-only">Carouseler: turn any comedy clip into a carousel</h1>
      <iframe
        src={STRIP_APP_URL}
        title="Comediq Carouseler"
        className="w-full border-0"
        style={{ marginTop: "4rem", height: "calc(100vh - 4rem - 6rem)" }}
        allow="clipboard-write"
      />
    </div>
  );
};

export default Strip;
