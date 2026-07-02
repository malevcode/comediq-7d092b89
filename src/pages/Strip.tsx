import PageHeader from "@/components/PageHeader";

const STRIP_APP_URL = "https://strip.comediq.us";

const Strip = () => {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Carouseler" subtitle="Turn any clip into a carousel" />
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
