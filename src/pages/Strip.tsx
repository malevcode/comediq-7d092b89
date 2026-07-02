import PageHeader from "@/components/PageHeader";

const STRIP_APP_URL = "https://strip.comediq.us";

const Strip = () => {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Comic Strip Maker" subtitle="Turn any clip into a comic" />
      <iframe
        src={STRIP_APP_URL}
        title="Comediq Comic Strip Maker"
        className="w-full border-0"
        style={{ marginTop: "4rem", height: "calc(100vh - 4rem - 6rem)" }}
        allow="clipboard-write"
      />
    </div>
  );
};

export default Strip;
